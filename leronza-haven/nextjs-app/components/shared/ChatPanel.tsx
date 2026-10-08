"use client";
import { useCallback, useEffect, useRef, useState } from "react";
type Msg = { id: string; senderId: string; body: string; createdAt: string; editedAt: string | null; deletedAt: string | null; channel: string };
const day = (t: string) => new Date(t).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
export function ChatPanel({ careLinkId, meId, withName }: { careLinkId: string; meId: string; withName: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]), [q, setQ] = useState(""), [text, setText] = useState(""), [edit, setEdit] = useState<string | null>(null), [draft, setDraft] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const load = useCallback(async () => { const r = await fetch(`/api/messages?careLinkId=${careLinkId}&q=${encodeURIComponent(q)}`); if (r.ok) setMsgs(await r.json()); }, [careLinkId, q]);
  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t); }, [load]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);
  const call = async (url: string, method: string, body?: unknown) => { await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }); await load(); };
  let last = "";
  return (
    <main id="main" className="card mx-auto my-6 flex max-w-3xl flex-col gap-3 !p-0" style={{ height: "75vh" }}>
      <div className="flex flex-wrap items-center gap-3 border-b border-linen-edge p-4">
        <h1 className="text-xl">{withName}</h1>
        <label className="sr-only" htmlFor="q">Search messages</label>
        <input id="q" type="search" placeholder="Search this conversation" value={q} onChange={(e) => setQ(e.target.value)} className="ml-auto min-h-[44px] rounded-xl border border-linen-edge px-3" />
      </div>
      <div role="log" aria-live="polite" tabIndex={0} className="flex flex-1 flex-col gap-2 overflow-y-auto px-4">
        {msgs.length === 0 && <p className="m-auto text-ink-soft">{q ? "No messages match your search." : "No messages yet. Say hello."}</p>}
        {msgs.map((m) => { const d = day(m.createdAt), sep = d !== last; last = d; const mine = m.senderId === meId;
          return (<div key={m.id} className="contents">
            {sep && <div className="my-2 self-center rounded-pill bg-sage-50 px-3 text-sm text-ink-soft">{d}</div>}
            <div className={`flex max-w-[82%] flex-col gap-1 ${mine ? "items-end self-end" : ""}`}>
              {m.deletedAt ? <div className="rounded-2xl border border-dashed border-linen-edge px-4 py-2 italic text-ink-soft">Message removed</div>
               : edit === m.id ? <div className="flex gap-2"><textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="rounded-xl border border-linen-edge p-2" />
                  <button className="btn-primary !min-h-[40px]" onClick={async () => { await call(`/api/messages/${m.id}`, "PATCH", { body: draft }); setEdit(null); }}>Save</button></div>
               : <div className={`whitespace-pre-wrap break-words rounded-2xl border px-4 py-2 ${mine ? "border-sage-700 bg-sage-700 text-white" : "border-linen-edge bg-sage-50"}`}>{m.body}</div>}
              <div className="flex gap-2 text-xs text-ink-soft">
                <span>{new Date(m.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}{m.editedAt && !m.deletedAt ? " · Edited" : ""}{m.channel === "SMS" ? " · Text message" : ""}</span>
                {mine && !m.deletedAt && edit !== m.id && <>
                  <button className="underline" onClick={() => { setEdit(m.id); setDraft(m.body); }}>Edit</button>
                  <button className="underline" onClick={() => call(`/api/messages/${m.id}`, "DELETE")}>Remove</button></>}
              </div>
            </div></div>); })}
        <div ref={end} />
      </div>
      <form className="flex gap-2 border-t border-linen-edge p-3" onSubmit={async (e) => { e.preventDefault(); if (!text.trim()) return; const t = text; setText(""); await call("/api/messages", "POST", { careLinkId, body: t }); }}>
        <label className="sr-only" htmlFor="m">Message</label>
        <textarea id="m" rows={1} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message" className="min-h-[46px] flex-1 resize-none rounded-xl border border-linen-edge px-3 py-2"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} />
        <button className="btn-primary">Send</button>
      </form>
    </main>
  );
}
