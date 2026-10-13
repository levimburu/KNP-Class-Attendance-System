import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase, isConfigured } from "./supabase";
import type { Profile } from "./types";

interface AuthState {
  loading: boolean;
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  async function loadProfile(id: string) {
    const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    setProfile((data as Profile) ?? null);
  }

  async function refreshProfile() {
    if (userId) await loadProfile(userId);
  }

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session;
      if (s?.user) {
        setUserId(s.user.id);
        setEmail(s.user.email ?? null);
        await loadProfile(s.user.id);
      }
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      if (s?.user) {
        setUserId(s.user.id);
        setEmail(s.user.email ?? null);
        await loadProfile(s.user.id);
      } else {
        setUserId(null);
        setEmail(null);
        setProfile(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(e: string, p: string) {
    const { error } = await supabase.auth.signInWithPassword({ email: e, password: p });
    return { error: error ? error.message : null };
  }
  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <Ctx.Provider
      value={{ loading, userId, email, profile, configured: isConfigured, signIn, signOut, refreshProfile }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
