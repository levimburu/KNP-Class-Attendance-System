import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase, isConfigured } from "../lib/supabase";
import { Card, PageHeader, Spinner, EmptyState, Badge } from "../components/ui";
import { Search } from "lucide-react";

interface Row {
  id: string;
  admission_no: string;
  full_name: string;
  finger_slot: number | null;
  status: string;
  programmes?: { name: string } | null;
  intakes?: { label: string } | null;
  class_groups?: { name: string } | null;
}

export default function Students() {
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState(params.get("q") || "");

  useEffect(() => { setQ(params.get("q") || ""); }, [params]);

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("students")
        .select("id, admission_no, full_name, finger_slot, status, programmes(name), intakes(label), class_groups(name)")
        .order("full_name");
      setRows((data as any[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => (r.full_name + " " + r.admission_no).toLowerCase().includes(t));
  }, [rows, q]);

  if (!isConfigured)
    return (
      <>
        <PageHeader title="Students" />
        <Card className="p-6"><EmptyState title="Connect Supabase to manage students" /></Card>
      </>
    );
  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader title="Students" subtitle={`${rows.length} registered`} />
      <Card className="p-3 mb-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-2.5 text-subt" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or admission no"
            className="w-full rounded-lg border border-line bg-canvas pl-9 pr-3 py-2 text-sm"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState title="No students found" hint="Import a roster or add students to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-canvas text-subt text-xs uppercase tracking-wide">
                  <th className="text-left font-semibold px-4 py-3">Admission</th>
                  <th className="text-left font-semibold px-4 py-3">Name</th>
                  <th className="text-left font-semibold px-4 py-3">Programme</th>
                  <th className="text-left font-semibold px-4 py-3">Intake</th>
                  <th className="text-left font-semibold px-4 py-3">Class group</th>
                  <th className="text-left font-semibold px-4 py-3">Slot</th>
                  <th className="text-left font-semibold px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-line hover:bg-canvas/60">
                    <td className="px-4 py-2.5 tnum">{r.admission_no}</td>
                    <td className="px-4 py-2.5 font-medium text-ink">{r.full_name}</td>
                    <td className="px-4 py-2.5 text-subt">{r.programmes?.name || "—"}</td>
                    <td className="px-4 py-2.5 text-subt">{r.intakes?.label || "—"}</td>
                    <td className="px-4 py-2.5 text-subt">{r.class_groups?.name || "—"}</td>
                    <td className="px-4 py-2.5 tnum">{r.finger_slot ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={r.status === "enrolled" ? "ok" : "neutral"}>{r.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}