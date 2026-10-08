import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const db = new PrismaClient();
async function main() {
  const h = await bcrypt.hash("password123", 10), DAY = 864e5;
  await db.auditLog.deleteMany(); await db.panicEvent.deleteMany(); await db.appointment.deleteMany(); await db.availabilityBlock.deleteMany();
  await db.message.deleteMany(); await db.milestone.deleteMany(); await db.checkIn.deleteMany(); await db.guardianLink.deleteMany(); await db.careLink.deleteMany(); await db.user.deleteMany();
  const c = await db.user.create({ data: { email: "counselor@demo.app", name: "Dr. Naledi Mokoena", role: "COUNSELOR", passwordHash: h, timeZone: "Africa/Gaborone" } });
  const p = await db.user.create({ data: { email: "patient@demo.app", name: "Amara Dube", role: "PATIENT", passwordHash: h, timeZone: "Africa/Gaborone" } });
  const g = await db.user.create({ data: { email: "guardian@demo.app", name: "Thabo Dube", role: "GUARDIAN", passwordHash: h } });
  const link = await db.careLink.create({ data: { patientId: p.id, counselorId: c.id, soberSince: new Date(Date.now() - 23 * DAY) } });
  await db.guardianLink.create({ data: { guardianId: g.id, wardId: p.id } });
  const moods = [4, 3, 3, 4, 2, 3, 4], cr = [3, 5, 4, 2, 6, 3, 2];
  for (let i = 0; i < 6; i++) await db.checkIn.create({ data: { patientId: p.id, date: new Date(new Date(Date.now() - (6 - i) * DAY).toISOString().slice(0, 10)), mood: moods[i], craving: cr[i], sober: true } });
  await db.milestone.create({ data: { patientId: p.id, authorId: c.id, title: "One week", detail: "Seven days in a row" } });
  await db.message.create({ data: { careLinkId: link.id, senderId: c.id, body: "Hi Amara, how did the week go?" } });
  const base = new Date(); base.setUTCHours(6, 0, 0, 0);
  for (let d = 1; d <= 6; d++) for (let k = 0; k < 7; k++) { const s = new Date(+base + d * DAY + k * 36e5); await db.availabilityBlock.create({ data: { counselorId: c.id, startsAt: s, endsAt: new Date(+s + 36e5) } }); }
  console.log("Seeded. Logins (password: password123): patient@demo.app, counselor@demo.app, guardian@demo.app");
}
main().finally(() => db.$disconnect());
