// Edge-safe (no database): used by middleware and by lib/auth.ts.
import { SignJWT, jwtVerify } from "jose";

export type Role = "PATIENT" | "ADMIN";
export type Claims = { sid: string; id: string; role: Role };
export const TTL = { PATIENT: 7 * 86400, ADMIN: 8 * 3600 } as const; // admin sessions are deliberately shorter

export function secretKey() {
  const s = process.env.SESSION_SECRET;
  const weak = !s || s.length < 32 || /a-random-string|change-?me|replace-?me|example/i.test(s);
  if (weak) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be a random string of 32+ characters (openssl rand -base64 48). Do not use the placeholder.");
    return new TextEncoder().encode("dev-only-secret-not-for-production-0123456789");
  }
  return new TextEncoder().encode(s);
}
export const signSession = (c: Claims) =>
  new SignJWT({ ...c }).setProtectedHeader({ alg: "HS256" }).setExpirationTime(`${TTL[c.role]}s`).sign(secretKey());
export async function readSession(t?: string): Promise<Claims | null> {
  try { return t ? ((await jwtVerify(t, secretKey())).payload as unknown as Claims) : null; } catch { return null; }
}
// Short-lived signed blob (used to carry the OAuth state/PKCE verifier through the Authgear redirect).
export const signShort = (p: Record<string, unknown>, secs = 600) =>
  new SignJWT(p).setProtectedHeader({ alg: "HS256" }).setExpirationTime(`${secs}s`).sign(secretKey());
export async function readShort<T = Record<string, string>>(t?: string): Promise<T | null> {
  try { return t ? ((await jwtVerify(t, secretKey())).payload as unknown as T) : null; } catch { return null; }
}
