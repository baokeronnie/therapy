import { NextRequest, NextResponse } from "next/server";
import { authorizeUrl } from "@/lib/authgear";
import { signShort } from "@/lib/jwt";
// Starts sign-in / sign-up: redirects to Authgear's hosted page. Same entry point for both.
export async function GET(req: NextRequest) {
  try {
    const { url, state, nonce, verifier } = await authorizeUrl();
    const res = NextResponse.redirect(url);
    res.cookies.set("ag_oauth", await signShort({ state, nonce, verifier }), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/auth", maxAge: 600 });
    return res;
  } catch { return NextResponse.redirect(new URL("/login?error=config", req.url)); }
}
