import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { api } from "@/lib/auth";
import { enc } from "@/lib/crypto";
import { PRIVACY_VERSION } from "@/lib/privacy";

const phone = z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number, for example +267 71 234 567");
const Body = z.object({
  name: z.string().trim().min(2).max(80),
  phone,
  emergencyName: z.string().trim().min(2).max(80),
  emergencyPhone: phone,
  emergencyRelation: z.string().trim().min(2).max(40),
  preferredContact: z.enum(["APP", "SMS", "EMAIL"]).default("APP"),
  soberSince: z.string().optional().transform((v) => (v ? new Date(v) : null)),
  consent: z.literal("on", { errorMap: () => ({ message: "Please read and accept the privacy notice to continue." }) }),
});
// Completes a new client's account: their own contact details + consent. Written to THEIR record only.
export const POST = api(["PATIENT"], async (req, s) => {
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Please check your details." }, { status: 400 });
  const b = p.data;
  if (b.soberSince && (isNaN(+b.soberSince) || +b.soberSince > Date.now())) return NextResponse.json({ error: "Start date cannot be in the future." }, { status: 400 });
  if (await prisma.clientProfile.findUnique({ where: { userId: s.id } })) return NextResponse.json({ ok: true });
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });
  await prisma.$transaction([
    prisma.user.update({ where: { id: s.id }, data: { name: b.name } }),
    prisma.clientProfile.create({ data: { userId: s.id, phoneEnc: enc(b.phone), emergencyNameEnc: enc(b.emergencyName), emergencyPhoneEnc: enc(b.emergencyPhone), emergencyRelationEnc: enc(b.emergencyRelation),
      preferredContact: b.preferredContact, soberSince: b.soberSince, consentVersion: PRIVACY_VERSION, consentAt: new Date() } }),
    ...(admin ? [prisma.careLink.upsert({ where: { patientId_counselorId: { patientId: s.id, counselorId: admin.id } }, create: { patientId: s.id, counselorId: admin.id }, update: {} })] : []),
  ]);
  return NextResponse.json({ ok: true }, { status: 201 });
});
