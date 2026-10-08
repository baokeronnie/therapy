import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { api } from "@/lib/auth";
export const PATCH = api(["PATIENT"], async (req, s, { params }) => {
  const { startsAt } = await req.json();
  const a = await prisma.appointment.findFirst({ where: { id: params.id, patientId: s.id } });
  const block = a && (await prisma.availabilityBlock.findFirst({ where: { counselorId: a.counselorId, startsAt: new Date(startsAt) } }));
  if (!a || !block) return NextResponse.json({ error: "Unavailable" }, { status: 400 });
  await prisma.appointment.deleteMany({ where: { counselorId: a.counselorId, startsAt: block.startsAt, status: "CANCELLED" } });
  try { return NextResponse.json(await prisma.appointment.update({ where: { id: a.id }, data: { startsAt: block.startsAt, endsAt: block.endsAt, status: "RESCHEDULED" } })); }
  catch (e: any) { return NextResponse.json({ error: "Taken" }, { status: e.code === "P2002" ? 409 : 500 }); }
});
export const DELETE = api(["PATIENT"], async (req, s, { params }) => {
  const { reason } = await req.json();
  if (!String(reason ?? "").trim()) return NextResponse.json({ error: "Reason required" }, { status: 400 });
  const a = await prisma.appointment.findFirst({ where: { id: params.id, patientId: s.id } });
  if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.appointment.update({ where: { id: a.id }, data: { status: "CANCELLED", cancelReason: reason, cancelledAt: new Date() } });
  await prisma.auditLog.create({ data: { actorId: s.id, action: "APPT_CANCEL", entity: "Appointment", entityId: a.id, meta: { reason } } });
  return NextResponse.json({ ok: true });
});
