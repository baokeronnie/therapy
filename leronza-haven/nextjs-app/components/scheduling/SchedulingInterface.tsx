"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Appt = { id: string; startsAt: string; endsAt: string; status: "BOOKED" | "RESCHEDULED" | "CANCELLED" | "COMPLETED" };
type Props = {
  counselor: { id: string; name: string; timeZone: string };
  slots: string[];       // open slot start times, ISO UTC
  appointments: Appt[];
};

const viewerTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const dayKey = (iso: string, tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(iso));
const fmtTime = (iso: string, tz: string) => new Intl.DateTimeFormat(undefined, { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
const fmtDay = (iso: string, tz: string, long = false) =>
  new Intl.DateTimeFormat(undefined, { timeZone: tz, weekday: long ? "long" : "short", day: "numeric", month: "short" }).format(new Date(iso));

export function SchedulingInterface({ counselor, slots, appointments }: Props) {
  const router = useRouter();
  const tz = useMemo(viewerTz, []);
  const byDay = useMemo(() => {
    const m = new Map<string, string[]>();
    slots.forEach((s) => { const k = dayKey(s, tz); m.set(k, [...(m.get(k) ?? []), s]); });
    return m;
  }, [slots, tz]);
  const dayKeys = [...byDay.keys()].sort();

  const [day, setDay] = useState(dayKeys[0] ?? "");
  const [slot, setSlot] = useState<string | null>(null);
  const [moving, setMoving] = useState<string | null>(null);     // appointment being rescheduled
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const upcoming = appointments.filter((a) => a.status !== "CANCELLED" && a.status !== "COMPLETED" && new Date(a.endsAt) > new Date())
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));

  async function call(url: string, method: string, body: unknown, ok: string) {
    setBusy(true);
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    setNote(r.ok ? ok : r.status === 409 ? "That time was just taken. Please choose another." : "Something went wrong. Please try again.");
    if (r.ok) { setSlot(null); setMoving(null); setCancelling(null); setReason(""); router.refresh(); }
  }

  const confirm = () => {
    if (!slot) return;
    moving
      ? call(`/api/appointments/${moving}`, "PATCH", { startsAt: slot }, "Session moved.")
      : call("/api/appointments", "POST", { counselorId: counselor.id, startsAt: slot }, "Session booked.");
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[1fr_380px]">
      <header className="lg:col-span-2">
        <h1 className="text-3xl sm:text-4xl">{moving ? "Choose a new time" : "Book a session"}</h1>
        <p className="mt-1 text-ink-soft">with {counselor.name}. Times shown in your time zone ({tz.replace("_", " ")}).</p>
        {counselor.timeZone !== tz && <p className="text-sm text-ink-soft">{counselor.name} is in {counselor.timeZone.replace("_", " ")}.</p>}
      </header>

      <main id="main" className="card">
        {dayKeys.length === 0 ? (
          <p>No open times right now. Message your counselor to ask for more availability.</p>
        ) : (
          <>
            <div role="tablist" aria-label="Available days" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-3">
              {dayKeys.map((k) => (
                <button key={k} role="tab" aria-selected={day === k} onClick={() => { setDay(k); setSlot(null); }}
                  className={`min-h-[56px] shrink-0 rounded-2xl border px-4 text-sm transition-colors ${day === k ? "border-sage-700 bg-sage-700 text-white" : "border-linen-edge bg-white hover:bg-sage-50"}`}>
                  {fmtDay(byDay.get(k)![0], tz)}
                </button>
              ))}
            </div>

            <h2 className="mt-3 text-xl">{day && fmtDay(byDay.get(day)![0], tz, true)}</h2>
            <ul role="tabpanel" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(byDay.get(day) ?? []).map((s) => (
                <li key={s}>
                  <button aria-pressed={slot === s} onClick={() => setSlot(s)}
                    className={`min-h-[48px] w-full rounded-2xl border text-base transition-colors ${slot === s ? "border-tide-700 bg-tide-100 font-semibold" : "border-linen-edge bg-white hover:bg-sage-50"}`}>
                    {fmtTime(s, tz)}
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-linen-edge pt-4">
              <button className="btn-primary" disabled={!slot || busy} onClick={confirm}>
                {slot ? `${moving ? "Move to" : "Book"} ${fmtTime(slot, tz)}` : "Pick a time"}
              </button>
              {moving && <button className="btn-quiet" onClick={() => { setMoving(null); setSlot(null); }}>Keep original time</button>}
            </div>
          </>
        )}
        <p role="status" aria-live="polite" className="mt-3 text-sm text-ink-soft">{note}</p>
      </main>

      <aside aria-labelledby="up" className="grid content-start gap-3">
        <h2 id="up" className="text-xl">Your sessions</h2>
        {upcoming.length === 0 && <p className="card text-ink-soft">No upcoming sessions. Pick a time to book one.</p>}
        {upcoming.map((a) => (
          <article key={a.id} className="card flex gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-sage-100 text-center text-sage-700" aria-hidden>
              <div><p className="text-xs leading-none">{new Intl.DateTimeFormat(undefined, { timeZone: tz, month: "short" }).format(new Date(a.startsAt))}</p>
              <p className="font-display text-2xl leading-none">{new Intl.DateTimeFormat(undefined, { timeZone: tz, day: "numeric" }).format(new Date(a.startsAt))}</p></div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold">{fmtDay(a.startsAt, tz, true)}, {fmtTime(a.startsAt, tz)}</h3>
              <p className="text-sm text-ink-soft">{counselor.name}{a.status === "RESCHEDULED" ? " (rescheduled)" : ""}</p>

              {cancelling === a.id ? (
                <div className="mt-3">
                  <label htmlFor={`r-${a.id}`} className="text-sm font-medium">Reason for cancelling</label>
                  <textarea id={`r-${a.id}`} value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
                    className="mt-1 w-full rounded-xl border border-linen-edge p-2" />
                  <div className="mt-2 flex gap-2">
                    <button className="btn-primary" disabled={!reason.trim() || busy}
                      onClick={() => call(`/api/appointments/${a.id}`, "DELETE", { reason }, "Session cancelled.")}>Cancel session</button>
                    <button className="btn-quiet" onClick={() => setCancelling(null)}>Keep it</button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <button className="btn-quiet !min-h-[44px]" onClick={() => { setMoving(a.id); setSlot(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Reschedule</button>
                  <button className="btn-quiet !min-h-[44px]" onClick={() => setCancelling(a.id)}>Cancel</button>
                </div>
              )}
            </div>
          </article>
        ))}
      </aside>
    </div>
  );
}
