import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/jwt";
// First gate (signature only, runs at the edge). Pages and APIs then re-check the live session in the database.
const area: Record<string, string> = { "/patient": "PATIENT", "/admin": "ADMIN" };
export async function middleware(req: NextRequest) {
  const s = await readSession(req.cookies.get("session")?.value);
  if (!s) return NextResponse.redirect(new URL("/login", req.url));
  const need = area["/" + req.nextUrl.pathname.split("/")[1]];
  if (need && s.role !== need) return NextResponse.redirect(new URL(s.role === "ADMIN" ? "/admin" : "/patient", req.url));
  return NextResponse.next();
}
export const config = { matcher: ["/patient/:path*", "/admin/:path*", "/account", "/onboarding"] };
