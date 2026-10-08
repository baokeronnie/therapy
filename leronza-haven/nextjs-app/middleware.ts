import { NextRequest, NextResponse } from "next/server";
import { verify, home } from "@/lib/auth";
const area: Record<string, string> = { "/patient": "PATIENT", "/counselor": "COUNSELOR", "/guardian": "GUARDIAN" };
export async function middleware(req: NextRequest) {
  const s = await verify(req.cookies.get("session")?.value);
  if (!s) return NextResponse.redirect(new URL("/login", req.url));
  const need = area["/" + req.nextUrl.pathname.split("/")[1]];
  if (need && s.role !== need) return NextResponse.redirect(new URL(home(s.role), req.url));
  return NextResponse.next();
}
export const config = { matcher: ["/patient/:path*", "/counselor/:path*", "/guardian/:path*"] };
