import "./globals.css";
import Link from "next/link";
import { Fraunces, Figtree } from "next/font/google";
import { getSession } from "@/lib/auth";
import { Nav } from "@/components/shared/Nav";
const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });
const body = Figtree({ subsets: ["latin"], variable: "--font-body" });
export const metadata = { title: "Leronza & Co recovery platform", robots: { index: false, follow: false } };
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>
        <header className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 pt-4">
          <img src="/logo.jpg" alt="" className="h-14 w-14 rounded-full border border-linen-edge bg-white" />
          <span className="text-xl font-bold text-sage-700">Leronza <span className="text-sage-600">&amp; Co</span></span>
          {s && <Nav role={s.role} name={s.name} />}
        </header>
        {children}
        <footer className="mx-auto max-w-6xl px-4 pb-28 pt-6 text-center text-sm text-ink-soft lg:pb-8">
          <Link href="/privacy" className="underline">Privacy notice</Link> · Your information is encrypted and only visible to you and your care team.
        </footer>
      </body>
    </html>
  );
}
