/**
 * Registers an email as an ADMIN in the app's database and gives them default bookable hours.
 * Run this BEFORE that person signs in for the first time:
 *     ADMIN_EMAIL=you@example.com ADMIN_NAME="Your Name" npm run create-admin
 * The admin then signs in through Authgear with that email and a password. The email must be VERIFIED in Authgear,
 * which is what stops anyone else from claiming the admin account by signing up with the same address.
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
config({ path: ".env.local" }); config();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  if (!email.includes("@")) throw new Error("Set ADMIN_EMAIL (for example ADMIN_EMAIL=you@example.com npm run create-admin).");
  const db = new PrismaClient();
  const admin = await db.user.upsert({ where: { email }, update: { role: "ADMIN" }, create: { email, name: process.env.ADMIN_NAME || "Leronza Admin", role: "ADMIN", timeZone: "Africa/Gaborone" } });
  if (!(await db.availabilityBlock.count({ where: { counselorId: admin.id } }))) {
    // weekdays 08:00-15:00 Gaborone time (06:00-13:00 UTC) for the next 14 days
    const base = new Date(); base.setUTCHours(6, 0, 0, 0);
    for (let d = 1; d <= 14; d++) {
      const day = new Date(+base + d * 864e5); if ([0, 6].includes(day.getUTCDay())) continue;
      for (let k = 0; k < 7; k++) { const s = new Date(+day + k * 36e5); await db.availabilityBlock.create({ data: { counselorId: admin.id, startsAt: s, endsAt: new Date(+s + 36e5) } }); }
    }
  }
  console.log(`Admin registered: ${email}. They can now sign in at /login with a verified email.`);
  await db.$disconnect();
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
