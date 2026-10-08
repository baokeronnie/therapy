import { redirect } from "next/navigation";
import { getSession, home } from "@/lib/auth";
export default async function Index() { const s = await getSession(); redirect(s ? home(s.role) : "/login"); }
