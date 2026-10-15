"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
const PROMPTS = ["What is one thing I am grateful for today?", "What was the hardest moment today, and how did I get through it?", "What would I tell a friend in my position?", "What am I proud of this week?", "Who supports me, and how can I lean on them?", "What does my life look like one year from now?"];
type E = { id: string; createdAt: string; prompt: string | null; body: string; shared: boolean };
export function Journal({ entries }: { entries: E[] }) {
  const r = useRouter(); const [p, setP] = useState(PROMPTS[Math.floor(Date.now() / 864e5) % PROMPTS.length]), [b, setB] = useState(""), [sh, setSh] = useState(false);
  const call = async (m: string, body: unknown) => { await fetch("/api/journal", { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); r.refresh(); };
  return (
    <main id="main" className="mx-auto grid max-w-3xl gap-5 px-4 py-6">
      <header><h1 className="text-3xl">Journal</h1><p className="text-ink-soft">Private by default and encrypted. Your care team only sees an entry if you choose to share it.</p></header>
      <form className="card grid gap-3" onSubmit={async (e) => { e.preventDefault(); if (!b.trim()) return; await call("POST", { body: b, prompt: p, shared: sh }); setB(""); setSh(false); }}>
        <label className="font-medium" htmlFor="pr">Prompt</label>
        <div className="flex gap-2"><select id="pr" value={p} onChange={(e) => setP(e.target.value)} className="min-h-[44px] flex-1 rounded-xl border border-linen-edge px-3">{PROMPTS.map((x) => <option key={x}>{x}</option>)}</select></div>
        <label className="sr-only" htmlFor="jb">Your entry</label>
        <textarea id="jb" value={b} onChange={(e) => setB(e.target.value)} rows={5} maxLength={5000} placeholder="Write freely. Nobody is grading this." className="w-full rounded-xl border border-linen-edge p-3" />
        <label className="flex min-h-[44px] items-center gap-3 text-sm"><input type="checkbox" checked={sh} onChange={(e) => setSh(e.target.checked)} className="h-6 w-6 accent-sage-600" />Share this entry with my counselor</label>
        <button className="btn-primary">Save entry</button>
      </form>
      <ul className="grid gap-3">
        {entries.length === 0 && <li className="card text-ink-soft">Your entries will appear here.</li>}
        {entries.map((x) => <li key={x.id} className="card">
          <p className="text-sm text-ink-soft">{new Date(x.createdAt).toLocaleString()}{x.prompt ? ` · ${x.prompt}` : ""}</p>
          <p className="mt-2 whitespace-pre-wrap">{x.body}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <button className="underline" onClick={() => call("PATCH", { id: x.id, shared: !x.shared })}>{x.shared ? "Shared with counselor. Make private" : "Private. Share with counselor"}</button>
            <button className="underline" onClick={() => confirm("Delete this entry?") && call("DELETE", { id: x.id })}>Delete</button></div></li>)}
      </ul>
    </main>
  );
}
