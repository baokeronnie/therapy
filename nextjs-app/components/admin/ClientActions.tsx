"use client";
import { useRouter } from "next/navigation";
export function ClientActions({ id, assigned, canDelete }: { id: string; assigned: boolean; canDelete: boolean }) {
  const r = useRouter();
  async function call(url: string, method: string) { const res = await fetch(url, { method }); if (!res.ok) alert("That did not work."); return res.ok; }
  return (
    <div className="flex flex-wrap gap-2">
      <a className="btn-primary" href={`/api/admin/clients/${id}/export?format=csv`}>Export CSV</a>
      <a className="btn-quiet" href={`/api/admin/clients/${id}/export?format=json`}>Export JSON</a>
      {!assigned && <button className="btn-quiet" onClick={async () => { if (await call(`/api/admin/clients/${id}/assign`, "POST")) r.refresh(); }}>Assign to me</button>}
      {canDelete && <button className="btn-quiet !border-coral-600 !text-coral-700" onClick={async () => {
        if (!confirm("Permanently delete ALL of this client's data? This cannot be undone.")) return;
        if (await call(`/api/admin/clients/${id}`, "DELETE")) { r.push("/admin"); r.refresh(); } }}>Delete client data</button>}
    </div>
  );
}
