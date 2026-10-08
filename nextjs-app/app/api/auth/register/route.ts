import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sign } from "@/lib/auth";
export async function POST(req: NextRequest) {
  const { name, email, password, role } = await req.json();
  if (!["PATIENT", "COUNSELOR", "GUARDIAN"].includes(role) || String(password).length < 8 || !name) return NextResponse.json({ error: "Please check your details." }, { status: 400 });
  const e = String(email).toLowerCase();
  if (await prisma.user.findUnique({ where: { email: e } })) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  // Counselors have no client access until an admin creates a CareLink for them.
  const u = await prisma.user.create({ data: { name, email: e, role, passwordHash: await bcrypt.hash(password, 10) } });
  const res = NextResponse.json({ role: u.role }, { status: 201 });
  res.cookies.set("session", await sign({ id: u.id, role: u.role, name: u.name }), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 604800 });
  return res;
}
