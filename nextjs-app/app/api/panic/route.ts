import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { api } from "@/lib/auth";
// Client holds the button -> the assigned admin (or every admin if none is assigned) is alerted.
export const POST = api(["PATIENT"], async (_req, s) => {
  const links = await prisma.careLink.findMany({ where: { patientId: s.id, active: true } });
  let ids = links.map((x) => x.counselorId);
  if (!ids.length) ids = (await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } })).map((a) => a.id);
  await prisma.panicEvent.create({ data: { patientId: s.id, notifiedIds: ids } });
  return NextResponse.json({ ok: true, notified: ids.length });
});
export const PATCH = api(["ADMIN"], async (req, s) => {
  const { id } = await req.json();
  const e = await prisma.panicEvent.findUnique({ where: { id } });
  if (!e || !e.notifiedIds.includes(s.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.panicEvent.update({ where: { id }, data: { resolvedAt: new Date() } });
  return NextResponse.json({ ok: true });
});
