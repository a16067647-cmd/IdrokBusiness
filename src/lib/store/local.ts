"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny persisted store on localStorage. Used until Supabase sign-up is connected;
 * the same shapes are then stored per account with Row Level Security.
 */
export function createLocalStore<T>(key: string, initial: T) {
  let state: T = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  const load = () => {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = localStorage.getItem(key);
      if (raw) state = JSON.parse(raw) as T;
    } catch { /* storage unavailable or corrupt: start empty */ }
  };

  return {
    get(): T { load(); return state; },
    set(next: T | ((prev: T) => T)) {
      load();
      state = typeof next === "function" ? (next as (p: T) => T)(state) : next;
      try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* ignore */ }
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
    use(): T {
      return useSyncExternalStore(this.subscribe, () => this.get(), () => initial);
    },
  };
}
