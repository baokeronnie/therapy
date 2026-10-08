import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Refresher } from "@/components/shared/Refresher";
import { AckButton } from "@/components/shared/AckButton";
export const dynamic = "force-dynamic";
export default async function Page() {
  const s = await getSession(); if (!s) redirect("/login");
  const ev = await prisma.panicEvent.findMany({ where: { notifiedIds: { has: s.id } }, include: { patient: true }, orderBy: { createdAt: "desc" }, take: 20 });
  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-6">
      <Refresher />
      <h1 className="text-3xl">Hello, {s.name.split(" ")[0]}.</h1>
      <p className="mb-5 text-ink-soft">Alerts from the people you look out for appear here the moment they ask for help.</p>
      <ul className="grid gap-3">
        {ev.length === 0 && <li className="card text-ink-soft">No alerts. You will see one here right away if someone needs you.</li>}
        {ev.map((e) => (
          <li key={e.id} className={`card flex flex-wrap items-center gap-3 ${e.resolvedAt ? "" : "!border-coral-600"}`}>
            <div className="flex-1"><b>{e.patient.name} pressed the panic button</b><div className="text-sm text-ink-soft">{e.createdAt.toLocaleString()}{e.resolvedAt ? " · handled" : ""}</div></div>
            {!e.resolvedAt && <AckButton id={e.id} label="Mark as handled" />}
          </li>))}
      </ul>
      <p className="mt-6 text-sm text-ink-soft">Mood and craving details are shared only if the person turns them on.</p>
    </main>
  );
}
