"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PanicButton } from "@/components/shared/PanicButton";

type CheckIn = { date: string; mood: number; craving: number };
type Props = {
  name: string;
  soberSince: string | null;           // ISO date
  todayDone: boolean;
  recent: CheckIn[];                   // last 7, oldest first
  milestones: { id: string; title: string; detail?: string | null }[];
  nextAppt: { startsAt: string; counselorName: string } | null;
};

const MOODS = ["Very low", "Low", "Okay", "Good", "Very good"];

export function PatientDashboard({ name, soberSince, todayDone, recent, milestones, nextAppt }: Props) {
  const router = useRouter();
  const days = soberSince ? Math.max(0, Math.floor((Date.now() - new Date(soberSince).getTime()) / 864e5)) : 0;
  const [mood, setMood] = useState(3);
  const [craving, setCraving] = useState(2);
  const [sober, setSober] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/checkins", {
      method: todayDone ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood, craving, sober }),
    });
    setBusy(false);
    setMsg(res.ok ? "Check-in saved. Thank you for showing up today." : "Could not save. Please try again.");
    if (res.ok) router.refresh();
  }

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto grid max-w-6xl gap-5 px-4 pb-32 pt-6 lg:grid-cols-[1fr_320px] lg:pb-10">
      <header className="lg:col-span-2">
        <h1 className="text-3xl sm:text-4xl">{greet}, {name}.</h1>
        <p className="mt-1 text-ink-soft">One day at a time is a complete plan.</p>
      </header>

      <main id="main" className="grid content-start gap-5">
        {/* Streak: the one memorable element */}
        <section aria-labelledby="streak" className="card flex flex-col items-start gap-6 bg-sage-50 sm:flex-row sm:items-center">
          <div className="relative grid h-36 w-36 shrink-0 place-items-center rounded-full"
               style={{ background: `conic-gradient(#3C7059 ${Math.min(days % 30, 30) / 30 * 360}deg, #DCE9E1 0)` }}>
            <div className="grid h-[7.5rem] w-[7.5rem] place-items-center rounded-full bg-white text-center">
              <div>
                <p className="font-display text-5xl leading-none text-sage-700">{days}</p>
                <p className="text-sm text-ink-soft">{days === 1 ? "day" : "days"}</p>
              </div>
            </div>
          </div>
          <div>
            <h2 id="streak" className="text-2xl">{soberSince ? "You are building something steady" : "Set your start date"}</h2>
            <p className="mt-1 max-w-prose text-ink-soft">
              {soberSince
                ? `Counting from ${new Date(soberSince).toLocaleDateString(undefined, { dateStyle: "long" })}. The ring fills toward your next 30-day mark.`
                : "Ask your counselor to confirm your start date so your streak can begin."}
            </p>
          </div>
        </section>

        {/* Daily check-in */}
        <section aria-labelledby="checkin" className="card">
          <h2 id="checkin" className="text-xl">{todayDone ? "Update today's check-in" : "How are you today?"}</h2>
          <form onSubmit={submit} className="mt-4 grid gap-5">
            <fieldset>
              <legend className="mb-2 font-medium">Mood</legend>
              <div className="grid grid-cols-5 gap-2" role="radiogroup">
                {MOODS.map((label, i) => (
                  <label key={label} className={`flex min-h-[56px] cursor-pointer flex-col items-center justify-center rounded-2xl border px-1 text-center text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-tide-700 ${mood === i + 1 ? "border-sage-600 bg-sage-100 font-semibold" : "border-linen-edge bg-white hover:bg-sage-50"}`}>
                    <input type="radio" name="mood" value={i + 1} checked={mood === i + 1} onChange={() => setMood(i + 1)} className="sr-only" />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="craving" className="flex justify-between font-medium">
                <span>Craving strength</span><span aria-live="polite">{craving} of 10</span>
              </label>
              <input id="craving" type="range" min={0} max={10} value={craving} onChange={(e) => setCraving(+e.target.value)}
                     className="mt-3 h-11 w-full accent-tide-500" aria-valuetext={`${craving} out of 10`} />
              <div className="flex justify-between text-sm text-ink-soft"><span>None</span><span>Intense</span></div>
            </div>

            <label className="flex min-h-[44px] items-center gap-3">
              <input type="checkbox" checked={sober} onChange={(e) => setSober(e.target.checked)} className="h-6 w-6 accent-sage-600" />
              I stayed sober today
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button className="btn-primary" disabled={busy}>{busy ? "Saving" : todayDone ? "Update check-in" : "Save check-in"}</button>
              <p role="status" className="text-sm text-ink-soft">{msg}</p>
            </div>
          </form>
        </section>

        {/* Trend */}
        <section aria-labelledby="trend" className="card">
          <h2 id="trend" className="text-xl">Your last 7 days</h2>
          {recent.length === 0 ? (
            <p className="mt-2 text-ink-soft">Your first check-in will start this chart.</p>
          ) : (
            <ul className="mt-4 flex h-32 items-end gap-2">
              {recent.map((c) => (
                <li key={c.date} className="flex flex-1 flex-col items-center gap-1" aria-label={`${new Date(c.date).toLocaleDateString(undefined, { weekday: "long" })}: mood ${MOODS[c.mood - 1]}, craving ${c.craving} of 10`}>
                  <div className="flex w-full flex-1 items-end gap-0.5">
                    <div className="flex-1 rounded-t-md bg-sage-500" style={{ height: `${c.mood * 20}%` }} />
                    <div className="flex-1 rounded-t-md bg-tide-100 ring-1 ring-tide-500/40" style={{ height: `${Math.max(c.craving, 0.5) * 10}%` }} />
                  </div>
                  <span className="text-xs text-ink-soft">{new Date(c.date).toLocaleDateString(undefined, { weekday: "short" })}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 flex gap-4 text-sm text-ink-soft">
            <span><i className="mr-1 inline-block h-3 w-3 rounded-sm bg-sage-500" />Mood</span>
            <span><i className="mr-1 inline-block h-3 w-3 rounded-sm bg-tide-100 ring-1 ring-tide-500/40" />Craving</span>
          </p>
        </section>
      </main>

      <aside className="grid content-start gap-5" aria-label="Support">
        <PanicButton className="hidden lg:block" />

        <section className="card" aria-labelledby="next">
          <h2 id="next" className="text-lg">Next session</h2>
          {nextAppt ? (
            <p className="mt-2">
              {new Date(nextAppt.startsAt).toLocaleString(undefined, { weekday: "long", hour: "numeric", minute: "2-digit", month: "short", day: "numeric" })}
              <span className="block text-ink-soft">with {nextAppt.counselorName}</span>
            </p>
          ) : <p className="mt-2 text-ink-soft">Nothing booked yet.</p>}
          <Link href="/patient/schedule" className="btn-quiet mt-4 w-full">{nextAppt ? "Manage sessions" : "Book a session"}</Link>
        </section>

        <section className="card" aria-labelledby="ms">
          <h2 id="ms" className="text-lg">Milestones</h2>
          {milestones.length === 0 ? <p className="mt-2 text-ink-soft">Your first badge arrives at day 7.</p> : (
            <ul className="mt-3 grid gap-3">
              {milestones.map((m) => (
                <li key={m.id} className="rounded-2xl bg-sage-50 px-4 py-3">
                  <p className="font-medium">{m.title}</p>
                  {m.detail && <p className="text-sm text-ink-soft">{m.detail}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <Link href="/patient/chat" className="btn-quiet w-full">Message your counselor</Link>
      </aside>

      {/* Mobile: fixed to viewport, clear of the safe area */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-linen-edge bg-linen/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <PanicButton />
      </div>
    </div>
  );
}
