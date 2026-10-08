import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { api } from "@/lib/auth";
export const POST = api(["PATIENT"], async (req, s) => {
  const { counselorId, startsAt } = await req.json();
  const link = await prisma.careLink.findFirst({ where: { patientId: s.id, counselorId, active: true } });
  const block = await prisma.availabilityBlock.findFirst({ where: { counselorId, startsAt: new Date(startsAt) } });
  if (!link || !block) return NextResponse.json({ error: "Slot unavailable" }, { status: 400 });
  await prisma.appointment.deleteMany({ where: { counselorId, startsAt: block.startsAt, status: "CANCELLED" } }); // frees the unique slot; reason stays in AuditLog
  try { return NextResponse.json(await prisma.appointment.create({ data: { patientId: s.id, counselorId, startsAt: block.startsAt, endsAt: block.endsAt } }), { status: 201 }); }
  catch (e: any) { return NextResponse.json({ error: "Taken" }, { status: e.code === "P2002" ? 409 : 500 }); }
});
