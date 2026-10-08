import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { SchedulingInterface } from "@/components/scheduling/SchedulingInterface";
export const dynamic = "force-dynamic";
export default async function Page() {
  const s = await getSession(); if (!s) redirect("/login");
  const link = await prisma.careLink.findFirst({ where: { patientId: s.id, active: true }, include: { counselor: true } });
  if (!link) return <main id="main" className="card mx-auto my-8 max-w-xl">You have no counselor assigned yet. Once one is assigned you can book sessions here.</main>;
  const booked = await prisma.appointment.findMany({ where: { counselorId: link.counselorId, status: { in: ["BOOKED", "RESCHEDULED"] } }, select: { startsAt: true } });
  const taken = new Set(booked.map((b) => +b.startsAt));
  const blocks = await prisma.availabilityBlock.findMany({ where: { counselorId: link.counselorId, startsAt: { gt: new Date() } }, orderBy: { startsAt: "asc" } });
  const mine = await prisma.appointment.findMany({ where: { patientId: s.id }, orderBy: { startsAt: "asc" } });
  return <SchedulingInterface counselor={{ id: link.counselorId, name: link.counselor.name, timeZone: link.counselor.timeZone }}
    slots={blocks.filter((b) => !taken.has(+b.startsAt)).map((b) => b.startsAt.toISOString())}
    appointments={mine.map((a) => ({ id: a.id, startsAt: a.startsAt.toISOString(), endsAt: a.endsAt.toISOString(), status: a.status }))} />;
}
