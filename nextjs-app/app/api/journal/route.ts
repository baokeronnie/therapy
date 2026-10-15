import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { api } from "@/lib/auth";
import { enc, dec } from "@/lib/crypto";
export const GET = api(["PATIENT"], async (_r, s) => {
  const rows = await prisma.journalEntry.findMany({ where: { patientId: s.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json(rows.map((r) => ({ id: r.id, createdAt: r.createdAt, prompt: r.prompt, body: dec(r.bodyEnc) ?? "", shared: r.shared })));
});
export const POST = api(["PATIENT"], async (req, s) => {
  const { body, prompt, shared } = await req.json();
  const text = String(body ?? "").trim();
  if (!text) return NextResponse.json({ error: "Write something first" }, { status: 400 });
  await prisma.journalEntry.create({ data: { patientId: s.id, bodyEnc: enc(text.slice(0, 5000))!, prompt: prompt ? String(prompt).slice(0, 200) : null, shared: !!shared } });
  return NextResponse.json({ ok: true }, { status: 201 });
});
// Toggle sharing with your admin, or delete.
export const PATCH = api(["PATIENT"], async (req, s) => {
  const { id, shared } = await req.json();
  await prisma.journalEntry.updateMany({ where: { id, patientId: s.id }, data: { shared: !!shared } });
  return NextResponse.json({ ok: true });
});
export const DELETE = api(["PATIENT"], async (req, s) => {
  const { id } = await req.json();
  await prisma.journalEntry.deleteMany({ where: { id, patientId: s.id } });
  return NextResponse.json({ ok: true });
});
