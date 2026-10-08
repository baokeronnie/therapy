import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { publish } from "@/lib/realtime";

const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

// Outbound: patient sends a message "as SMS" to their counselor's phone.
export async function POST(req: NextRequest) {
  const user = await requireRole(req, ["PATIENT", "COUNSELOR"]);
  const { careLinkId, body } = await req.json();
  const link = await prisma.careLink.findFirst({
    where: { id: careLinkId, OR: [{ patientId: user.id }, { counselorId: user.id }] },
    include: { patient: true, counselor: true },
  });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const to = user.role === "PATIENT" ? link.counselor.phone : link.patient.phone; // add `phone String?` to User
  if (!to) return NextResponse.json({ error: "No phone number on file" }, { status: 422 });

  const msg = await prisma.message.create({ data: { careLinkId, senderId: user.id, body, channel: "SMS" } }); // add `channel String @default("APP")`
  await client.messages.create({ to, from: process.env.TWILIO_NUMBER!, body, statusCallback: `${process.env.APP_URL}/api/sms/status` });
  publish(careLinkId, { type: "message", id: msg.id });
  return NextResponse.json(msg, { status: 201 });
}

// Inbound: Twilio webhook. Counselor replies by text and it lands in the same thread.
export async function PUT(req: NextRequest) {
  const form = await req.formData();
  const params = Object.fromEntries(form.entries()) as Record<string, string>;
  const ok = twilio.validateRequest(process.env.TWILIO_AUTH_TOKEN!, req.headers.get("x-twilio-signature") ?? "", `${process.env.APP_URL}/api/sms`, params);
  if (!ok) return new NextResponse("Forbidden", { status: 403 });

  const sender = await prisma.user.findFirst({ where: { phone: params.From, role: "COUNSELOR" } });
  const link = sender && (await prisma.careLink.findFirst({ where: { counselorId: sender.id, active: true } }));
  if (link) {
    const msg = await prisma.message.create({ data: { careLinkId: link.id, senderId: sender!.id, body: params.Body, channel: "SMS" } });
    publish(link.id, { type: "message", id: msg.id });
  }
  return new NextResponse("<Response/>", { headers: { "Content-Type": "text/xml" } });
}
