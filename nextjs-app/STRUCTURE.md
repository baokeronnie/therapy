# Directory layout

```
haven/
├─ prisma/schema.prisma
├─ tailwind.config.ts
├─ middleware.ts                    # JWT verify + role routing (/patient, /counselor, /guardian)
├─ lib/
│  ├─ auth.ts                       # sign/verify JWT (jose), httpOnly cookie, requireRole()
│  ├─ db.ts                         # Prisma singleton
│  ├─ realtime.ts                   # WebSocket / SSE hub (panic, chat, tracker sync)
│  └─ audit.ts                      # writes AuditLog rows
├─ app/
│  ├─ globals.css
│  ├─ layout.tsx                    # fonts, skip link, <PanicButton/> mount for patients
│  ├─ (auth)/login/page.tsx
│  ├─ (patient)/patient/
│  │  ├─ page.tsx                   # server: loads data, renders <PatientDashboard/>
│  │  ├─ chat/page.tsx
│  │  ├─ schedule/page.tsx          # renders <SchedulingInterface/>
│  │  └─ tracker/page.tsx
│  ├─ (counselor)/counselor/
│  │  ├─ page.tsx                   # clinical triage list
│  │  ├─ clients/[id]/page.tsx      # shared tracker + chat
│  │  └─ availability/page.tsx
│  ├─ (guardian)/guardian/page.tsx  # alerts + permitted summary only
│  └─ api/
│     ├─ auth/{login,logout}/route.ts
│     ├─ panic/route.ts             # creates PanicEvent, pushes to Guardian + Counselor
│     ├─ messages/route.ts          # POST, GET (search, paginate)
│     ├─ messages/[id]/route.ts     # PATCH (edit), DELETE (soft)
│     ├─ appointments/route.ts      # GET, POST
│     ├─ appointments/[id]/route.ts # PATCH (reschedule), DELETE (cancel + reason)
│     ├─ checkins/route.ts          # GET, POST, PATCH
│     └─ milestones/route.ts        # counselor POST/PATCH/DELETE
└─ components/
   ├─ ui/                           # shadcn: button, dialog, tabs, toast, textarea
   ├─ shared/PanicButton.tsx
   ├─ patient/PatientDashboard.tsx
   └─ scheduling/SchedulingInterface.tsx
```
