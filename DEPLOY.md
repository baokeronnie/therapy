# Deploy and test guide (Authgear + Next.js + PostgreSQL)

Plan: set up Authgear, test on your computer, then deploy to Vercel with a managed Postgres (Neon). About 45 minutes.

## 0. Before you start
- Rotate nothing you have already committed. **Never commit `.env.local`** (it is git-ignored).
- `SESSION_SECRET` **must be a real random value**. The placeholder `a-random-string-of-at-least-32-characters` is rejected in production on purpose, because anyone who knew it could forge a login.
  Generate: `openssl rand -base64 48`. Also generate `DATA_ENCRYPTION_KEY`: `openssl rand -base64 32`. Store both in your password manager. If `DATA_ENCRYPTION_KEY` is lost, encrypted phone numbers, emergency contacts and journals cannot be recovered.

## 1. Authgear portal settings (portal.authgear.com, your project `therapysession`)
1. **Applications → your app (client id `866affb44e24daf0`)**. Check the application type:
   - *Single Page Application* (PKCE, no secret): leave `AUTHGEAR_CLIENT_SECRET` empty. This is what the code expects by default.
   - *Traditional Web App*: copy its client secret into `AUTHGEAR_CLIENT_SECRET` (server-side only).
2. **Authorized Redirect URIs**: keep `http://localhost:3000/api/auth/callback` and **add** `https://YOUR-DOMAIN/api/auth/callback` (exact match, no trailing slash). Missing production URI is the #1 cause of a failed first deploy.
3. **Post Logout Redirect URIs**: add `http://localhost:3000/login` and `https://YOUR-DOMAIN/login`. This makes "Sign out" end the Authgear session too, so the next person on a shared phone must sign in again.
4. **Authentication → Login methods**: enable email + password for sign-up and login (the admin uses the same). Turn **email verification on** (required). Admin access is only granted to a *verified* email.
5. Optional hardening: password strength rules, and brute-force protection (on by default).

## 2. Database
Create a Postgres database (Neon free tier works: neon.tech). Copy two strings:
- the **pooled** connection string, used by the app on Vercel as `DATABASE_URL`
- the **direct** (non-pooled) string, used once from your computer to create the tables

## 3. Test locally first
```
cd nextjs-app
cp .env.example .env.local        # fill DATABASE_URL, SESSION_SECRET, DATA_ENCRYPTION_KEY (Authgear values are prefilled)
npm install
DATABASE_URL="<direct string>" npx prisma db push      # creates the tables
ADMIN_EMAIL=you@yourdomain.com ADMIN_NAME="Your Name" npm run create-admin
npm run dev                       # http://localhost:3000
```
Run `create-admin` **before** that person's first sign-in.

## 4. Deploy to Vercel
1. Push the project to a **private** GitHub repo (root = the `nextjs-app` folder, or set Root Directory to `nextjs-app`).
2. vercel.com → Add New Project → import the repo. Framework: Next.js (auto).
3. Environment Variables (Production), using your real domain:
   `DATABASE_URL` (pooled), `APP_URL=https://YOUR-DOMAIN`, `AUTHGEAR_ENDPOINT`, `AUTHGEAR_CLIENT_ID`,
   `AUTHGEAR_REDIRECT_URI=https://YOUR-DOMAIN/api/auth/callback`, `AUTHGEAR_POST_LOGOUT_REDIRECT_URI=https://YOUR-DOMAIN/login`,
   `SESSION_SECRET`, `DATA_ENCRYPTION_KEY`, `NEXT_PUBLIC_PRIVACY_EMAIL` (and `TWILIO_*` if you use SMS).
4. Deploy. Then register the admin against the production database from your computer:
   `DATABASE_URL="<production direct string>" ADMIN_EMAIL=... npm run create-admin`
5. Add your custom domain in Vercel, update the two Authgear URL lists (step 1) and the two env vars to match, and redeploy.
Note: Vercel's free Hobby plan is for non-commercial use; use a paid plan for a live service.

## 5. Live test checklist (use two browsers: one normal, one private window)
**Accounts and sessions (each person has their own)**
- [ ] Browser A: Sign in or create an account → Authgear page → create a client with a *new* email, verify it → you land on "Finish your account".
- [ ] Complete the form (phone, emergency contact, consent). You land on Today. Refresh: still signed in.
- [ ] Browser B: create a *second* client. Confirm each sees only their own data (Today, Journal, Settings).
- [ ] Settings: change your name/phone, save, reload: it persists, and only for that user.
- [ ] Account page: you see this device. Sign in on a phone too, then "Sign out all other devices"; the phone must be sent to the sign-in page on its next click.
- [ ] Sign out: you are returned to sign-in and must enter your password again.

**Client features**
- [ ] Check-in (mood, craving, sleep, water, exercise): save, edit, reload.
- [ ] Add 2 goals, tick one, remove one. Streak ring and badges show your start date.
- [ ] Log a trigger; patterns chart updates. Write a journal entry (private), then share it, then un-share it.
- [ ] Toolkit: breathing, 10-minute timer, grounding all run.
- [ ] Book a session, then cancel/reschedule it.
- [ ] Message your counselor.
- [ ] Hold the help button 2 seconds (test it with your admin watching).

**Admin (sign in as the admin email, a third browser)**
- [ ] `/admin` lists both clients with email and phone. The help alert from above appears; Acknowledge it.
- [ ] Open a client: contact details, emergency contact, check-ins, triggers, sessions. Only the *shared* journal entry is visible.
- [ ] Reply in chat; the client sees it within a few seconds.
- [ ] Export CSV and JSON for one client. Open the CSV; confirm the access log on that client shows who exported.
- [ ] Client requests deletion in Settings → admin sees "Deletion requested" → "Delete client data" removes them.

**Security spot checks**
- [ ] While signed out, open `/admin`, `/patient`, `/api/admin/clients/anything/export`: all refuse or redirect to sign-in.
- [ ] As a client, open `/admin` → redirected back to `/patient`.
- [ ] `yourdomain/robots.txt` disallows everything; responses carry `Cache-Control: no-store`.

## 6. Troubleshooting
| You see | Cause / fix |
|---|---|
| Authgear error "redirect_uri not allowed" | The exact callback URL is missing from Authorized Redirect URIs (step 1.2). |
| `/login?error=config` | `AUTHGEAR_ENDPOINT` / `AUTHGEAR_CLIENT_ID` missing on the server. |
| `/login?error=failed` after Authgear | Wrong app type or secret (step 1.1), or the redirect URI env differs from the portal. Check Vercel function logs. |
| `/login?error=verify_email` | That email already exists here but is not verified in Authgear. Verify it, then retry. This protects the admin account. |
| Admin signs in but gets the client onboarding | `create-admin` was not run first, or used a different email. Run it, then sign in again. |
| 500 on every page | `SESSION_SECRET` is the placeholder/too short, or `DATABASE_URL` is wrong. |
| Sign-out ends on an Authgear error page | The post-logout URL is not registered (step 1.3). |

## 7. Known limits
- Chat and alerts refresh by polling every few seconds (no websockets yet).
- The login rate limiter is per server instance. Authgear's own protection is the main defence.
- MFA is available in Authgear but not enabled here by default; turn it on for admins in the Authgear portal when you are ready.
- Deleting a client removes their data here. Remove their login from Authgear (User Management) as well.
