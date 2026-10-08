import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ChatPanel } from "@/components/shared/ChatPanel";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: { id: string } }) {
  const s = await getSession(); if (!s) redirect("/login");
  const link = await prisma.careLink.findFirst({ where: { id: params.id, counselorId: s.id }, include: { patient: true } });
  if (!link) notFound();
  return <ChatPanel careLinkId={link.id} meId={s.id} withName={link.patient.name} />;
}
