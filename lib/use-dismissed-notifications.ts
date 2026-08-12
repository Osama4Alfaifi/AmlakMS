"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "dismissed-notifications";

// computeNotifications() re-derives the same notification every render (no
// backing document to delete), so "dismissing" one just remembers its
// stable id (see lib/notifications.ts's `contract-${id}`/`payment-${id}-${id}`
// scheme) locally — it naturally reappears once its underlying condition is
// no longer the same occurrence (a new payment cycle gets a new id).
export function useDismissedNotifications() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!stored) return;
    try {
      setDismissed(new Set(JSON.parse(stored) as string[]));
    } catch {
      // corrupt/old storage value — ignore and start fresh
    }
  }, []);

  function dismiss(id: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }

  return { isDismissed: (id: string) => dismissed.has(id), dismiss };
}
