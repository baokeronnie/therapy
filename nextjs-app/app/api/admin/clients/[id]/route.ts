import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { api } from "@/lib/auth";
// Permanently deletes a client's data (only after they asked). The audit entry is kept.
export const DELETE = api(["ADMIN"], async (_r, s, { params }) => {
  const c = await prisma.user.findFirst({ where: { id: params.id, role: "PATIENT", profile: { deletionRequestedAt: { not: null } } } });
  if (!c) return NextResponse.json({ error: "Only clients who requested deletion can be removed." }, { status: 400 });
  await prisma.$transaction([
    prisma.message.deleteMany({ where: { careLink: { patientId: c.id } } }),
    prisma.milestone.updateMany({ where: { authorId: c.id }, data: { authorId: null } }),
    prisma.user.delete({ where: { id: c.id } }),
    prisma.auditLog.create({ data: { actorId: s.id, action: "CLIENT_DELETE", entity: "User", entityId: c.id } }),
  ]);
  return NextResponse.json({ ok: true });
});
