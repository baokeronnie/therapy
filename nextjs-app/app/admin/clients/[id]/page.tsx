import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { clientData } from "@/lib/clientData";
import { ClientActions } from "@/components/admin/ClientActions";
export const dynamic = "force-dynamic";
const fmt = (t: string | Date) => new Date(t).toLocaleString();
const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="flex justify-between gap-4 border-b border-linen-edge py-2 last:border-0"><dt className="text-ink-soft">{k}</dt><dd className="text-right font-medium">{v || "—"}</dd></div>
);
export default async function Page({ params }: { params: { id: string } }) {
  const s = await getSession(); if (!s || s.role !== "ADMIN") redirect("/login");
  const d = await clientData(params.id, "admin"); if (!d) notFound();
  await prisma.auditLog.create({ data: { actorId: s.id, action: "CLIENT_VIEW", entity: "User", entityId: params.id } });
  const [links, log] = await Promise.all([
    prisma.careLink.findMany({ where: { patientId: params.id, active: true } }),
    prisma.auditLog.findMany({ where: { entity: "User", entityId: params.id }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const actors = await prisma.user.findMany({ where: { id: { in: log.map((l) => l.actorId) } }, select: { id: true, name: true } });
  const p = d.profile, days = p.soberSince ? Math.floor((Date.now() - +new Date(p.soberSince)) / 864e5) : null;
  const saved = days !== null && p.dailySpend ? days * p.dailySpend : null;
  return (
    <main id="main" className="mx-auto grid max-w-6xl gap-5 px-4 py-6 lg:grid-cols-2">
      <header className="lg:col-span-2">
        <Link href="/admin" className="text-sm underline">← All clients</Link>
        <h1 className="mt-1 text-3xl">{p.name}</h1>
        {p.deletionRequestedAt && <p className="mt-2 rounded-2xl bg-coral-50 p-3 text-coral-700">This client asked for their data to be deleted on {fmt(p.deletionRequestedAt)}.</p>}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <ClientActions id={params.id} assigned={links.length > 0} canDelete={!!p.deletionRequestedAt} />
          {links[0] && <Link href={`/admin/chat/${links[0].id}`} className="btn-quiet">Message</Link>}
        </div>
        <p className="mt-2 text-sm text-ink-soft">Exports include this client&apos;s details, check-ins, triggers, goals, sessions, messages and any journal entries they chose to share. Each export is recorded in the access log.</p>
      </header>

      <section className="card"><h2 className="text-xl">Contact details (from signup)</h2>
        <dl className="mt-3">
          <Row k="Email" v={<a className="underline" href={`mailto:${p.email}`}>{p.email}</a>} />
          <Row k="Phone" v={p.phone ? <a className="underline" href={`tel:${p.phone}`}>{p.phone}</a> : null} />
          <Row k="Preferred contact" v={p.preferredContact} />
          <Row k="Joined" v={new Date(p.joinedAt).toLocaleDateString()} />
          <Row k="Privacy notice accepted" v={p.privacyConsent ? `v${p.privacyConsent.version}, ${new Date(p.privacyConsent.acceptedAt).toLocaleDateString()}` : null} />
        </dl></section>

      <section className="card"><h2 className="text-xl">Emergency contact</h2>
        <dl className="mt-3">
          <Row k="Name" v={p.emergencyContact.name} />
          <Row k="Relationship" v={p.emergencyContact.relationship} />
          <Row k="Phone" v={p.emergencyContact.phone ? <a className="underline" href={`tel:${p.emergencyContact.phone}`}>{p.emergencyContact.phone}</a> : null} />
        </dl></section>

      <section className="card"><h2 className="text-xl">Recovery summary</h2>
        <dl className="mt-3">
          <Row k="Days since start" v={days !== null ? `${days} days (from ${p.soberSince})` : "Not set"} />
          <Row k="Money saved" v={saved !== null ? `P${saved.toFixed(2)}` : null} />
          <Row k="Check-ins logged" v={d.checkIns.length} />
          <Row k="Triggers logged" v={d.triggers.length} />
          <Row k="Assigned to" v={p.assignedTo.join(", ") || "Unassigned"} />
        </dl></section>

      <section className="card"><h2 className="text-xl">Goals &amp; milestones</h2>
        <ul className="mt-3 grid gap-1">
          {d.goals.filter((g) => g.active).map((g) => <li key={g.goal}>{g.goal} <span className="text-ink-soft">· {g.daysCompleted} days done</span></li>)}
          {d.milestones.map((m) => <li key={m.at}>{m.title}</li>)}
          {!d.goals.length && !d.milestones.length && <li className="text-ink-soft">Nothing yet.</li>}
        </ul></section>

      <section className="card lg:col-span-2"><h2 className="text-xl">Recent check-ins</h2>
        <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-ink-soft"><tr><th className="py-1">Date</th><th>Mood</th><th>Craving</th><th>Sober</th><th>Sleep (h)</th><th>Water</th><th>Exercise (min)</th></tr></thead>
          <tbody>
            {[...d.checkIns].reverse().slice(0, 14).map((c) => <tr key={c.date} className="border-t border-linen-edge"><td className="py-1">{c.date}</td><td>{c.mood}/5</td><td>{c.craving}/10</td><td>{c.sober ? "Yes" : "No"}</td><td>{c.sleepHours ?? "—"}</td><td>{c.waterGlasses ?? "—"}</td><td>{c.exerciseMinutes ?? "—"}</td></tr>)}
            {!d.checkIns.length && <tr><td colSpan={7} className="py-2 text-ink-soft">No check-ins yet.</td></tr>}
          </tbody></table></div></section>

      <section className="card"><h2 className="text-xl">Recent triggers</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {[...d.triggers].reverse().slice(0, 8).map((t) => <li key={t.at}><b>{t.trigger.toLowerCase()}</b> · intensity {t.intensity}/10 <span className="text-ink-soft">· {fmt(t.at)}</span>{t.whatHelped && <div className="text-ink-soft">Helped: {t.whatHelped}</div>}</li>)}
          {!d.triggers.length && <li className="text-ink-soft">None logged.</li>}
        </ul></section>

      <section className="card"><h2 className="text-xl">Shared journal entries</h2>
        <ul className="mt-3 grid gap-3 text-sm">
          {[...d.journal].reverse().slice(0, 5).map((j) => <li key={j.at}><span className="text-ink-soft">{fmt(j.at)}</span><p className="whitespace-pre-wrap">{j.entry}</p></li>)}
          {!d.journal.length && <li className="text-ink-soft">The client has not shared any journal entries. Entries stay private unless they choose to share them.</li>}
        </ul></section>

      <section className="card"><h2 className="text-xl">Sessions</h2>
        <ul className="mt-3 grid gap-1 text-sm">
          {[...d.appointments].reverse().slice(0, 6).map((a) => <li key={a.startsAt}>{fmt(a.startsAt)} · {a.status.toLowerCase()}{a.cancelReason ? ` (${a.cancelReason})` : ""}</li>)}
          {!d.appointments.length && <li className="text-ink-soft">None booked.</li>}
        </ul></section>

      <section className="card"><h2 className="text-xl">Access log</h2>
        <ul className="mt-3 grid gap-1 text-sm">
          {log.map((l) => <li key={l.id}>{fmt(l.createdAt)} · {actors.find((a) => a.id === l.actorId)?.name ?? "Client"} · {l.action.toLowerCase().replace(/_/g, " ")}</li>)}
        </ul></section>
    </main>
  );
}
