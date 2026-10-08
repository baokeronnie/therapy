"use client";
import { useRef, useState } from "react";

const HOLD_MS = 2000;

/** Hold 2 seconds (pointer, touch, or Space/Enter) to alert the Guardian. */
export function PanicButton({ className = "" }: { className?: string }) {
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<"idle" | "holding" | "sent" | "error">("idle");
  const raf = useRef(0);
  const t0 = useRef(0);

  async function fire() {
    setProgress(0);
    try {
      const r = await fetch("/api/panic", { method: "POST" });
      setState(r.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }
  const tick = (t: number) => {
    const p = Math.min((t - t0.current) / HOLD_MS, 1);
    setProgress(p);
    if (p >= 1) return void fire();
    raf.current = requestAnimationFrame(tick);
  };
  const begin = () => {
    if (state === "sent") return;
    cancelAnimationFrame(raf.current);
    setState("holding");
    t0.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  };
  const cancel = () => {
    cancelAnimationFrame(raf.current);
    setState((s) => (s === "holding" ? "idle" : s));
    setProgress(0);
  };

  const label =
    state === "sent" ? "Your guardian has been alerted" :
    state === "error" ? "Could not send. Call your local emergency line." :
    state === "holding" ? "Keep holding" : "Hold for 2 seconds to get help";

  return (
    <div className={className}>
      <button
        type="button"
        onPointerDown={begin} onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel}
        onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); begin(); } }}
        onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") cancel(); }}
        onContextMenu={(e) => e.preventDefault()}
        aria-describedby="panic-help"
        className="relative flex min-h-[56px] w-full touch-none select-none items-center justify-center gap-3 overflow-hidden rounded-pill bg-coral-600 px-6 text-base font-semibold text-white shadow-soft transition-colors hover:bg-coral-700"
      >
        <span aria-hidden className="absolute inset-y-0 left-0 bg-coral-700/80" style={{ width: `${progress * 100}%` }} />
        <span className="relative">{state === "sent" ? "Help is on the way" : "I need help now"}</span>
      </button>
      <p id="panic-help" role="status" aria-live="assertive" className="mt-2 text-center text-sm text-ink-soft">{label}</p>
    </div>
  );
}
