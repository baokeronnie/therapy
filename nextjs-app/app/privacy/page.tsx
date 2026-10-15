import Link from "next/link";
import { PRIVACY_VERSION, privacyEmail } from "@/lib/privacy";
export const metadata = { title: "Privacy notice · Leronza & Co" };
const H = ({ children }: { children: React.ReactNode }) => <h2 className="mt-8 text-2xl">{children}</h2>;
export default function Privacy() {
  const mail = privacyEmail();
  return (
    <main id="main" className="card mx-auto my-8 max-w-3xl [&_li]:mt-1 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
      <h1 className="text-4xl">Privacy notice</h1>
      <p className="text-sm text-ink-soft">Version {PRIVACY_VERSION}. Leronza &amp; Co is responsible for the information described here.</p>
      <p>Recovery is personal. This notice explains, in plain language, what we collect, why, who can see it, how we protect it, and the choices you have. We treat everything about your recovery as sensitive health information.</p>

      <H>What we collect</H>
      <ul>
        <li><b>When you sign up and finish setting up your account:</b> your name, email address, phone number, preferred way to be contacted, an emergency contact (their name, relationship and phone number), and optionally your recovery start date. We also record that you accepted this notice, and when.</li>
        <li><b>As you use the app:</b> daily check-ins (mood, cravings, sober or not, sleep, water, exercise), trigger logs, goals, journal entries, milestones, your messages with your counselor, session bookings, and any help alerts you send.</li>
        <li><b>Technical data:</b> a sign-in session cookie that keeps you signed in. We do not use advertising or tracking cookies.</li>
      </ul>

      <H>Why we use it</H>
      <ul>
        <li>To run your account and sign you in securely.</li>
        <li>To support your recovery: show your progress, let your counselor follow up, and book sessions.</li>
        <li>To respond quickly if you press the help button, including contacting your emergency contact if we cannot reach you.</li>
        <li>To keep the service safe, and to meet legal obligations.</li>
      </ul>
      <p>We do not sell your information, we do not use it for advertising, and we do not share it with employers, insurers or other third parties for their own purposes.</p>

      <H>Who can see your information</H>
      <ul>
        <li><b>You</b>, always.</li>
        <li><b>Leronza &amp; Co administrators</b>, who need your details and progress to look after you. Admin access requires a password, and every time an administrator opens or exports your record it is written to an access log.</li>
        <li><b>Journal entries are private.</b> Administrators can only read an entry if you choose to share it, and you can change that at any time.</li>
        <li><b>Nobody else.</b> Your information is never shown on any public page and is not visible to other clients.</li>
      </ul>

      <H>Service providers we rely on</H>
      <ul>
        <li><b>Authgear</b> handles sign-in. Your email, name and password are processed by Authgear so we never store your password.</li>
        <li><b>Our hosting and database provider</b> stores the data described above on our behalf.</li>
        <li><b>Twilio</b> delivers text messages, only if you and your counselor use the text-message option.</li>
      </ul>
      <p>These providers may only use your information to provide their service to us.</p>

      <H>How we keep it safe</H>
      <ul>
        <li>All traffic between your device and the app is encrypted (HTTPS).</li>
        <li>Phone numbers, emergency contact details, journal entries and trigger notes are additionally encrypted in the database, so they are unreadable even if the database itself were exposed.</li>
        <li>Sessions use secure, HTTP-only cookies. Administrator sessions expire sooner than client sessions.</li>
        <li>Access is limited by role, sign-in attempts are rate limited, and the app is hidden from search engines.</li>
      </ul>
      <p>No system is perfectly secure. If a breach ever affects your information we will tell you and the relevant authority as the law requires.</p>

      <H>How long we keep it</H>
      <p>We keep your information while your account is active. When you ask us to delete your data we remove your profile, check-ins, journal, messages and other records. We keep only a minimal access log (who opened what, and when), and anything we are legally required to keep.</p>

      <H>Your choices and rights</H>
      <ul>
        <li><b>See and download</b> everything we hold about you from Settings in the app.</li>
        <li><b>Correct</b> your contact details and emergency contact in Settings.</li>
        <li><b>Delete</b>: request deletion from Settings and an administrator will complete it.</li>
        <li><b>Withdraw consent or complain</b>: contact us, or the data protection authority in your country.</li>
      </ul>

      <H>Contact</H>
      <p>{mail ? <>Questions about this notice or your data: <a className="underline" href={`mailto:${mail}`}>{mail}</a>.</> : <>Questions about this notice or your data: send a message to your counselor in the app.</>}</p>
      <p>If you are in danger or in a medical emergency, call your local emergency number now.</p>
      <p className="mt-6"><Link href="/login" className="btn-quiet">Back to sign in</Link></p>
    </main>
  );
}
