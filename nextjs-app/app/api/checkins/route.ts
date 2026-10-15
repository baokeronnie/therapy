import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { api } from "@/lib/auth";
const save = api(["PATIENT"], async (req, s) => {
  const { mood, craving, sober, sleepHours, water, exercise } = await req.json();
  const n = (v: unknown, lo: number, hi: number) => (v === "" || v == null || isNaN(+(v as number)) ? null : Math.min(hi, Math.max(lo, +(v as number))));
  const date = new Date(new Date().toISOString().slice(0, 10));
  const d = { mood: Math.min(5, Math.max(1, +mood)), craving: Math.min(10, Math.max(0, +craving)), sober: !!sober, sleepHours: n(sleepHours, 0, 24), water: n(water, 0, 30), exercise: n(exercise, 0, 600) };
  await prisma.checkIn.upsert({ where: { patientId_date: { patientId: s.id, date } }, create: { patientId: s.id, date, ...d }, update: d });
  return NextResponse.json({ ok: true });
});
export const POST = save, PATCH = save;
