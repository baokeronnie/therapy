import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { dec } from "@/lib/crypto";
import { publish } from "@/lib/realtime";

// Created on first use so the app builds and runs without Twilio configured.
const client = () => twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

// Outbound: client or admin sends a message "as SMS" to the other party's phone.
export async function POST(req: NextRequest) {
  let user; try { user = await requireRole(req, ["PATIENT", "ADMIN"]); } catch (e) { return e as Response; }
  const { careLinkId, body } = await req.json();
  const link = await prisma.careLink.findFirst({
    where: user.role === "ADMIN" ? { id: careLinkId } : { id: careLinkId, patientId: user.id },
    include: { patient: { include: { profile: true } }, counselor: true },
  });
  if (!link || !String(body ?? "").trim()) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const to = user.role === "PATIENT" ? link.counselor.phone : dec(link.patient.profile?.phoneEnc);
  if (!to) return NextResponse.json({ error: "No phone number on file" }, { status: 422 });

  const msg = await prisma.message.create({ data: { careLinkId, senderId: user.id, body: String(body).trim(), channel: "SMS" } });
  await client().messages.create({ to, from: process.env.TWILIO_NUMBER!, body: String(body).trim() });
  publish(careLinkId, { type: "message", id: msg.id });
  return NextResponse.json(msg, { status: 201 });
}

// Inbound: Twilio webhook (POST to /api/sms with Twilio's signature). An admin replying by text lands in the client's thread.
export async function PUT(req: NextRequest) {
  const form = await req.formData();
  const params = Object.fromEntries(form.entries()) as Record<string, string>;
  const ok = twilio.validateRequest(process.env.TWILIO_AUTH_TOKEN!, req.headers.get("x-twilio-signature") ?? "", `${process.env.APP_URL}/api/sms`, params);
  if (!ok) return new NextResponse("Forbidden", { status: 403 });

  const sender = await prisma.user.findFirst({ where: { phone: params.From, role: "ADMIN" } });
  const link = sender && (await prisma.careLink.findFirst({ where: { counselorId: sender.id, active: true }, orderBy: { id: "desc" } }));
  if (link) {
    const msg = await prisma.message.create({ data: { careLinkId: link.id, senderId: sender!.id, body: params.Body, channel: "SMS" } });
    publish(link.id, { type: "message", id: msg.id });
  }
  return new NextResponse("<Response/>", { headers: { "Content-Type": "text/xml" } });
}
