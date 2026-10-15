import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { api } from "@/lib/auth";
// Admin takes on a client who has no assigned admin yet.
export const POST = api(["ADMIN"], async (_r, s, { params }) => {
  const c = await prisma.user.findFirst({ where: { id: params.id, role: "PATIENT" } });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.careLink.upsert({ where: { patientId_counselorId: { patientId: c.id, counselorId: s.id } }, create: { patientId: c.id, counselorId: s.id }, update: { active: true } });
  await prisma.auditLog.create({ data: { actorId: s.id, action: "CLIENT_ASSIGN", entity: "User", entityId: c.id } });
  return NextResponse.json({ ok: true });
});
