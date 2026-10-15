import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { dec } from "@/lib/crypto";
import { Journal } from "@/components/patient/Journal";
export const dynamic = "force-dynamic";
export default async function Page() {
  const s = await getSession(); if (!s || s.role !== "PATIENT") redirect("/login");
  const rows = await prisma.journalEntry.findMany({ where: { patientId: s.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return <Journal entries={rows.map((r) => ({ id: r.id, createdAt: r.createdAt.toISOString(), prompt: r.prompt, body: dec(r.bodyEnc) ?? "", shared: r.shared }))} />;
}
