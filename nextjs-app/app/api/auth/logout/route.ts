import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clearSessionCookie } from "@/lib/auth";
import { readSession } from "@/lib/jwt";
import { dec } from "@/lib/crypto";
import { logoutUrl } from "@/lib/authgear";
// Ends THIS device's session, then (if configured) the Authgear browser session as well.
export async function POST(req: NextRequest) {
  const c = await readSession(req.cookies.get("session")?.value);
  let redirect: string | null = null;
  if (c?.sid) {
    const row = await prisma.session.findFirst({ where: { id: c.sid, userId: c.id } });
    if (row) { await prisma.session.update({ where: { id: row.id }, data: { revokedAt: new Date() } }); redirect = await logoutUrl(dec(row.idTokenEnc)).catch(() => null); }
  }
  return clearSessionCookie(NextResponse.json({ ok: true, redirect }));
}
