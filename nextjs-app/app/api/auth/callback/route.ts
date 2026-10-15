import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startSession } from "@/lib/auth";
import { completeLogin, type Identity } from "@/lib/authgear";
import { readShort } from "@/lib/jwt";
import { enc } from "@/lib/crypto";
import { ipOf, limited } from "@/lib/ratelimit";

class Refuse extends Error {}
const fail = (req: NextRequest, code: string) => {
  const r = NextResponse.redirect(new URL(`/login?error=${code}`, req.url));
  r.cookies.set("ag_oauth", "", { path: "/api/auth", maxAge: 0 });
  return r;
};

/** Finds (or creates) the local account for an Authgear identity. One Authgear user = one local account. */
async function resolveUser(id: Identity) {
  let u = await prisma.user.findUnique({ where: { authgearId: id.sub } });
  if (!u && id.email && id.emailVerified) {
    // Pre-created accounts (e.g. the admin) are linked by email, but ONLY when Authgear has verified that email.
    const byEmail = await prisma.user.findUnique({ where: { email: id.email } });
    if (byEmail?.authgearId && byEmail.authgearId !== id.sub) throw new Refuse("conflict");
    if (byEmail) u = await prisma.user.update({ where: { id: byEmail.id }, data: { authgearId: id.sub } });
  }
  if (!u) {
    if (!id.email) throw new Refuse("no_email");
    if (await prisma.user.findUnique({ where: { email: id.email } })) throw new Refuse("verify_email");
    u = await prisma.user.create({ data: { authgearId: id.sub, email: id.email, name: id.name?.slice(0, 80) || id.email.split("@")[0], role: "PATIENT" } }); // public sign-up is always a client
  } else if (id.email && id.emailVerified && u.email !== id.email) {
    u = await prisma.user.update({ where: { id: u.id }, data: { email: id.email } }).catch(() => u!);
  }
  return u;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  if (limited(`cb:${ipOf(req)}`, 30)) return fail(req, "failed");
  if (q.get("error")) return fail(req, "denied");
  const flow = await readShort<{ state: string; nonce: string; verifier: string }>(req.cookies.get("ag_oauth")?.value);
  const code = q.get("code");
  if (!flow || !code || q.get("state") !== flow.state) return fail(req, "state");
  try {
    const identity = await completeLogin(code, flow.verifier, flow.nonce);
    const user = await resolveUser(identity);
    const hasProfile = user.role === "ADMIN" || !!(await prisma.clientProfile.findUnique({ where: { userId: user.id }, select: { userId: true } }));
    const dest = user.role === "ADMIN" ? "/admin" : hasProfile ? "/patient" : "/onboarding";
    const res = NextResponse.redirect(new URL(dest, req.url));
    res.cookies.set("ag_oauth", "", { path: "/api/auth", maxAge: 0 });
    await startSession(res, user, { userAgent: req.headers.get("user-agent"), idTokenEnc: enc(identity.idToken) }); // a brand-new session for this person on this device
    return res;
  } catch (e) { return fail(req, e instanceof Refuse ? e.message : "failed"); }
}
