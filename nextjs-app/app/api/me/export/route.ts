import { NextResponse } from "next/server";
import { api } from "@/lib/auth";
import { clientData } from "@/lib/clientData";
// Right of access: the client downloads everything held about them (including private journal entries).
export const GET = api(["PATIENT"], async (_r, s) => {
  const d = await clientData(s.id, "self");
  return new NextResponse(JSON.stringify(d, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="my-leronza-data.json"' } });
});
