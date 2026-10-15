import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession, home } from "@/lib/auth";
import { Onboarding } from "@/components/patient/Onboarding";
export const dynamic = "force-dynamic";
export default async function Page() {
  const s = await getSession(); if (!s) redirect("/login");
  if (s.role !== "PATIENT") redirect(home(s.role));
  if (await prisma.clientProfile.findUnique({ where: { userId: s.id }, select: { userId: true } })) redirect("/patient");
  const u = await prisma.user.findUnique({ where: { id: s.id }, select: { name: true, email: true } });
  return <Onboarding name={u?.name ?? ""} email={u?.email ?? ""} />;
}
