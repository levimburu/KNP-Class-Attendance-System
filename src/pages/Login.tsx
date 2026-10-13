import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Button } from "../components/ui";

export default function Login() {
  const { signIn, configured } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) setErr(error);
    else nav("/");
  }

  return (
    <div className="min-h-full grid place-items-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="h-9 w-9 rounded-md bg-maroon text-white grid place-items-center font-bold">K</div>
          <div className="leading-tight">
            <div className="font-semibold text-ink">KNP Attendance</div>
            <div className="text-[11px] text-subt">Academic Management & Analytics</div>
          </div>
        </div>

        <div className="bg-card border border-line rounded-xl2 shadow-card p-6">
          <h1 className="text-lg font-semibold text-ink">Sign in</h1>
          <p className="text-sm text-subt mt-0.5 mb-5">Use your institutional account.</p>

          {!configured && (
            <div className="mb-4 text-sm bg-warn/10 text-ink border border-warn/40 rounded-lg px-3 py-2">
              Supabase is not configured yet. Add your keys to <code>.env</code> (see README).
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wide text-subt mb-1" htmlFor="email">Email</label>
              <input
                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm" required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-subt mb-1" htmlFor="pw">Password</label>
              <input
                id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm" required
              />
            </div>
            {err && <div className="text-sm text-err">{err}</div>}
            <Button type="submit" disabled={busy || !configured} className="w-full">
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
        <p className="text-center text-[11px] text-subt mt-4">Kitale National Polytechnic</p>
      </div>
    </div>
  );
}
