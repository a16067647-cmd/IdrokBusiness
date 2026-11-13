"use client";

import { supabase } from "@/lib/supabase/client";
import type { AgentId, AgentInput, AgentOutput, Lang } from "./core";

async function token(): Promise<string | null> {
  const { data } = (await supabase()?.auth.getSession()) ?? { data: { session: null } };
  return data.session?.access_token ?? null;
}

export interface AgentStatus { configured: boolean; used: number; limit: number }

export async function agentStatus(): Promise<AgentStatus | null> {
  const tk = await token();
  if (!tk) return null;
  const r = await fetch("/api/agents", { headers: { Authorization: `Bearer ${tk}` } });
  return r.ok ? ((await r.json()) as AgentStatus) : null;
}

export type RunResult =
  | { ok: true; output: AgentOutput; used: number; limit: number }
  | { ok: false; error: string; limit?: number };

export async function runAgent(agent: AgentId, input: AgentInput, lang: Lang): Promise<RunResult> {
  const tk = await token();
  if (!tk) return { ok: false, error: "unauthorized" };
  try {
    const r = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tk}` },
      body: JSON.stringify({ agent, input, lang }),
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: body.error ?? "ai_error", limit: body.limit };
    return { ok: true, output: body.output, used: body.used, limit: body.limit };
  } catch {
    return { ok: false, error: "ai_error" };
  }
}

export interface RunRow { id: number; agent: AgentId; input: AgentInput; output: AgentOutput | null; created_at: string }

export async function recentRuns(): Promise<RunRow[]> {
  const sb = supabase();
  if (!sb) return [];
  const { data } = await sb.from("agent_runs").select("id, agent, input, output, created_at").order("created_at", { ascending: false }).limit(10);
  return (data ?? []) as RunRow[];
}
