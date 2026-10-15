import "server-only";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession, signSession, TTL, type Role } from "@/lib/jwt";

export type { Role };
export type Session = { id: string; role: Role; name: string; sid: string };
export const home = (r: Role) => (r === "ADMIN" ? "/admin" : "/patient");

/** Cookie -> signed token -> live session row in the database (not revoked, not expired) -> current user. */
async function resolve(token?: string): Promise<Session | null> {
  const c = await readSession(token);
  if (!c?.sid) return null;
  const row = await prisma.session.findUnique({ where: { id: c.sid }, include: { user: { select: { id: true, role: true, name: true } } } });
  if (!row || row.revokedAt || row.expiresAt < new Date() || row.userId !== c.id) return null;
  if (Date.now() - +row.lastSeenAt > 10 * 60_000) await prisma.session.update({ where: { id: row.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  return { id: row.user.id, role: row.user.role, name: row.user.name, sid: row.id }; // role always comes from the database
}
export const getSession = () => resolve(cookies().get("session")?.value);

/** Creates a new session for this user on this device and sets the cookies. */
export async function startSession(res: NextResponse, user: { id: string; role: Role }, opts: { userAgent?: string | null; idTokenEnc?: string | null }) {
  const row = await prisma.session.create({ data: { userId: user.id, expiresAt: new Date(Date.now() + TTL[user.role] * 1000), userAgent: opts.userAgent?.slice(0, 250) ?? null, idTokenEnc: opts.idTokenEnc ?? null } });
  res.cookies.set("session", await signSession({ sid: row.id, id: user.id, role: user.role }), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: TTL[user.role],
  });
  return row;
}
export const clearSessionCookie = (res: NextResponse) => { res.cookies.set("session", "", { path: "/", maxAge: 0 }); return res; };

export async function requireRole(req: NextRequest, roles: Role[]) {
  const s = await resolve(req.cookies.get("session")?.value);
  if (!s) throw new Response("Unauthorized", { status: 401 });
  if (!roles.includes(s.role)) throw new Response("Forbidden", { status: 403 });
  return s;
}
/** Wraps a route handler with session + role validation. Responses are never cacheable. */
export const api = (roles: Role[], fn: (req: NextRequest, s: Session, ctx: any) => Promise<Response>) =>
  async (req: NextRequest, ctx: any) => {
    try {
      const res = await fn(req, await requireRole(req, roles), ctx);
      res.headers.set("Cache-Control", "no-store");
      return res;
    } catch (e) { return e instanceof Response ? e : new Response("Server error", { status: 500 }); }
  };
