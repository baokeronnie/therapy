import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { api } from "@/lib/auth";
import { enc } from "@/lib/crypto";
const ph = z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/);
const Body = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: ph.optional(), emergencyName: z.string().trim().min(2).max(80).optional(), emergencyPhone: ph.optional(),
  emergencyRelation: z.string().trim().min(2).max(40).optional(), preferredContact: z.enum(["APP", "SMS", "EMAIL"]).optional(),
  soberSince: z.string().nullable().optional(), dailySpend: z.number().min(0).max(100000).nullable().optional(),
});
// Client updates their own details.
export const PATCH = api(["PATIENT"], async (req, s) => {
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: "Please check the details you entered." }, { status: 400 });
  const b = p.data, d: Record<string, unknown> = {};
  if (b.phone) d.phoneEnc = enc(b.phone);
  if (b.emergencyName) d.emergencyNameEnc = enc(b.emergencyName);
  if (b.emergencyPhone) d.emergencyPhoneEnc = enc(b.emergencyPhone);
  if (b.emergencyRelation) d.emergencyRelationEnc = enc(b.emergencyRelation);
  if (b.preferredContact) d.preferredContact = b.preferredContact;
  if ("dailySpend" in b) d.dailySpend = b.dailySpend ?? null;
  if ("soberSince" in b) {
    const t = b.soberSince ? new Date(b.soberSince) : null;
    if (t && (isNaN(+t) || +t > Date.now())) return NextResponse.json({ error: "Start date cannot be in the future." }, { status: 400 });
    d.soberSince = t;
  }
  if (b.name) await prisma.user.update({ where: { id: s.id }, data: { name: b.name } });
  await prisma.clientProfile.update({ where: { userId: s.id }, data: d });
  return NextResponse.json({ ok: true });
});
// Client asks for their data to be deleted; the admin completes it (see admin client page).
export const DELETE = api(["PATIENT"], async (_r, s) => {
  await prisma.clientProfile.update({ where: { userId: s.id }, data: { deletionRequestedAt: new Date() } });
  await prisma.auditLog.create({ data: { actorId: s.id, action: "DELETION_REQUESTED", entity: "User", entityId: s.id } });
  return NextResponse.json({ ok: true });
});
