import Anthropic from "@anthropic-ai/sdk";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { calculateProfit } from "@/lib/profit";
import {
  AGENT_IDS, DAILY_LIMIT, DAILY_LIMIT_ADMIN, OUTPUT_SCHEMA, SYSTEM_PROMPT,
  buildUserMessage, cleanInput, validateOutput, type AgentContext, type AgentId, type Lang,
} from "@/lib/agents/core";

// Server-only. The Anthropic key lives in the server environment (ANTHROPIC_API_KEY)
// and never reaches the browser or the Android app.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-opus-5-5";
const json = (body: unknown, status = 200) => Response.json(body, { status });

/** A Supabase client acting as the signed-in user, so Row Level Security applies. */
async function userClient(req: Request): Promise<{ sb: SupabaseClient; userId: string } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!url || !anon || !token) return null;
  const sb = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;
  return { sb, userId: data.user.id };
}

async function usage(sb: SupabaseClient, userId: string) {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const [{ count }, { data: profile }] = await Promise.all([
    sb.from("agent_runs").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since),
    sb.from("profiles").select("level, is_admin").eq("id", userId).maybeSingle(),
  ]);
  const limit = profile?.is_admin ? DAILY_LIMIT_ADMIN : DAILY_LIMIT;
  return { used: count ?? 0, limit, level: (profile?.level as number | undefined) ?? 0 };
}

/** GET: whether AI is switched on, and how many runs are left today. */
export async function GET(req: Request) {
  const auth = await userClient(req);
  if (!auth) return json({ error: "unauthorized" }, 401);
  const u = await usage(auth.sb, auth.userId);
  return json({ configured: Boolean(process.env.ANTHROPIC_API_KEY), used: u.used, limit: u.limit });
}

export async function POST(req: Request) {
  const auth = await userClient(req);
  if (!auth) return json({ error: "unauthorized" }, 401);
  if (!process.env.ANTHROPIC_API_KEY) return json({ error: "not_configured" }, 503);

  let body: { agent?: string; input?: unknown; lang?: string };
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  const agent = body.agent as AgentId;
  if (!AGENT_IDS.includes(agent)) return json({ error: "bad_request" }, 400);
  const lang: Lang = body.lang === "ru" ? "ru" : "uz";
  const input = cleanInput(agent, body.input);
  if (!input) return json({ error: "missing_input" }, 400);

  const { sb, userId } = auth;
  const u = await usage(sb, userId);
  if (u.used >= u.limit) return json({ error: "daily_limit", used: u.used, limit: u.limit }, 429);

  // Context from the database (the user's own rows only, via RLS).
  const [{ data: rulesRow }, { data: products }] = await Promise.all([
    sb.from("level_rules").select("rules").lte("level", u.level).order("level", { ascending: false }).limit(1).maybeSingle(),
    sb.from("products").select("*").eq("user_id", userId).order("updated_at", { ascending: false }).limit(30),
  ]);
  const ctx: AgentContext = { lang, level: u.level, rules: (rulesRow?.rules as Record<string, unknown>) ?? {} };
  const list = products ?? [];
  ctx.rejected = list.filter((p) => p.status === "rejected").map((p) => ({ name: p.name, reason: p.reject_reason ?? "" })).slice(0, 15);

  if (agent === "manager") {
    const num = (v: unknown) => (v == null ? undefined : Number(v));
    ctx.products = list.map((p) => {
      const r = calculateProfit({
        salePrice: num(p.sale_price), unitCost: num(p.unit_cost), shippingPerUnit: num(p.shipping_per_unit),
        feePct: num(p.fee_pct), fulfillmentFee: num(p.fulfillment_fee), otherPerUnit: num(p.other_per_unit),
        adPerUnit: num(p.ad_per_unit), quantity: num(p.quantity),
      });
      return {
        name: p.name, marketplace: p.marketplace, status: p.status,
        currency: p.marketplace === "uzum" ? "UZS" : "USD",
        app_calculated: r.complete
          ? { profit_per_unit: r.profitPerUnit, margin_pct: r.marginPct, roi_pct: r.roiPct, break_even_price: r.breakEvenPrice, order_profit: r.orderProfit }
          : { missing_inputs: r.missing },
      };
    });
    const [{ data: approvals }, { count: lessonsDone }, { count: lessonsTotal }] = await Promise.all([
      sb.from("approvals").select("action, status, quantity, max_spend, currency, product_id").eq("user_id", userId).limit(20),
      sb.from("lesson_progress").select("lesson_id", { count: "exact", head: true }).eq("user_id", userId),
      sb.from("lessons").select("id", { count: "exact", head: true }).lte("level", u.level),
    ]);
    const names = new Map(list.map((p) => [p.id, p.name]));
    ctx.approvals = (approvals ?? []).map((a) => ({ product: names.get(a.product_id) ?? "?", action: a.action, status: a.status, quantity: a.quantity, max_spend: a.max_spend, currency: a.currency }));
    ctx.lessonsDone = lessonsDone ?? 0;
    ctx.lessonsTotal = lessonsTotal ?? 0;
  }

  const client = new Anthropic();
  let message: Anthropic.Beta.BetaMessage;
  try {
    message = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: OUTPUT_SCHEMA as unknown as Record<string, unknown> } },
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: buildUserMessage(agent, input, ctx) }],
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return json({ error: "busy" }, 503);
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) return json({ error: "not_configured" }, 503);
    if (err instanceof Anthropic.APIError) { console.error("[agents] API error", err.status, err.message); return json({ error: "ai_error" }, 502); }
    console.error("[agents] request failed", err);
    return json({ error: "ai_error" }, 502);
  }

  if (message.stop_reason === "refusal") return json({ error: "refused" }, 422);
  if (message.stop_reason === "max_tokens") return json({ error: "ai_error" }, 502);
  const text = message.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")?.text ?? "";
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { parsed = null; }
  const output = validateOutput(parsed);
  if (!output) return json({ error: "ai_error" }, 502);

  const { error: insertError } = await sb.from("agent_runs").insert({ user_id: userId, agent, lang, input, output });
  if (insertError) console.error("[agents] could not save run", insertError.message);

  return json({ output, used: u.used + 1, limit: u.limit });
}
