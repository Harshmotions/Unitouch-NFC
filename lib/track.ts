"use client";

import type { EventType } from "@/types";

/* Fire-and-forget client-side event ping — safe to import from "use client"
   components. Never throws; analytics failures shouldn't break the page. */
export function track(eventType: EventType, username: string, metadata?: Record<string, unknown>) {
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, username, metadata }),
    keepalive: true,
  }).catch(() => {});
}
