"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
const inp = "mt-1 min-h-[44px] w-full rounded-xl border border-linen-edge px-3";
type P = { name: string; email: string; phone: string; emergencyName: string; emergencyPhone: string; emergencyRelation: string; preferredContact: string; soberSince: string; dailySpend: string; deletionRequested: boolean };
export function Settings({ p }: { p: P }) {
  const r = useRouter(); const [msg, setMsg] = useState(""), [busy, setBusy] = useState(false), [del, setDel] = useState(p.deletionRequested);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMsg("");
    const f = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    const res = await fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      name: f.name, phone: f.phone, emergencyName: f.emergencyName, emergencyPhone: f.emergencyPhone, emergencyRelation: f.emergencyRelation, preferredContact: f.preferredContact,
      soberSince: f.soberSince || null, dailySpend: f.dailySpend ? +f.dailySpend : null }) });
    setBusy(false); setMsg(res.ok ? "Saved." : (await res.json().catch(() => ({}))).error || "Could not save."); if (res.ok) r.refresh();
  }
  return (
    <main id="main" className="mx-auto grid max-w-2xl gap-5 px-4 py-6">
      <h1 className="text-3xl">Settings &amp; privacy</h1>
      <form onSubmit={save} className="card grid gap-4">
        <h2 className="text-xl">Your details</h2>
        <p className="text-sm text-ink-soft">Signed in as {p.email}</p>
        <label>Full name<input name="name" required defaultValue={p.name} className={inp} /></label>
        <label>Phone<input name="phone" type="tel" required defaultValue={p.phone} className={inp} /></label>
        <label>Best way to reach you<select name="preferredContact" defaultValue={p.preferredContact} className={inp}><option value="APP">In the app</option><option value="SMS">Text message</option><option value="EMAIL">Email</option></select></label>
        <fieldset className="grid gap-3 rounded-2xl border border-linen-edge p-4"><legend className="px-1 font-medium">Emergency contact</legend>
          <label>Name<input name="emergencyName" required defaultValue={p.emergencyName} className={inp} /></label>
          <label>Relationship<input name="emergencyRelation" required defaultValue={p.emergencyRelation} className={inp} /></label>
          <label>Phone<input name="emergencyPhone" type="tel" required defaultValue={p.emergencyPhone} className={inp} /></label></fieldset>
        <label>Recovery start date<input name="soberSince" type="date" max={new Date().toISOString().slice(0, 10)} defaultValue={p.soberSince} className={inp} /></label>
        <label>Money I used to spend per day (Pula) <span className="text-ink-soft">(optional, powers your &ldquo;saved&rdquo; counter)</span><input name="dailySpend" type="number" min={0} step="1" defaultValue={p.dailySpend} className={inp} /></label>
        <div className="flex items-center gap-3"><button className="btn-primary" disabled={busy}>Save changes</button><p role="status" className="text-sm text-ink-soft">{msg}</p></div>
      </form>
      <section className="card grid gap-3"><h2 className="text-xl">Your data</h2>
        <p>Only you and your Leronza &amp; Co care team can see your information. Journal entries are private unless you share them. Read the full <Link href="/privacy" className="underline">privacy notice</Link>.</p>
        <a href="/api/me/export" className="btn-quiet">Download everything we hold about me</a>
        {del ? <p className="rounded-2xl bg-sage-50 p-3">Your deletion request has been sent. An administrator will remove your data.</p> :
          <button className="btn-quiet !border-coral-600 !text-coral-700" onClick={async () => { if (!confirm("Ask Leronza & Co to permanently delete your account and data?")) return; const res = await fetch("/api/me", { method: "DELETE" }); if (res.ok) setDel(true); }}>Request deletion of my data</button>}
      </section>
    </main>
  );
}
