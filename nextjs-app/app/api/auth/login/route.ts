import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sign } from "@/lib/auth";
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const u = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (!u || !(await bcrypt.compare(String(password), u.passwordHash))) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  const res = NextResponse.json({ role: u.role });
  res.cookies.set("session", await sign({ id: u.id, role: u.role, name: u.name }), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 604800 });
  return res;
}
