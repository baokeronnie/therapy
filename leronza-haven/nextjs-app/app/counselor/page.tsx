import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Refresher } from "@/components/shared/Refresher";
import { AckButton } from "@/components/shared/AckButton";
export const dynamic = "force-dynamic";
export default async function Page() {
  const s = await getSession(); if (!s) redirect("/login");
  const open = await prisma.panicEvent.findMany({ where: { notifiedIds: { has: s.id }, resolvedAt: null }, include: { patient: true }, orderBy: { createdAt: "desc" } });
  const links = await prisma.careLink.findMany({ where: { counselorId: s.id, active: true }, include: { patient: { include: { checkIns: { orderBy: { date: "desc" }, take: 1 } } } } });
  const rows = links.map((l) => { const c = l.patient.checkIns[0]; const crisis = open.some((o) => o.patientId === l.patientId);
    return { l, c, rank: crisis ? 0 : c && c.craving >= 6 ? 1 : 2, tag: crisis ? "Crisis alert" : c && c.craving >= 6 ? "High craving" : "Steady",
      days: l.soberSince ? Math.floor((Date.now() - +l.soberSince) / 864e5) : 0 }; }).sort((a, b) => a.rank - b.rank);
  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-6">
      <Refresher />
      <h1 className="text-3xl">Today&apos;s caseload</h1>
      <p className="mb-5 text-ink-soft">Clients with an alert or a high craving appear first.</p>
      {open.map((o) => (
        <div key={o.id} className="card mb-4 flex flex-wrap items-center gap-3 !border-coral-600"><b>{o.patient.name} pressed the panic button at {o.createdAt.toLocaleTimeString()}.</b><AckButton id={o.id} label="Acknowledge" /></div>
      ))}
      <ul className="grid gap-3">
        {rows.length === 0 && <li className="card text-ink-soft">No clients assigned yet.</li>}
        {rows.map(({ l, c, tag, rank, days }) => (
          <li key={l.id} className="card flex flex-wrap items-center gap-3">
            <div className="flex-1"><b>{l.patient.name}</b><div className="text-sm text-ink-soft">{days} days · {c ? `mood ${c.mood}/5, craving ${c.craving}/10` : "no check-ins yet"}</div></div>
            <span className={`rounded-pill px-3 py-0.5 text-sm font-semibold ${rank === 0 ? "bg-coral-600 text-white" : rank === 1 ? "bg-tide-100" : "bg-sage-100"}`}>{tag}</span>
            <Link href={`/counselor/chat/${l.id}`} className="btn-quiet !min-h-[40px]">Message</Link>
          </li>))}
      </ul>
    </main>
  );
}
