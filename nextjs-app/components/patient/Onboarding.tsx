"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
const inp = "mt-1 min-h-[44px] w-full rounded-xl border border-linen-edge px-3";
export function Onboarding({ name, email }: { name: string; email: string }) {
  const r = useRouter(); const [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr("");
    const res = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget).entries())) });
    const data = await res.json().catch(() => ({})); setBusy(false);
    if (!res.ok) return setErr(data.error || "Something went wrong. Please try again.");
    r.push("/patient"); r.refresh();
  }
  return (
    <main id="main" className="card mx-auto my-8 max-w-md">
      <h1 className="text-3xl">Welcome. Let&apos;s finish your account.</h1>
      <p className="mt-2 text-ink-soft">You are signed in as {email}. These details are saved to your account only and are seen by you and your Leronza &amp; Co care team.</p>
      <form onSubmit={submit} className="mt-5 grid gap-4">
        <label>Full name<input name="name" required defaultValue={name} autoComplete="name" className={inp} /></label>
        <label>Your phone number<input name="phone" type="tel" required autoComplete="tel" placeholder="+267 71 234 567" className={inp} /></label>
        <fieldset className="grid gap-3 rounded-2xl border border-linen-edge p-4">
          <legend className="px-1 font-medium">Emergency contact</legend>
          <p className="text-sm text-ink-soft">Someone we can reach if you press the help button and we cannot reach you.</p>
          <label>Their name<input name="emergencyName" required className={inp} /></label>
          <label>Relationship<input name="emergencyRelation" required placeholder="Sister, friend, partner…" className={inp} /></label>
          <label>Their phone number<input name="emergencyPhone" type="tel" required className={inp} /></label>
        </fieldset>
        <label>Best way to reach you
          <select name="preferredContact" className={inp}><option value="APP">In the app</option><option value="SMS">Text message</option><option value="EMAIL">Email</option></select></label>
        <label>Recovery start date <span className="text-ink-soft">(optional)</span><input name="soberSince" type="date" max={new Date().toISOString().slice(0, 10)} className={inp} /></label>
        <label className="flex items-start gap-3">
          <input name="consent" type="checkbox" required className="mt-1 h-6 w-6 shrink-0 accent-sage-600" />
          <span className="text-sm">I have read the <Link href="/privacy" target="_blank" className="underline">privacy notice</Link> and agree that Leronza &amp; Co may collect and use my details as described there.</span>
        </label>
        <p role="alert" className="text-sm text-coral-700">{err}</p>
        <button className="btn-primary" disabled={busy}>Finish and continue</button>
      </form>
    </main>
  );
}
