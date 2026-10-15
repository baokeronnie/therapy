import "server-only";
import { prisma } from "@/lib/db";
import { dec } from "@/lib/crypto";

/** Everything held about one client. `audience: "admin"` hides journal entries the client has not shared. */
export async function clientData(id: string, audience: "admin" | "self") {
  const u = await prisma.user.findFirst({
    where: { id, role: "PATIENT" },
    include: {
      profile: true,
      asPatient: { include: { counselor: { select: { name: true, email: true } } } },
      checkIns: { orderBy: { date: "asc" } },
      triggers: { orderBy: { createdAt: "asc" } },
      journal: { where: audience === "admin" ? { shared: true } : {}, orderBy: { createdAt: "asc" } },
      goals: { include: { logs: true } },
      milestones: true,
      apptsAsPatient: { orderBy: { startsAt: "asc" } },
    },
  });
  if (!u) return null;
  const links = u.asPatient.map((l) => l.id);
  const messages = await prisma.message.findMany({ where: { careLinkId: { in: links }, deletedAt: null }, orderBy: { createdAt: "asc" } });
  const p = u.profile;
  return {
    exportedAt: new Date().toISOString(),
    profile: {
      id: u.id, name: u.name, email: u.email, phone: dec(p?.phoneEnc), joinedAt: u.createdAt.toISOString(), timeZone: u.timeZone,
      preferredContact: p?.preferredContact ?? null, soberSince: p?.soberSince?.toISOString().slice(0, 10) ?? null, dailySpend: p?.dailySpend ?? null,
      emergencyContact: { name: dec(p?.emergencyNameEnc), phone: dec(p?.emergencyPhoneEnc), relationship: dec(p?.emergencyRelationEnc) },
      privacyConsent: p ? { version: p.consentVersion, acceptedAt: p.consentAt.toISOString() } : null,
      assignedTo: u.asPatient.map((l) => l.counselor.name),
      deletionRequestedAt: p?.deletionRequestedAt?.toISOString() ?? null,
    },
    checkIns: u.checkIns.map((c) => ({ date: c.date.toISOString().slice(0, 10), mood: c.mood, craving: c.craving, sober: c.sober, sleepHours: c.sleepHours, waterGlasses: c.water, exerciseMinutes: c.exercise })),
    triggers: u.triggers.map((t) => ({ at: t.createdAt.toISOString(), trigger: t.trigger, intensity: t.intensity, whatHelped: dec(t.helpedEnc) })),
    journal: u.journal.map((j) => ({ at: j.createdAt.toISOString(), prompt: j.prompt, entry: dec(j.bodyEnc), sharedWithAdmin: j.shared })),
    goals: u.goals.map((g) => ({ goal: g.title, active: g.active, daysCompleted: g.logs.length })),
    milestones: u.milestones.map((m) => ({ title: m.title, detail: m.detail, at: m.achievedAt.toISOString() })),
    appointments: u.apptsAsPatient.map((a) => ({ startsAt: a.startsAt.toISOString(), status: a.status, cancelReason: a.cancelReason })),
    messages: messages.map((m) => ({ at: m.createdAt.toISOString(), from: m.senderId === u.id ? "client" : "admin", channel: m.channel, text: m.body })),
  };
}
export type ClientData = NonNullable<Awaited<ReturnType<typeof clientData>>>;

// CSV with one block per section. Cells starting with = + - @ are neutralised so a client cannot plant a spreadsheet formula.
const cell = (v: unknown) => { let s = v == null ? "" : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export function toCsv(d: ClientData) {
  const out: string[] = [];
  const block = (title: string, rows: Record<string, unknown>[]) => {
    out.push(cell(title.toUpperCase()));
    if (!rows.length) out.push("(none)"); else { const h = Object.keys(rows[0]); out.push(h.map(cell).join(",")); rows.forEach((r) => out.push(h.map((k) => cell(r[k])).join(","))); }
    out.push("");
  };
  const { emergencyContact: e, privacyConsent: c, assignedTo, ...rest } = d.profile;
  block("profile", [{ ...rest, assignedTo: assignedTo.join("; "), emergencyName: e.name, emergencyPhone: e.phone, emergencyRelationship: e.relationship, consentVersion: c?.version, consentAcceptedAt: c?.acceptedAt }]);
  block("check-ins", d.checkIns); block("triggers", d.triggers); block("journal (shared entries only)", d.journal);
  block("goals", d.goals); block("milestones", d.milestones); block("appointments", d.appointments); block("messages", d.messages);
  return "\uFEFF" + out.join("\r\n");
}
