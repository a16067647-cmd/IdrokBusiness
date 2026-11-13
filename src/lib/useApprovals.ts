"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";

/** How many purchase checks the user has sent to the Approval Center, and how many were approved. */
export function useApprovalCounts() {
  const { session } = useAuth();
  const [counts, setCounts] = useState({ sent: 0, approved: 0, loaded: false });
  useEffect(() => {
    const sb = supabase();
    if (!sb || !session) return;
    let live = true;
    void sb.from("approvals").select("status").then(({ data }) => {
      if (!live) return;
      const rows = data ?? [];
      setCounts({ sent: rows.length, approved: rows.filter((a) => a.status === "approved").length, loaded: true });
    });
    return () => { live = false; };
  }, [session]);
  return counts;
}
