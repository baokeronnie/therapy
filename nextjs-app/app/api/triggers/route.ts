import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { api } from "@/lib/auth";
import { enc, dec } from "@/lib/crypto";
export const TRIGGERS = ["STRESS", "LONELINESS", "BOREDOM", "PEOPLE", "PLACE", "CONFLICT", "CELEBRATION", "OTHER"];
export const GET = api(["PATIENT"], async (_r, s) => {
  const rows = await prisma.triggerLog.findMany({ where: { patientId: s.id }, orderBy: { createdAt: "desc" }, take: 60 });
  return NextResponse.json(rows.map((r) => ({ id: r.id, createdAt: r.createdAt, trigger: r.trigger, intensity: r.intensity, helped: dec(r.helpedEnc) })));
});
export const POST = api(["PATIENT"], async (req, s) => {
  const { trigger, intensity, helped } = await req.json();
  if (!TRIGGERS.includes(trigger)) return NextResponse.json({ error: "Choose a trigger" }, { status: 400 });
  await prisma.triggerLog.create({ data: { patientId: s.id, trigger, intensity: Math.min(10, Math.max(1, +intensity || 1)), helpedEnc: enc(String(helped ?? "").slice(0, 500)) } });
  return NextResponse.json({ ok: true }, { status: 201 });
});
export const DELETE = api(["PATIENT"], async (req, s) => {
  const { id } = await req.json();
  await prisma.triggerLog.deleteMany({ where: { id, patientId: s.id } });
  return NextResponse.json({ ok: true });
});
