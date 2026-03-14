import { hasSupabaseEnv } from "@banking/database";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";

export async function getAuthState() {
  if (!hasSupabaseEnv()) {
    return {
      user: null,
      profile: null
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      user: null,
      profile: null
    };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
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
    user,
    profile
  };
}

export async function requireUser() {
  const authState = await getAuthState();

  if (hasSupabaseEnv() && !authState.user) {
    redirect("/login");
  }

  return authState;
}

export async function requireAdmin() {
  const authState = await requireUser();

  if (
    hasSupabaseEnv() &&
    authState.profile &&
    authState.profile.role !== "admin"
  ) {
    redirect("/dashboard");
  }

  return authState;
}

