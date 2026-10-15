import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { dec } from "@/lib/crypto";
import { Settings } from "@/components/patient/Settings";
export const dynamic = "force-dynamic";
export default async function Page() {
  const s = await getSession(); if (!s || s.role !== "PATIENT") redirect("/login");
  const u = await prisma.user.findUnique({ where: { id: s.id }, include: { profile: true } });
  if (!u?.profile) redirect("/login");
  const p = u.profile;
  return <Settings p={{ name: u.name, email: u.email, phone: dec(p.phoneEnc) ?? "", emergencyName: dec(p.emergencyNameEnc) ?? "", emergencyPhone: dec(p.emergencyPhoneEnc) ?? "", emergencyRelation: dec(p.emergencyRelationEnc) ?? "",
    preferredContact: p.preferredContact, soberSince: p.soberSince?.toISOString().slice(0, 10) ?? "", dailySpend: p.dailySpend?.toString() ?? "", deletionRequested: !!p.deletionRequestedAt }} />;
}
