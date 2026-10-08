import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { api } from "@/lib/auth";
export const POST = api(["PATIENT"], async (_req, s) => {
  const g = await prisma.guardianLink.findMany({ where: { wardId: s.id } });
  const c = await prisma.careLink.findMany({ where: { patientId: s.id, active: true } });
  const ids = [...g.map((x) => x.guardianId), ...c.map((x) => x.counselorId)];
  await prisma.panicEvent.create({ data: { patientId: s.id, notifiedIds: ids } });
  return NextResponse.json({ ok: true, notified: ids.length });
});
export const PATCH = api(["COUNSELOR", "GUARDIAN"], async (req, s) => {
  const { id } = await req.json();
  const e = await prisma.panicEvent.findUnique({ where: { id } });
  if (!e || !e.notifiedIds.includes(s.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.panicEvent.update({ where: { id }, data: { resolvedAt: new Date() } });
  return NextResponse.json({ ok: true });
});
