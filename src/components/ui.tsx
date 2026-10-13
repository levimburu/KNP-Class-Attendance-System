import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-line rounded-xl2 shadow-card ${className}`}>{children}</div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl font-semibold text-ink tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-subt mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-subt">{label}</div>
      <div className="text-2xl font-semibold text-ink mt-1 tnum">{value}</div>
      {sub && <div className="text-xs text-subt mt-0.5">{sub}</div>}
    </Card>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const styles =
    variant === "primary"
      ? "bg-maroon text-white hover:bg-maroon-soft"
      : variant === "danger"
      ? "bg-err text-white hover:opacity-90"
      : "bg-canvas text-ink border border-line hover:bg-line/40";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16 text-subt">
      <div className="h-6 w-6 rounded-full border-2 border-line border-t-maroon animate-spin" />
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center py-14 px-6 text-subt">
      <div className="text-sm font-medium text-ink">{title}</div>
      {hint && <div className="text-sm mt-1">{hint}</div>}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "ok" | "warn" | "err" | "info" | "neutral" }) {
  const map: Record<string, string> = {
    ok: "bg-ok/10 text-ok",
    warn: "bg-warn/10 text-warn",
    err: "bg-err/10 text-err",
    info: "bg-info/10 text-info",
    neutral: "bg-line/60 text-subt",
  };
  return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${map[tone]}`}>{children}</span>;
}

type Tone = "maroon" | "ok" | "warn" | "err" | "info" | "gold";
const toneChip: Record<Tone, string> = {
  maroon: "bg-maroon/10 text-maroon",
  ok: "bg-ok/10 text-ok",
  warn: "bg-warn/10 text-warn",
  err: "bg-err/10 text-err",
  info: "bg-info/10 text-info",
  gold: "bg-gold/15 text-[#9a7320]",
};

export function KpiCard({
  label, value, sub, icon: Icon, tone = "maroon",
}: {
  label: string; value: ReactNode; sub?: string;
  icon: LucideIcon; tone?: Tone;
}) {
  return (
    <Card className="p-4 flex items-start gap-3">
      <div className={`h-10 w-10 rounded-lg grid place-items-center shrink-0 ${toneChip[tone]}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-subt">{label}</div>
        <div className="text-2xl font-semibold text-ink leading-tight tnum">{value}</div>
        {sub && <div className="text-xs text-subt mt-0.5 truncate">{sub}</div>}
      </div>
    </Card>
  );
}

export function ChartCard({
  title, subtitle, right, children,
}: { title: string; subtitle?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <Card className="p-4 min-w-0">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {subtitle && <p className="text-xs text-subt mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </Card>
  );
}