import { useEffect, useState } from "react";
import { supabase, isConfigured } from "../lib/supabase";
import { Card, PageHeader, Spinner, EmptyState, Button, Badge } from "../components/ui";
import { useAuth } from "../lib/auth";
import { Plus } from "lucide-react";

interface Dept {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  lecturers?: { full_name: string } | null;
}

export default function Departments() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Dept[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const { data } = await supabase
      .from("departments")
      .select("id, name, code, description, status, lecturers:hod_id(full_name)")
      .order("name");
    setRows((data as any[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }
    load();
  }, []);

  async function addDept(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const { data: inst } = await supabase.from("institutions").select("id").limit(1).maybeSingle();
    if (!inst) { setMsg("No institution found. Run the seed migration first."); return; }
    const { error } = await supabase.from("departments").insert({
      institution_id: (inst as any).id, name: name.trim(), code: code.trim(), description: desc.trim() || null,
    });
    if (error) { setMsg(error.message); return; }
    setName(""); setCode(""); setDesc(""); setShowForm(false);
    load();
  }

  if (!isConfigured)
    return (<><PageHeader title="Departments" /><Card className="p-6"><EmptyState title="Connect Supabase to manage departments" /></Card></>);
  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Departments"
        subtitle={`${rows.length} total`}
        actions={isAdmin && <Button onClick={() => setShowForm((s) => !s)}><Plus size={16} />New department</Button>}
      />

      {showForm && isAdmin && (
        <Card className="p-4 mb-4">
          <form onSubmit={addDept} className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wide text-subt mb-1">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-subt mb-1">Code</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} required className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wide text-subt mb-1">Description</label>
              <input value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm" />
            </div>
            {msg && <div className="text-sm text-err sm:col-span-2">{msg}</div>}
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit">Save</Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {rows.length === 0 ? (
        <Card className="p-6"><EmptyState title="No departments yet" hint={isAdmin ? "Create one with the button above." : "Ask an administrator to add departments."} /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map((d) => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-ink">{d.name}</div>
                  <div className="text-xs text-subt mt-0.5">Code: {d.code}</div>
                </div>
                <Badge tone={d.status === "active" ? "ok" : "neutral"}>{d.status}</Badge>
              </div>
              {d.description && <p className="text-sm text-subt mt-2">{d.description}</p>}
              <div className="text-xs text-subt mt-3 pt-3 border-t border-line">
                HOD: <span className="text-ink">{d.lecturers?.full_name || "Unassigned"}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
