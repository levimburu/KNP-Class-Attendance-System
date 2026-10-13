import { useEffect, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar,
} from "recharts";
import { Link } from "react-router-dom";
import {
  Users, Percent, UserCheck, UserX, CalendarDays, ClipboardList, Building2, Layers, LineChart as LineIcon,
} from "lucide-react";
import { supabase, isConfigured } from "../lib/supabase";
import { PageHeader, Spinner, EmptyState, KpiCard, ChartCard, Card, Badge } from "../components/ui";

const OK = "#16804A", ERR = "#D92D20", MAROON = "#74152F";
const today = new Date().toISOString().slice(0, 10);

async function count(table: string, filters?: Record<string, string>) {
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filters) for (const k in filters) q = q.eq(k, filters[k]);
  const { count } = await q;
  return count ?? 0;
}

interface Recent {
  status: string; time_in: string | null; created_at: string;
  students: { full_name: string; admission_no: string } | null;
  sessions: { session_date: string; units: { name: string } | null; lecturers: { full_name: string } | null } | null;
}

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [k, setK] = useState({
    students: 0, rate: 0, presentToday: 0, absentToday: 0,
    sessions: 0, pending: 0, departments: 0, groups: 0,
  });
  const [trend, setTrend] = useState<{ date: string; present: number; absent: number }[]>([]);
  const [byDept, setByDept] = useState<{ name: string; present: number; absent: number }[]>([]);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [hasAtt, setHasAtt] = useState(false);

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }
    (async () => {
      try {
        const [students, departments, groups, sessions, pending] = await Promise.all([
          count("students"),
          count("departments", { status: "active" }),
          count("class_groups", { status: "active" }),
          count("sessions"),
          count("sessions", { attendance_submitted: "false" }),
        ]);

        const { data: att } = await supabase
          .from("attendance")
          .select("status, sessions(session_date, class_groups(programmes(departments(name))))")
          .limit(8000);
        const rows = (att as any[]) ?? [];
        setHasAtt(rows.length > 0);

        const tmap: Record<string, { present: number; absent: number }> = {};
        const dmap: Record<string, { present: number; absent: number }> = {};
        let present = 0, pToday = 0, aToday = 0;
        rows.forEach((r) => {
          const st = String(r.status);
          const d = r.sessions?.session_date || "—";
          const dept = r.sessions?.class_groups?.programmes?.departments?.name || "Unassigned";
          tmap[d] ??= { present: 0, absent: 0 };
          dmap[dept] ??= { present: 0, absent: 0 };
          if (st === "present") { present++; tmap[d].present++; dmap[dept].present++; if (d === today) pToday++; }
          if (st === "absent") { tmap[d].absent++; dmap[dept].absent++; if (d === today) aToday++; }
        });

        setTrend(Object.keys(tmap).sort().map((d) => ({ date: d, ...tmap[d] })));
        setByDept(Object.keys(dmap).map((n) => ({ name: n, ...dmap[n] })).sort((a, b) => (b.present + b.absent) - (a.present + a.absent)).slice(0, 8));
        setK({
          students, departments, groups, sessions, pending,
          rate: rows.length ? Math.round((present / rows.length) * 100) : 0,
          presentToday: pToday, absentToday: aToday,
        });

        const { data: rec } = await supabase
          .from("attendance")
          .select("status, time_in, created_at, students(full_name, admission_no), sessions(session_date, units(name), lecturers(full_name))")
          .order("created_at", { ascending: false })
          .limit(8);
        setRecent((rec as any[]) ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!isConfigured)
    return (
      <>
        <PageHeader title="Attendance Overview" subtitle="Real-time classroom attendance and academic performance across departments." />
        <Card className="p-6"><EmptyState title="Connect Supabase to see live data" hint="Add your project URL and anon key to .env, then run the migrations." /></Card>
      </>
    );
  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Attendance Overview"
        subtitle="Real-time classroom attendance and academic performance across departments."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Students registered" value={k.students} icon={Users} tone="maroon" sub="total enrolled" />
        <KpiCard label="Attendance rate" value={`${k.rate}%`} icon={Percent} tone="ok" sub="present of recorded" />
        <KpiCard label="Present today" value={k.presentToday} icon={UserCheck} tone="ok" sub={today} />
        <KpiCard label="Absent today" value={k.absentToday} icon={UserX} tone="err" sub="recorded absences" />
        <KpiCard label="Sessions" value={k.sessions} icon={CalendarDays} tone="info" sub="scheduled / held" />
        <KpiCard label="Pending submissions" value={k.pending} icon={ClipboardList} tone="warn" sub="attendance not submitted" />
        <KpiCard label="Departments" value={k.departments} icon={Building2} tone="maroon" sub="active" />
        <KpiCard label="Class groups" value={k.groups} icon={Layers} tone="gold" sub="active" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Attendance Trends" subtitle="Recorded attendance over time.">
          {!hasAtt ? (
            <ChartEmpty title="No attendance trends available yet" hint="Trends appear after sessions record attendance." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ left: -18, right: 8, top: 6 }}>
                  <defs>
                    <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={OK} stopOpacity={0.3} /><stop offset="100%" stopColor={OK} stopOpacity={0} /></linearGradient>
                    <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ERR} stopOpacity={0.25} /><stop offset="100%" stopColor={ERR} stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#667085" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#667085" }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="present" name="Present" stroke={OK} strokeWidth={2} fill="url(#gP)" />
                  <Area type="monotone" dataKey="absent" name="Absent" stroke={ERR} strokeWidth={2} fill="url(#gA)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Attendance by Department" subtitle="Present vs recorded absences by department.">
          {!hasAtt ? (
            <ChartEmpty title="No department data yet" hint="This compares attendance once records exist." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDept} margin={{ left: -18, right: 8, top: 6 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#667085" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#667085" }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="present" name="Present" fill={OK} radius={[3, 3, 0, 0]} maxBarSize={34} />
                  <Bar dataKey="absent" name="Absent" fill={ERR} radius={[3, 3, 0, 0]} maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <h2 className="text-sm font-semibold text-ink">Recent Attendance Records</h2>
          <Link to="/attendance" className="text-xs font-semibold text-maroon hover:underline">View all records</Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState title="No attendance records yet" hint="Records will appear here once attendance has been submitted." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-canvas text-subt text-[11px] uppercase tracking-wide">
                  <th className="text-left font-semibold px-4 py-2.5">Student</th>
                  <th className="text-left font-semibold px-4 py-2.5">Admission</th>
                  <th className="text-left font-semibold px-4 py-2.5">Unit</th>
                  <th className="text-left font-semibold px-4 py-2.5">Lecturer</th>
                  <th className="text-left font-semibold px-4 py-2.5">Date</th>
                  <th className="text-left font-semibold px-4 py-2.5">Time</th>
                  <th className="text-left font-semibold px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r, i) => {
                  const st = String(r.status).toLowerCase();
                  const tone = st === "present" ? "ok" : st === "late" ? "warn" : st === "absent" ? "err" : "info";
                  return (
                    <tr key={i} className="border-t border-line hover:bg-canvas/60">
                      <td className="px-4 py-2.5 font-medium text-ink">{r.students?.full_name || "—"}</td>
                      <td className="px-4 py-2.5 tnum text-subt">{r.students?.admission_no || "—"}</td>
                      <td className="px-4 py-2.5 text-subt">{r.sessions?.units?.name || "—"}</td>
                      <td className="px-4 py-2.5 text-subt">{r.sessions?.lecturers?.full_name || "—"}</td>
                      <td className="px-4 py-2.5 text-subt">{r.sessions?.session_date || "—"}</td>
                      <td className="px-4 py-2.5 tnum text-subt">{r.time_in || "—"}</td>
                      <td className="px-4 py-2.5"><Badge tone={tone as any}>{r.status}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function ChartEmpty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="h-64 grid place-items-center text-center">
      <div>
        <LineIcon size={30} className="text-line mx-auto" />
        <div className="text-sm font-medium text-ink mt-2">{title}</div>
        <div className="text-xs text-subt mt-0.5 max-w-xs mx-auto">{hint}</div>
      </div>
    </div>
  );
}