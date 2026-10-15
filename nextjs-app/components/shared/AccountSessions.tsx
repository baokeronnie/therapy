"use client";
import { useRouter } from "next/navigation";
type S = { id: string; ua: string; created: string; seen: string; current: boolean };
const device = (ua: string) => {
  const os = /Windows/.test(ua) ? "Windows" : /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Unknown system";
  const br = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  return `${br} on ${os}`;
};
export function AccountSessions({ name, email, role, settingsUrl, sessions }: { name: string; email: string; role: string; settingsUrl: string; sessions: S[] }) {
  const r = useRouter();
  const revoke = async (b: unknown) => { await fetch("/api/me/sessions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }); r.refresh(); };
  return (
    <main id="main" className="mx-auto grid max-w-2xl gap-5 px-4 py-6">
      <h1 className="text-3xl">Account &amp; sessions</h1>
      <section className="card"><h2 className="text-xl">{name}</h2><p className="text-ink-soft">{email} · {role === "ADMIN" ? "Administrator" : "Client"}</p>
        <a href={settingsUrl} className="btn-quiet mt-3">Change email or password</a>
        <p className="mt-2 text-sm text-ink-soft">Email and password are managed on your secure sign-in page.</p></section>
      <section className="card"><h2 className="text-xl">Where you are signed in</h2>
        <p className="text-sm text-ink-soft">Each sign-in is its own session. If you do not recognise one, sign it out.</p>
        <ul className="mt-3 grid gap-2">
          {sessions.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-sage-50 px-4 py-3">
              <div className="flex-1"><b>{device(x.ua)}</b>{x.current && <span className="ml-2 rounded-pill bg-sage-600 px-2 text-xs text-white">This device</span>}
                <div className="text-sm text-ink-soft">Signed in {new Date(x.created).toLocaleString()} · last active {new Date(x.seen).toLocaleString()}</div></div>
              {!x.current && <button className="btn-quiet !min-h-[40px]" onClick={() => revoke({ id: x.id })}>Sign out</button>}
            </li>))}
        </ul>
        {sessions.length > 1 && <button className="btn-quiet mt-3" onClick={() => revoke({ others: true })}>Sign out all other devices</button>}
      </section>
    </main>
  );
}
