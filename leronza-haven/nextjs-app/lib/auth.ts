import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
export type Role = "PATIENT" | "COUNSELOR" | "GUARDIAN";
export type Session = { id: string; role: Role; name: string };
const key = () => new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");
export const sign = (s: Session) => new SignJWT({ ...s }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(key());
export async function verify(t?: string): Promise<Session | null> {
  try { return t ? ((await jwtVerify(t, key())).payload as unknown as Session) : null; } catch { return null; }
}
export const getSession = () => verify(cookies().get("session")?.value);
export async function requireRole(req: NextRequest, roles: Role[]) {
  const s = await verify(req.cookies.get("session")?.value);
  if (!s || !roles.includes(s.role)) throw new Response("Forbidden", { status: 403 });
  return s;
}
/** Wraps a route handler with JWT + role validation. */
export const api = (roles: Role[], fn: (req: NextRequest, s: Session, ctx: any) => Promise<Response>) =>
  async (req: NextRequest, ctx: any) => {
    try { return await fn(req, await requireRole(req, roles), ctx); }
    catch (e) { return e instanceof Response ? e : new Response("Server error", { status: 500 }); }
  };
export const home = (r: Role) => (r === "PATIENT" ? "/patient" : r === "COUNSELOR" ? "/counselor" : "/guardian");
