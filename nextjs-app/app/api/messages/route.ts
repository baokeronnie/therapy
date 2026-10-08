import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { api } from "@/lib/auth";
const member = (id: string, uid: string) => prisma.careLink.findFirst({ where: { id, OR: [{ patientId: uid }, { counselorId: uid }] } });
export const GET = api(["PATIENT", "COUNSELOR"], async (req, s) => {
  const id = req.nextUrl.searchParams.get("careLinkId") ?? "", q = req.nextUrl.searchParams.get("q") ?? "";
  if (!(await member(id, s.id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const m = await prisma.message.findMany({ where: { careLinkId: id, ...(q ? { deletedAt: null, body: { contains: q, mode: "insensitive" } } : {}) }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(m.map((x) => (x.deletedAt ? { ...x, body: "" } : x)));
});
export const POST = api(["PATIENT", "COUNSELOR"], async (req, s) => {
  const { careLinkId, body } = await req.json();
  if (!String(body ?? "").trim() || !(await member(careLinkId, s.id))) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  return NextResponse.json(await prisma.message.create({ data: { careLinkId, senderId: s.id, body: String(body).trim() } }), { status: 201 });
});
