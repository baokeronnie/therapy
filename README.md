# Leronza & Co recovery platform

Two roles: **clients** (patients) and **admins**. There is no guardian login.

## demo/  (no install)
Open `demo/index.html` in a browser. Sample data only, no real accounts.

## nextjs-app/  (full app)
Needs Node 18+, a PostgreSQL database and an Authgear project. **See `DEPLOY.md` for the full deploy and test guide.**

```
cd nextjs-app
cp .env.example .env.local     # fill DATABASE_URL, SESSION_SECRET, DATA_ENCRYPTION_KEY
npm install
npx prisma db push
ADMIN_EMAIL=you@example.com npm run create-admin
npm run dev                    # http://localhost:3000
```

### How sign-in works (Authgear, OpenID Connect + PKCE)
"Sign in or create an account" sends the person to Authgear's hosted page (email + password). Authgear returns to
`/api/auth/callback`, where the app verifies the ID token, then finds or creates **that person's own account** and starts
**their own session** (one row per device in the `Session` table, shown on the Account page where they can sign devices out).
New clients then complete onboarding (phone, emergency contact, consent), saved to their record only.
Admins are registered with `npm run create-admin` and linked on first sign-in, only if Authgear has verified their email.
Public sign-up can only ever create client accounts.

### Secrets
Everything sensitive is a server-side environment variable (`.env.local`, git-ignored; Vercel env vars in production).
`SESSION_SECRET` must be random (the placeholder is rejected in production). Back up `DATA_ENCRYPTION_KEY`.

### Admin
`/admin` lists every client with their email and phone (collected at signup), progress and status.
`/admin/clients/[id]` shows full details, emergency contact, trackers, sessions and an access log, and exports
that client's data as CSV or JSON. Every view and export is recorded in the audit log.
Clients' journal entries are private unless the client shares them.

### Client features
Streak ring and next-badge progress, money-saved counter, daily check-in (mood, craving, sleep, water, exercise),
daily goals with streaks, trigger tracker with patterns, encrypted journal with prompts, coping toolkit
(4-7-8 breathing, 10-minute urge timer, 5-4-3-2-1 grounding), weekly insights, sessions, messages,
and a privacy page where they can edit details, download all their data, or request deletion.

### Privacy and data protection
- `/privacy` is public and linked from sign-up (consent is required and recorded with a version and timestamp), the footer and Settings.
- Phone numbers, emergency contacts, journal entries and trigger notes are encrypted at rest (AES-256-GCM, `lib/crypto.ts`).
- All app pages and APIs require a session and the right role; responses are `no-store`; `robots.txt` blocks crawlers; security headers are set in `next.config.js`.
- Have the privacy notice reviewed by a lawyer for your jurisdiction before launch.

### Notes
- Chat and alerts refresh by polling. Replace with WebSockets or SSE for instant delivery.
- Twilio SMS (`app/api/sms/route.ts`) works once the `TWILIO_*` values are set. Message text is not field-encrypted, so conversation search keeps working.
- Admins' bookable hours are created by `create-admin` (weekdays 08:00 to 15:00 for 14 days). An availability editor is not built yet.
- Deleting a client in the app removes their data here; also remove their login in Authgear (User Management).
- MFA can be switched on in the Authgear portal; sign-in works with it because Authgear hosts the screen.
- Not built: milestone posting UI, SMS toggle in the chat UI.
