import { ReactNode, useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ClipboardCheck, Users, Building2, GraduationCap,
  Layers, BookOpen, UserCog, Link2, CalendarDays, BarChart3,
  ShieldCheck, FileClock, Settings, Menu, LogOut, Search, ChevronLeft,
} from "lucide-react";
import { useAuth } from "../lib/auth";

const GROUPS: { heading: string; items: { to: string; label: string; icon: any }[] }[] = [
  { heading: "Main", items: [
    { to: "/", label: "Overview", icon: LayoutDashboard },
    { to: "/attendance", label: "Attendance", icon: ClipboardCheck },
  ]},
  { heading: "Academic", items: [
    { to: "/students", label: "Students", icon: Users },
    { to: "/departments", label: "Departments", icon: Building2 },
    { to: "/programmes", label: "Programmes", icon: GraduationCap },
    { to: "/groups", label: "Intakes & Groups", icon: Layers },
    { to: "/units", label: "Units", icon: BookOpen },
    { to: "/lecturers", label: "Lecturers", icon: UserCog },
    { to: "/assignments", label: "Teaching Assignments", icon: Link2 },
  ]},
  { heading: "Operations", items: [
    { to: "/sessions", label: "Timetable & Sessions", icon: CalendarDays },
    { to: "/analytics", label: "Analytics & Reports", icon: BarChart3 },
  ]},
  { heading: "Administration", items: [
    { to: "/users", label: "User Management", icon: ShieldCheck },
    { to: "/audit", label: "Audit Logs", icon: FileClock },
    { to: "/settings", label: "Settings", icon: Settings },
  ]},
];

const TITLES: Record<string, string> = {
  "/": "Overview", "/attendance": "Attendance Records", "/students": "Students",
  "/departments": "Departments", "/programmes": "Programmes", "/groups": "Intakes & Class Groups",
  "/units": "Units", "/lecturers": "Lecturers & Staff", "/assignments": "Teaching Assignments",
  "/sessions": "Timetable & Sessions", "/analytics": "Analytics & Reports",
  "/users": "User Management", "/audit": "Audit Logs", "/settings": "Settings",
};

export function Layout({ children }: { children: ReactNode }) {
  const { profile, email, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function handleSignOut() { await signOut(); nav("/login"); }
  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) nav(`/students?q=${encodeURIComponent(q.trim())}`);
  }

  const pageTitle = TITLES[loc.pathname] || "KNP Attendance";
  const displayName = profile?.full_name || email?.split("@")[0] || "User";
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="min-h-full flex bg-canvas">
      <aside
        className={`fixed z-30 inset-y-0 left-0 w-[248px] bg-maroon-dark text-white flex flex-col transition-transform
        md:static md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-[72px] flex items-center gap-3 px-5 border-b border-white/10">
          <div className="h-9 w-9 rounded-lg bg-gold text-maroon-dark grid place-items-center font-bold text-lg shadow">K</div>
          <div className="leading-tight">
            <div className="font-semibold text-[13px] tracking-wide">KNP ATTENDANCE</div>
            <div className="text-[10px] text-white/55 tracking-wider">ACADEMIC MANAGEMENT SYSTEM</div>
          </div>
          <button className="ml-auto md:hidden text-white/70" onClick={() => setOpen(false)} aria-label="Close menu">
            <ChevronLeft size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {GROUPS.map((g) => (
            <div key={g.heading}>
              <div className="text-[10px] uppercase tracking-wider text-white/40 px-2 mb-1.5">{g.heading}</div>
              <div className="space-y-0.5">
                {g.items.map((n) => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.to === "/"}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 pl-3 pr-2 py-2 rounded-lg text-[13px] border-l-2 transition ${
                        isActive
                          ? "bg-white/12 text-white font-medium border-gold"
                          : "text-white/70 border-transparent hover:bg-white/8 hover:text-white"
                      }`
                    }
                  >
                    <n.icon size={17} className="shrink-0" />
                    <span className="truncate">{n.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-white/10">
          <div className="text-[11px] text-white/70">Kitale National Polytechnic</div>
          <div className="text-[10px] text-white/40">Attendance System · v0.1</div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-[72px] bg-card border-b border-line flex items-center gap-3 px-4 md:px-6 sticky top-0 z-10">
          <button className="md:hidden text-ink" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <div className="text-[11px] text-subt">Dashboard</div>
            <div className="text-sm font-semibold text-ink truncate">{pageTitle}</div>
          </div>

          <form onSubmit={runSearch} className="relative ml-auto hidden sm:block w-56 lg:w-72">
            <Search size={16} className="absolute left-3 top-2.5 text-subt" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search students…"
              className="w-full rounded-lg border border-line bg-canvas pl-9 pr-3 py-2 text-sm"
              aria-label="Search students"
            />
          </form>

          <div className="relative ml-auto sm:ml-0" ref={menuRef}>
            <button
              onClick={() => setMenu((m) => !m)}
              className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-canvas"
              aria-haspopup="menu" aria-expanded={menu}
            >
              <div className="text-right leading-tight hidden sm:block">
                <div className="text-[13px] font-medium text-ink">{displayName}</div>
                <div className="text-[11px] text-subt capitalize">{profile?.role || "—"}</div>
              </div>
              <div className="h-9 w-9 rounded-full bg-maroon text-white grid place-items-center text-sm font-semibold">
                {initial}
              </div>
            </button>
            {menu && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-line rounded-xl2 shadow-card py-1.5 z-20" role="menu">
                <div className="px-3 py-2 border-b border-line">
                  <div className="text-sm font-medium text-ink truncate">{displayName}</div>
                  <div className="text-[11px] text-subt truncate">{email}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-err hover:bg-canvas"
                  role="menuitem"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 min-w-0 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}