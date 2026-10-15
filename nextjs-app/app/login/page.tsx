import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, home } from "@/lib/auth";
export const dynamic = "force-dynamic";
const ERR: Record<string, string> = {
  denied: "Sign-in was cancelled. You can try again whenever you are ready.",
  state: "That sign-in link expired. Please start again.",
  verify_email: "An account with this email exists but the email has not been verified yet. Verify it in the sign-in screen, then try again.",
  no_email: "Your sign-in did not include an email address, so we could not set up your account.",
  conflict: "This email is already linked to a different sign-in. Contact your administrator.",
  config: "Sign-in is not configured correctly yet. Please contact the administrator.",
  failed: "We could not sign you in. Please try again.",
};
export default async function Login({ searchParams }: { searchParams: { error?: string } }) {
  const s = await getSession(); if (s) redirect(home(s.role));
  const err = searchParams.error ? ERR[searchParams.error] ?? ERR.failed : "";
  return (
    <main id="main" className="card mx-auto my-10 max-w-md">
      <h1 className="text-3xl">Welcome</h1>
      <p className="mt-2">A private recovery companion from Leronza &amp; Co. Track your progress, build healthy habits, message your counselor, book sessions, and ask for urgent help the moment you need it.</p>
      {err && <p role="alert" className="mt-4 rounded-2xl bg-coral-50 p-3 text-coral-700">{err}</p>}
      <div className="mt-6 grid gap-3">
        <a href="/api/auth/login" className="btn-primary">Sign in or create an account</a>
      </div>
      <p className="mt-3 text-center text-sm text-ink-soft">New here? Choose &ldquo;Sign up&rdquo; on the next screen. Administrators sign in the same way with their email and password.</p>
      <p className="mt-4 text-center text-sm text-ink-soft">Your information is encrypted and seen only by you and your Leronza &amp; Co care team. <Link href="/privacy" className="underline">Privacy notice</Link></p>
    </main>
  );
}
