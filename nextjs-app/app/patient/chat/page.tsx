import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ChatPanel } from "@/components/shared/ChatPanel";
export const dynamic = "force-dynamic";
export default async function Page() {
  const s = await getSession(); if (!s) redirect("/login");
  const link = await prisma.careLink.findFirst({ where: { patientId: s.id, active: true }, include: { counselor: true } });
  if (!link) return <main id="main" className="card mx-auto my-8 max-w-xl">Messaging opens once a counselor is assigned to you.</main>;
  return <ChatPanel careLinkId={link.id} meId={s.id} withName={link.counselor.name} />;
}
