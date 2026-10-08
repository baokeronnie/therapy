"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
/** Polls the server component tree every few seconds. Swap for SSE/WebSocket in production. */
export function Refresher({ ms = 5000 }: { ms?: number }) {
  const r = useRouter();
  useEffect(() => { const t = setInterval(() => r.refresh(), ms); return () => clearInterval(t); }, [r, ms]);
  return null;
}
