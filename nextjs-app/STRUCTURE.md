# Directory layout

```
nextjs-app/
├─ middleware.ts                 # session check + role routing (/patient, /admin)
├─ next.config.js                # security headers, no-store caching
├─ prisma/schema.prisma          # roles: PATIENT, ADMIN. ClientProfile holds encrypted contact details
├─ scripts/create-admin.ts       # registers an admin email + default bookable hours
├─ lib/
│  ├─ authgear.ts                # Authgear OIDC: PKCE, code exchange, ID-token verification, logout URL
│  ├─ jwt.ts                     # edge-safe signed session cookie
│  ├─ auth.ts                    # database-backed sessions, requireRole(), api() wrapper
│  ├─ crypto.ts                  # AES-256-GCM field encryption
│  ├─ clientData.ts              # builds a client's full record + CSV (admin export, self download)
│  ├─ ratelimit.ts, privacy.ts, db.ts, realtime.ts
├─ app/
│  ├─ login/page.tsx             # "Sign in or create an account" (redirects to Authgear)
│  ├─ onboarding/page.tsx        # new client: own details + emergency contact + privacy consent
│  ├─ account/page.tsx           # own sessions per device, sign out other devices
│  ├─ privacy/page.tsx           # public privacy notice
│  ├─ patient/                   # Today, trackers (triggers), journal, toolkit, schedule, chat, settings
│  ├─ admin/                     # client list, client detail + export, chat
│  └─ api/
│     ├─ auth/{login,callback,logout}   # Authgear OIDC
│     ├─ onboarding, me/sessions
│     ├─ checkins, triggers, journal, goals, panic, messages, appointments, sms
│     ├─ me, me/export           # client edits own details, downloads own data, requests deletion
│     └─ admin/clients/[id]/{export,assign} and DELETE  # ADMIN only
└─ components/{patient,admin,shared,scheduling}
```
