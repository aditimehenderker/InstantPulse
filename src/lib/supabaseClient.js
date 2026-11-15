import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
export async function ensureAnonymousSession() {
  const { data, error } = await supabase.auth.getUser();

  if (data?.user) {
    return data.user;
  }

  if (error && error.name !== "AuthSessionMissingError") {
    throw error;
  }

  const { data: signInData, error: signInError } =
    await supabase.auth.signInAnonymously();

  if (signInError) {
    throw signInError;
  }

  return signInData.user;
}

