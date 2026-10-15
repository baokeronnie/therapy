import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { dec } from "@/lib/crypto";
import { Refresher } from "@/components/shared/Refresher";
import { AckButton } from "@/components/shared/AckButton";
export const dynamic = "force-dynamic";
const DAY = 864e5;
export default async function Page({ searchParams }: { searchParams: { q?: string } }) {
  const s = await getSession(); if (!s || s.role !== "ADMIN") redirect("/login");
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const [open, clients, upcoming] = await Promise.all([
    prisma.panicEvent.findMany({ where: { notifiedIds: { has: s.id }, resolvedAt: null }, include: { patient: true }, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ where: { role: "PATIENT" }, orderBy: { createdAt: "desc" },
      include: { profile: true, asPatient: { include: { counselor: { select: { id: true, name: true } } } }, checkIns: { orderBy: { date: "desc" }, take: 1 } } }),
    prisma.appointment.count({ where: { status: { in: ["BOOKED", "RESCHEDULED"] }, startsAt: { gt: new Date() } } }),
  ]);
  const rows = clients.map((c) => {
    const ci = c.checkIns[0], crisis = open.some((o) => o.patientId === c.id), high = !!ci && ci.craving >= 6;
    const link = c.asPatient.find((l) => l.active);
    return { c, ci, link, phone: dec(c.profile?.phoneEnc), crisis, rank: crisis ? 0 : high ? 1 : 2,
      tag: crisis ? "Crisis alert" : high ? "High craving" : "Steady",
      days: c.profile?.soberSince ? Math.floor((Date.now() - +c.profile.soberSince) / DAY) : null,
      stale: !ci || Date.now() - +ci.date > 3 * DAY };
  }).filter((r) => !q || r.c.name.toLowerCase().includes(q) || r.c.email.toLowerCase().includes(q)).sort((a, b) => a.rank - b.rank);
  const active7 = clients.filter((c) => c.checkIns[0] && Date.now() - +c.checkIns[0].date < 7 * DAY).length;
  const stats: [string, number][] = [["Clients", clients.length], ["Checked in this week", active7], ["Open alerts", open.length], ["Upcoming sessions", upcoming]];
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-6">
      <Refresher ms={15000} />
      <h1 className="text-3xl">Admin dashboard</h1>
      <p className="mb-5 text-ink-soft">Client details and activity. Only administrators can see this page.</p>
      <ul className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([l, n]) => <li key={l} className="card !p-4"><p className="font-display text-3xl text-sage-700">{n}</p><p className="text-sm text-ink-soft">{l}</p></li>)}
      </ul>
      {open.map((o) => (
        <div key={o.id} className="card mb-4 flex flex-wrap items-center gap-3 !border-coral-600"><b>{o.patient.name} pressed the help button at {o.createdAt.toLocaleTimeString()}.</b>
          <Link href={`/admin/clients/${o.patientId}`} className="btn-quiet !min-h-[40px]">Open client</Link><AckButton id={o.id} label="Acknowledge" /></div>
      ))}
      <form className="mb-4 flex gap-2" role="search"><label className="sr-only" htmlFor="q">Search clients</label>
        <input id="q" name="q" defaultValue={searchParams.q} placeholder="Search by name or email" className="min-h-[44px] flex-1 rounded-xl border border-linen-edge px-3" /><button className="btn-quiet">Search</button></form>
      <div className="card overflow-x-auto !p-0">
        <table className="w-full min-w-[820px] text-left">
          <thead className="border-b border-linen-edge text-sm text-ink-soft"><tr><th className="p-3">Client</th><th className="p-3">Contact</th><th className="p-3">Progress</th><th className="p-3">Status</th><th className="p-3"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="p-5 text-ink-soft">No clients found.</td></tr>}
            {rows.map(({ c, ci, link, phone, tag, rank, days, stale }) => (
              <tr key={c.id} className="border-b border-linen-edge last:border-0 align-top">
                <td className="p-3"><Link href={`/admin/clients/${c.id}`} className="font-semibold underline">{c.name}</Link>
                  <div className="text-sm text-ink-soft">Joined {c.createdAt.toLocaleDateString()}</div>
                  {c.profile?.deletionRequestedAt && <div className="mt-1 inline-block rounded-pill bg-coral-50 px-2 text-xs font-semibold text-coral-700">Deletion requested</div>}</td>
                <td className="p-3 text-sm"><a href={`mailto:${c.email}`} className="underline">{c.email}</a><div>{phone ?? "No phone"}</div></td>
                <td className="p-3 text-sm">{days !== null ? `${days} days` : "No start date"}<div className="text-ink-soft">{ci ? `mood ${ci.mood}/5, craving ${ci.craving}/10` : "no check-ins yet"}{ci && stale ? " (not recent)" : ""}</div></td>
                <td className="p-3"><span className={`rounded-pill px-3 py-0.5 text-sm font-semibold ${rank === 0 ? "bg-coral-600 text-white" : rank === 1 ? "bg-tide-100" : "bg-sage-100"}`}>{tag}</span>
                  <div className="mt-1 text-xs text-ink-soft">{link ? `With ${link.counselor.name}` : "Unassigned"}</div></td>
                <td className="p-3"><div className="flex flex-wrap gap-2">
                  <Link href={`/admin/clients/${c.id}`} className="btn-quiet !min-h-[40px]">Details</Link>
                  {link && <Link href={`/admin/chat/${link.id}`} className="btn-quiet !min-h-[40px]">Message</Link>}
                  <a href={`/api/admin/clients/${c.id}/export?format=csv`} className="btn-quiet !min-h-[40px]">Export</a></div></td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
