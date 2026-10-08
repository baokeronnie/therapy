"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
const links: Record<string, [string, string][]> = {
  PATIENT: [["/patient", "Today"], ["/patient/schedule", "Sessions"], ["/patient/chat", "Messages"]],
  COUNSELOR: [["/counselor", "Caseload"]],
  GUARDIAN: [["/guardian", "Alerts"]],
};
export function Nav({ role, name }: { role: string; name: string }) {
  const path = usePathname(), router = useRouter();
  return (
    <nav aria-label="Main" className="ml-auto flex flex-wrap items-center gap-1 rounded-pill bg-sage-100 p-1">
      {links[role].map(([h, l]) => (
        <Link key={h} href={h} aria-current={path === h ? "page" : undefined}
          className={`btn !min-h-[40px] px-4 ${path === h ? "bg-white text-sage-700 shadow-soft" : "hover:bg-white/60"}`}>{l}</Link>
      ))}
      <button className="btn !min-h-[40px] px-4 hover:bg-white/60" title={name}
        onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); router.refresh(); }}>Sign out</button>
    </nav>
  );
}
