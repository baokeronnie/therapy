"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
const dest: Record<string, string> = { PATIENT: "/patient", COUNSELOR: "/counselor", GUARDIAN: "/guardian" };
export default function Login() {
  const r = useRouter();
  const [reg, setReg] = useState(false), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr("");
    const f = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch(reg ? "/api/auth/register" : "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    setBusy(false);
    if (!res.ok) return setErr((await res.json().catch(() => ({}))).error || "Something went wrong. Please try again.");
    r.push(dest[(await res.json()).role]); r.refresh();
  }
  return (
    <main id="main" className="card mx-auto my-10 max-w-md">
      <h1 className="text-3xl">{reg ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-2">A private recovery companion from Leronza &amp; Co. Track your sober days and daily mood, message or text your counselor, book sessions, and alert someone you trust the moment you need urgent help.</p>
      <form onSubmit={submit} className="mt-5 grid gap-4">
        {reg && <label>Full name<input name="name" required className="mt-1 min-h-[44px] w-full rounded-xl border border-linen-edge px-3" /></label>}
        <label>Email<input name="email" type="email" required className="mt-1 min-h-[44px] w-full rounded-xl border border-linen-edge px-3" /></label>
        <label>Password<input name="password" type="password" required minLength={8} className="mt-1 min-h-[44px] w-full rounded-xl border border-linen-edge px-3" /></label>
        {reg && <label>I am joining as
          <select name="role" className="mt-1 min-h-[44px] w-full rounded-xl border border-linen-edge px-3">
            <option value="PATIENT">A patient seeking support</option><option value="COUNSELOR">A counselor</option><option value="GUARDIAN">A guardian for someone in recovery</option>
          </select></label>}
        <p role="alert" className="text-sm text-coral-700">{err}</p>
        <button className="btn-primary" disabled={busy}>{reg ? "Create account" : "Sign in"}</button>
      </form>
      <button className="btn-quiet mt-3 w-full" onClick={() => { setReg(!reg); setErr(""); }}>{reg ? "Back to sign in" : "Create an account"}</button>
    </main>
  );
}
