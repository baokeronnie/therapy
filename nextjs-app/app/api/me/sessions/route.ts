import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { api } from "@/lib/auth";
// A person manages only their own sessions.
export const DELETE = api(["PATIENT", "ADMIN"], async (req, s) => {
  const { id, others } = await req.json().catch(() => ({}));
  const where = others ? { userId: s.id, revokedAt: null, id: { not: s.sid } } : { userId: s.id, id: String(id), revokedAt: null };
  const r = await prisma.session.updateMany({ where, data: { revokedAt: new Date() } });
  return NextResponse.json({ revoked: r.count });
});
