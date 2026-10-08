# Leronza & Co recovery platform

## demo/  (no install)
Open `demo/index.html` in a browser. Sample data only.

## nextjs-app/  (full app)
Needs Node 18+ and a PostgreSQL database.
```
cd nextjs-app
cp .env.example .env     # set DATABASE_URL and JWT_SECRET
npm install
npm run setup            # creates tables and seeds demo accounts
npm run dev              # http://localhost:3000
```
Demo logins (password `password123`): patient@demo.app, counselor@demo.app, guardian@demo.app

Try: as the patient hold the panic button for 2 seconds, then sign in as the guardian or counselor in another browser window. The alert appears within 5 seconds.

Notes
- Chat and alerts refresh by polling every 4 to 5 seconds. Replace with WebSockets or SSE for instant delivery.
- Twilio SMS (app/api/sms/route.ts) works once the TWILIO_* values are set and your Twilio number's webhook points at it (use POST there).
- New counselors can register but see no clients until a CareLink is created for them (admin step, not built).
- Left out: counselor client detail charts, milestone posting UI, availability editor, guardian invitations, SMS toggle in the chat UI.
