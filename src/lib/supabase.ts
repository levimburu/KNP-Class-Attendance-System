import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && anon && !url.includes("YOUR-PROJECT"));

// A single shared client. When env vars are missing we still create a client
// with placeholders so the app renders a clear "not configured" state.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anon || "placeholder-anon-key"
);
