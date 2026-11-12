"use client";

import { useEffect, useState } from "react";
import { dayKey } from "@/lib/lessons/progress";

/** Today's local date, known only after mount (keeps server and client HTML identical). */
export function useToday(): string | null {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    setToday(dayKey(new Date()));
    const id = setInterval(() => setToday(dayKey(new Date())), 60_000);
    return () => clearInterval(id);
  }, []);
  return today;
}
