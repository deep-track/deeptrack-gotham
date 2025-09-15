"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/lib/store";

export default function HydrateHistory() {
  const setCachedOrders = useDashboardStore((s) => s.setCachedOrders);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch("/api/orders?limit=50", { signal: controller.signal });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && Array.isArray(json)) {
          setCachedOrders(json);
        }
      } catch (_e) {
        // ignore prefetch errors
      }
    };
    // Prefetch shortly after mount to avoid competing with critical resources
    const t = setTimeout(load, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
      controller.abort();
    };
  }, [setCachedOrders]);

  return null;
}


