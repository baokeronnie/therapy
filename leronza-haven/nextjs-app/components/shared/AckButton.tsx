"use client";
import { useRouter } from "next/navigation";
export function AckButton({ id, label }: { id: string; label: string }) {
  const r = useRouter();
  return <button className="btn-quiet !min-h-[40px]" onClick={async () => { await fetch("/api/panic", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); r.refresh(); }}>{label}</button>;
}
