"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { pullAll, pushLesson, pushLimits, pushProduct, setRemoteErrorHandler, setRemoteUser } from "@/lib/remote";
import { auditStore, DEFAULT_LIMITS, limitsStore, productsStore } from "@/lib/store/products";
import { lessonStore } from "@/lib/store/lessons";

interface AuthCtx {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  fullName: string;
  email: string;
  syncError: string | null;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);
const OWNER_KEY = "idrok.owner";

function clearLocal() {
  productsStore.set([]);
  lessonStore.set({ completed: {} });
  limitsStore.set(DEFAULT_LIMITS);
  auditStore.set([]);
}

/**
 * On sign-in: if this device holds another account's data, clear it.
 * If the account is new and this device has data from before sign-up, upload it once.
 * Then the account's data becomes the local cache.
 */
async function syncFor(userId: string) {
  let owner: string | null = null;
  try { owner = localStorage.getItem(OWNER_KEY); } catch { /* ignore */ }
  if (owner && owner !== userId) clearLocal();

  const remote = await pullAll();
  if (!remote) return;

  const local = { products: productsStore.get(), lessons: lessonStore.get(), limits: limitsStore.get() };
  const remoteEmpty = remote.products.length === 0 && Object.keys(remote.lessons.completed).length === 0;
  if (!owner && remoteEmpty) {
    await Promise.all([
      ...local.products.map(pushProduct),
      ...Object.entries(local.lessons.completed).map(([id, day]) => pushLesson(id, day)),
      pushLimits(local.limits),
    ]);
  } else {
    productsStore.set(remote.products);
    lessonStore.set(remote.lessons);
    limitsStore.set(remote.limits ?? DEFAULT_LIMITS);
  }
  try { localStorage.setItem(OWNER_KEY, userId); } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const sb = supabase();
    if (!sb) { setLoading(false); return; }
    setRemoteErrorHandler(setSyncError);
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => { sub.subscription.unsubscribe(); setRemoteErrorHandler(null); };
  }, []);

  const userId = session?.user.id ?? null;
  useEffect(() => {
    setRemoteUser(userId);
    if (!userId) return;
    setSyncError(null);
    void syncFor(userId);
  }, [userId]);

  const signOut = useCallback(async () => {
    await supabase()?.auth.signOut();
    clearLocal();
    try { localStorage.removeItem(OWNER_KEY); } catch { /* ignore */ }
  }, []);

  const meta = (session?.user.user_metadata ?? {}) as { full_name?: string };
  return (
    <Ctx.Provider value={{ configured, loading, session, fullName: meta.full_name ?? "", email: session?.user.email ?? "", syncError, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
