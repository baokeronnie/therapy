"use client";
import { useEffect, useRef, useState } from "react";
// Inhale 4, hold 7, exhale 8 (the 4-7-8 pattern)
const PHASES: [string, number][] = [["Breathe in", 4], ["Hold", 7], ["Breathe out", 8]];
function Breathing() {
  const [on, setOn] = useState(false), [ph, setPh] = useState(0), [left, setLeft] = useState(4), [rounds, setRounds] = useState(0);
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => setLeft((l) => { if (l > 1) return l - 1; setPh((p) => { const n = (p + 1) % 3; if (n === 0) setRounds((x) => x + 1); setLeft(PHASES[n][1]); return n; }); return l; }), 1000);
    return () => clearInterval(t);
  }, [on]);
  return (
    <section className="card text-center" aria-labelledby="b"><h2 id="b" className="text-xl">4-7-8 breathing</h2>
      <p className="text-ink-soft">Slow breathing calms the body&apos;s alarm response. Try 4 rounds.</p>
      <div className="mx-auto my-5 grid h-40 w-40 place-items-center rounded-full bg-sage-100 transition-transform duration-1000 ease-in-out motion-reduce:transition-none" style={{ transform: on && ph === 0 ? "scale(1.15)" : on && ph === 2 ? "scale(.85)" : "scale(1)" }} aria-hidden>
        <span className="font-display text-4xl text-sage-700">{on ? left : ""}</span></div>
      <p role="status" aria-live="polite" className="min-h-[1.5rem] text-lg font-medium">{on ? PHASES[ph][0] : "Ready when you are"}</p>
      <p className="text-sm text-ink-soft">{rounds > 0 && `${rounds} round${rounds > 1 ? "s" : ""} complete`}</p>
      <button className="btn-primary mt-3" onClick={() => { setOn(!on); setPh(0); setLeft(4); if (on) setRounds(0); }}>{on ? "Stop" : "Start"}</button></section>
  );
}
function UrgeTimer() {
  const [s, setS] = useState(600), [on, setOn] = useState(false), id = useRef<ReturnType<typeof setInterval>>();
  useEffect(() => { if (!on) return; id.current = setInterval(() => setS((x) => (x > 0 ? x - 1 : 0)), 1000); return () => clearInterval(id.current); }, [on]);
  const m = String(Math.floor(s / 60)).padStart(2, "0"), sec = String(s % 60).padStart(2, "0");
  return (
    <section className="card text-center" aria-labelledby="u"><h2 id="u" className="text-xl">Ride the urge: 10 minutes</h2>
      <p className="text-ink-soft">Urges rise, peak and fall, usually within 10 to 20 minutes. Watch it like a wave instead of fighting it.</p>
      <p className="my-4 font-display text-6xl text-sage-700" aria-live="off">{m}:{sec}</p>
      <p role="status" className="min-h-[1.5rem]">{s === 0 ? "You rode it out. That took real strength." : on ? "Notice where you feel it. Breathe. It will pass." : ""}</p>
      <div className="mt-3 flex justify-center gap-2"><button className="btn-primary" onClick={() => setOn(!on)} disabled={s === 0}>{on ? "Pause" : "Start"}</button><button className="btn-quiet" onClick={() => { setOn(false); setS(600); }}>Reset</button></div></section>
  );
}
const STEPS: [number, string][] = [[5, "things you can see"], [4, "things you can touch"], [3, "things you can hear"], [2, "things you can smell"], [1, "thing you can taste"]];
function Grounding() {
  const [i, setI] = useState(0);
  return (
    <section className="card" aria-labelledby="g"><h2 id="g" className="text-xl">5-4-3-2-1 grounding</h2>
      <p className="text-ink-soft">Bring your attention back to the present moment.</p>
      {i < 5 ? <p className="my-5 text-center text-2xl" role="status">Name <b className="font-display text-4xl text-sage-700">{STEPS[i][0]}</b> {STEPS[i][1]}</p> : <p className="my-5 text-center text-xl" role="status">Well done. Take one more slow breath.</p>}
      <div className="flex justify-center gap-2">{i < 5 ? <button className="btn-primary" onClick={() => setI(i + 1)}>{i === 4 ? "Finish" : "Next"}</button> : null}<button className="btn-quiet" onClick={() => setI(0)}>Start over</button></div></section>
  );
}
export function Toolkit() {
  return (
    <main id="main" className="mx-auto grid max-w-4xl gap-5 px-4 py-6 md:grid-cols-2">
      <header className="md:col-span-2"><h1 className="text-3xl">Coping toolkit</h1><p className="text-ink-soft">Quick tools for a hard moment. If you are in danger, use the help button or call your local emergency number.</p></header>
      <Breathing /><UrgeTimer /><div className="md:col-span-2"><Grounding /></div>
    </main>
  );
}
