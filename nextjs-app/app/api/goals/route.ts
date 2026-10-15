import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { api } from "@/lib/auth";
const today = () => new Date(new Date().toISOString().slice(0, 10));
export const POST = api(["PATIENT"], async (req, s) => {            // add a goal
  const { title } = await req.json();
  const t = String(title ?? "").trim().slice(0, 80);
  if (!t || (await prisma.goal.count({ where: { patientId: s.id, active: true } })) >= 8) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  await prisma.goal.create({ data: { patientId: s.id, title: t } });
  return NextResponse.json({ ok: true }, { status: 201 });
});
export const PATCH = api(["PATIENT"], async (req, s) => {           // tick / untick today
  const { id, done } = await req.json();
  const g = await prisma.goal.findFirst({ where: { id, patientId: s.id } });
  if (!g) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (done) await prisma.goalLog.upsert({ where: { goalId_date: { goalId: g.id, date: today() } }, create: { goalId: g.id, date: today() }, update: {} });
  else await prisma.goalLog.deleteMany({ where: { goalId: g.id, date: today() } });
  return NextResponse.json({ ok: true });
});
export const DELETE = api(["PATIENT"], async (req, s) => {
  const { id } = await req.json();
  await prisma.goal.updateMany({ where: { id, patientId: s.id }, data: { active: false } });
  return NextResponse.json({ ok: true });
});
