import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { dec } from "@/lib/crypto";
import { Trackers } from "@/components/patient/Trackers";
export const dynamic = "force-dynamic";
export default async function Page() {
  const s = await getSession(); if (!s || s.role !== "PATIENT") redirect("/login");
  const rows = await prisma.triggerLog.findMany({ where: { patientId: s.id }, orderBy: { createdAt: "desc" }, take: 60 });
  return <Trackers rows={rows.map((r) => ({ id: r.id, createdAt: r.createdAt.toISOString(), trigger: r.trigger, intensity: r.intensity, helped: dec(r.helpedEnc) }))} />;
}
