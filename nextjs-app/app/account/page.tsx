import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { accountSettingsUrl } from "@/lib/authgear";
import { AccountSessions } from "@/components/shared/AccountSessions";
export const dynamic = "force-dynamic";
export default async function Page() {
  const s = await getSession(); if (!s) redirect("/login");
  const [u, rows] = await Promise.all([
    prisma.user.findUnique({ where: { id: s.id }, select: { name: true, email: true, role: true } }),
    prisma.session.findMany({ where: { userId: s.id, revokedAt: null, expiresAt: { gt: new Date() } }, orderBy: { lastSeenAt: "desc" } }),
  ]);
  return <AccountSessions name={u?.name ?? ""} email={u?.email ?? ""} role={s.role} settingsUrl={accountSettingsUrl()}
    sessions={rows.map((r) => ({ id: r.id, ua: r.userAgent ?? "Unknown device", created: r.createdAt.toISOString(), seen: r.lastSeenAt.toISOString(), current: r.id === s.sid }))} />;
}
