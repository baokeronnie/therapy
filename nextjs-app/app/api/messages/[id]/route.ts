import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { api } from "@/lib/auth";
export const PATCH = api(["PATIENT", "COUNSELOR"], async (req, s, { params }) => {
  const { body } = await req.json();
  const m = await prisma.message.findFirst({ where: { id: params.id, senderId: s.id, deletedAt: null } });
  if (!m || !String(body ?? "").trim()) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  await prisma.auditLog.create({ data: { actorId: s.id, action: "MESSAGE_EDIT", entity: "Message", entityId: m.id, meta: { before: m.body } } });
  return NextResponse.json(await prisma.message.update({ where: { id: m.id }, data: { body: String(body).trim(), editedAt: new Date() } }));
});
export const DELETE = api(["PATIENT", "COUNSELOR"], async (_req, s, { params }) => {
  const m = await prisma.message.findFirst({ where: { id: params.id, senderId: s.id, deletedAt: null } });
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.message.update({ where: { id: m.id }, data: { deletedAt: new Date(), deletedBy: s.id } });
  await prisma.auditLog.create({ data: { actorId: s.id, action: "MESSAGE_REMOVE", entity: "Message", entityId: m.id } });
  return NextResponse.json({ ok: true });
});
