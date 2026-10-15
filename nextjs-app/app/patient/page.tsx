import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PatientDashboard } from "@/components/patient/PatientDashboard";
export const dynamic = "force-dynamic";
const DAY = 864e5;
export default async function Page() {
  const s = await getSession(); if (!s || s.role !== "PATIENT") redirect("/login");
  const today = new Date(new Date().toISOString().slice(0, 10));
  const [profile, ci, ms, next, goals, triggers] = await Promise.all([
    prisma.clientProfile.findUnique({ where: { userId: s.id } }),
    prisma.checkIn.findMany({ where: { patientId: s.id }, orderBy: { date: "desc" }, take: 30 }),
    prisma.milestone.findMany({ where: { patientId: s.id }, orderBy: { achievedAt: "desc" } }),
    prisma.appointment.findFirst({ where: { patientId: s.id, status: { in: ["BOOKED", "RESCHEDULED"] }, startsAt: { gt: new Date() } }, orderBy: { startsAt: "asc" }, include: { counselor: true } }),
    prisma.goal.findMany({ where: { patientId: s.id, active: true }, include: { logs: { where: { date: { gte: new Date(+today - 60 * DAY) } } } }, orderBy: { createdAt: "asc" } }),
    prisma.triggerLog.groupBy({ by: ["trigger"], where: { patientId: s.id, createdAt: { gt: new Date(Date.now() - 30 * DAY) } }, _count: true, orderBy: { _count: { trigger: "desc" } }, take: 1 }),
  ]);
  const t = ci.find((c) => +c.date === +today);
  // consecutive days with a check-in, counting back from today (or yesterday if today is not done yet)
  let streak = 0, d = +today - (t ? 0 : DAY);
  for (const c of ci) { if (+c.date === d) { streak++; d -= DAY; } else if (+c.date < d) break; }
  const week = ci.slice(0, 7), avg = (f: (c: (typeof ci)[number]) => number | null | undefined) => { const v = week.map(f).filter((x): x is number => x != null); return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : null; };
  return <PatientDashboard
    name={s.name.split(" ")[0]} soberSince={profile?.soberSince?.toISOString() ?? null} dailySpend={profile?.dailySpend ?? null}
    today={t ? { mood: t.mood, craving: t.craving, sober: t.sober, sleepHours: t.sleepHours, water: t.water, exercise: t.exercise } : null}
    recent={[...ci].slice(0, 7).reverse().map((c) => ({ date: c.date.toISOString(), mood: c.mood, craving: c.craving }))}
    insights={{ checkInStreak: streak, avgMood: avg((c) => c.mood), avgCraving: avg((c) => c.craving), avgSleep: avg((c) => c.sleepHours), topTrigger: triggers[0]?.trigger ?? null }}
    goals={goals.map((g) => ({ id: g.id, title: g.title, doneToday: g.logs.some((l) => +l.date === +today), daysDone: g.logs.length }))}
    milestones={ms.map((m) => ({ id: m.id, title: m.title, detail: m.detail }))}
    nextAppt={next ? { startsAt: next.startsAt.toISOString(), counselorName: next.counselor.name } : null} />;
}
