import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession, home } from "@/lib/auth";
export const dynamic = "force-dynamic";
// Every client page: must be a live client session whose onboarding (own details + consent) is complete.
export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession(); if (!s) redirect("/login");
  if (s.role !== "PATIENT") redirect(home(s.role));
  if (!(await prisma.clientProfile.findUnique({ where: { userId: s.id }, select: { userId: true } }))) redirect("/onboarding");
  return <>{children}</>;
}
