"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
const T = ["STRESS", "LONELINESS", "BOREDOM", "PEOPLE", "PLACE", "CONFLICT", "CELEBRATION", "OTHER"];
type Row = { id: string; createdAt: string; trigger: string; intensity: number; helped: string | null };
export function Trackers({ rows }: { rows: Row[] }) {
  const r = useRouter(); const [t, setT] = useState("STRESS"), [i, setI] = useState(5), [h, setH] = useState(""), [busy, setBusy] = useState(false);
  const counts = T.map((k) => [k, rows.filter((x) => x.trigger === k).length] as const).filter(([, n]) => n).sort((a, b) => b[1] - a[1]);
  const max = counts[0]?.[1] ?? 1;
  const call = (m: string, b: unknown) => fetch("/api/triggers", { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
  return (
    <main id="main" className="mx-auto grid max-w-4xl gap-5 px-4 py-6 md:grid-cols-2">
      <header className="md:col-span-2"><h1 className="text-3xl">Trigger tracker</h1><p className="text-ink-soft">Noticing what sets off an urge is the first step to getting ahead of it.</p></header>
      <form className="card grid content-start gap-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); await call("POST", { trigger: t, intensity: i, helped: h }); setBusy(false); setH(""); r.refresh(); }}>
        <h2 className="text-xl">Log an urge</h2>
        <fieldset><legend className="mb-2 font-medium">What set it off?</legend>
          <div className="flex flex-wrap gap-2">{T.map((k) => <label key={k} className={`cursor-pointer rounded-pill border px-4 py-2 text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-tide-700 ${t === k ? "border-sage-600 bg-sage-100 font-semibold" : "border-linen-edge bg-white"}`}>
            <input type="radio" name="t" className="sr-only" checked={t === k} onChange={() => setT(k)} />{k[0] + k.slice(1).toLowerCase()}</label>)}</div></fieldset>
        <div><label htmlFor="int" className="flex justify-between font-medium"><span>How strong?</span><span>{i} of 10</span></label>
          <input id="int" type="range" min={1} max={10} value={i} onChange={(e) => setI(+e.target.value)} className="mt-2 h-11 w-full accent-tide-500" /></div>
        <label className="font-medium">What helped? <span className="font-normal text-ink-soft">(optional, private)</span>
          <textarea value={h} onChange={(e) => setH(e.target.value)} maxLength={500} rows={2} className="mt-1 w-full rounded-xl border border-linen-edge p-3" /></label>
        <button className="btn-primary" disabled={busy}>Save</button>
      </form>
      <section className="card"><h2 className="text-xl">Your patterns (recent)</h2>
        {counts.length === 0 ? <p className="mt-2 text-ink-soft">Log a few urges and your patterns will show up here.</p> :
          <ul className="mt-3 grid gap-2">{counts.map(([k, n]) => <li key={k}><div className="flex justify-between text-sm"><span>{k[0] + k.slice(1).toLowerCase()}</span><span>{n}</span></div><div className="h-3 rounded-pill bg-sage-50"><div className="h-3 rounded-pill bg-sage-500" style={{ width: `${(n / max) * 100}%` }} /></div></li>)}</ul>}</section>
      <section className="card md:col-span-2"><h2 className="text-xl">History</h2>
        <ul className="mt-3 grid gap-2">{rows.length === 0 && <li className="text-ink-soft">Nothing logged yet.</li>}
          {rows.map((x) => <li key={x.id} className="flex items-start gap-3 rounded-2xl bg-sage-50 px-4 py-2"><div className="flex-1"><b>{x.trigger[0] + x.trigger.slice(1).toLowerCase()}</b> · strength {x.intensity}/10
            <div className="text-sm text-ink-soft">{new Date(x.createdAt).toLocaleString()}{x.helped ? ` · Helped: ${x.helped}` : ""}</div></div>
            <button className="text-sm underline" onClick={async () => { await call("DELETE", { id: x.id }); r.refresh(); }}>Delete</button></li>)}</ul></section>
    </main>
  );
}
