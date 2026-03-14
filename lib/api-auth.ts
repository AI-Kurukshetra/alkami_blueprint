import { createSupabaseServerClient } from "./supabase/server";

export async function getApiAuthState() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      supabase: null,
      user: null,
      profile: null
    };
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      supabase,
      user: null,
      profile: null
    };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, name, role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    profile
  };
}
