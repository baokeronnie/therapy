import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { api } from "@/lib/auth";
import { clientData, toCsv } from "@/lib/clientData";
// ADMIN only. ?format=csv (default) or json. Every export is written to the audit log.
export const GET = api(["ADMIN"], async (req, s, { params }) => {
  const d = await clientData(params.id, "admin");
  if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const fmt = req.nextUrl.searchParams.get("format") === "json" ? "json" : "csv";
  await prisma.auditLog.create({ data: { actorId: s.id, action: "CLIENT_EXPORT", entity: "User", entityId: params.id, meta: { format: fmt } } });
  const safe = d.profile.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return new NextResponse(fmt === "json" ? JSON.stringify(d, null, 2) : toCsv(d), {
    headers: { "Content-Type": fmt === "json" ? "application/json" : "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="client-${safe}.${fmt}"` },
  });
});
