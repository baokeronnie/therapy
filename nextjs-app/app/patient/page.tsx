import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PatientDashboard } from "@/components/patient/PatientDashboard";
export const dynamic = "force-dynamic";
export default async function Page() {
  const s = await getSession(); if (!s) redirect("/login");
  const today = new Date(new Date().toISOString().slice(0, 10));
  const link = await prisma.careLink.findFirst({ where: { patientId: s.id, active: true } });
  const ci = await prisma.checkIn.findMany({ where: { patientId: s.id }, orderBy: { date: "desc" }, take: 7 });
  const ms = await prisma.milestone.findMany({ where: { patientId: s.id }, orderBy: { achievedAt: "desc" } });
  const next = await prisma.appointment.findFirst({ where: { patientId: s.id, status: { in: ["BOOKED", "RESCHEDULED"] }, startsAt: { gt: new Date() } }, orderBy: { startsAt: "asc" }, include: { counselor: true } });
  return <PatientDashboard name={s.name.split(" ")[0]} soberSince={link?.soberSince?.toISOString() ?? null} todayDone={ci.some((c) => +c.date === +today)}
    recent={[...ci].reverse().map((c) => ({ date: c.date.toISOString(), mood: c.mood, craving: c.craving }))}
    milestones={ms.map((m) => ({ id: m.id, title: m.title, detail: m.detail }))} nextAppt={next ? { startsAt: next.startsAt.toISOString(), counselorName: next.counselor.name } : null} />;
}
