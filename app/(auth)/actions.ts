"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../lib/supabase/server";

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

async function markTrustedDevice() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const userAgent = headers().get("user-agent") ?? "Unknown device";
  const now = new Date().toISOString();
  const { data: existingSession } = await supabase
    .from("device_sessions")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingSession?.id) {
    await supabase
      .from("device_sessions")
      .update({
        trusted: true,
        user_agent: userAgent,
        last_seen_at: now
      })
      .eq("id", existingSession.id)
      .eq("user_id", user.id);
    return;
  }

  await supabase.from("device_sessions").insert({
    user_id: user.id,
    device_fingerprint: `${user.id}-${Date.now()}`,
    user_agent: userAgent,
    trusted: true,
    last_seen_at: now,
    created_at: now
  });
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const mfaCode = String(formData.get("mfaCode") ?? "").trim();
  const trustDevice = formData.get("trustDevice") === "on";
  const nextPath = String(formData.get("next") ?? "").trim();

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login?message=Supabase%20is%20not%20configured.");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/login?message=${encodeMessage(error.message)}`);
  }

  if (mfaCode) {
    const { data: factorData, error: factorError } = await supabase.auth.mfa.listFactors();

    if (factorError) {
      await supabase.auth.signOut();
      redirect(`/login?message=${encodeMessage(factorError.message)}`);
    }

    const factor = factorData.totp[0];

    if (!factor) {
      await supabase.auth.signOut();
      redirect("/login?message=No%20TOTP%20factor%20is%20enrolled%20for%20this%20account.");
    }

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code: mfaCode
    });

    if (verifyError) {
      await supabase.auth.signOut();
      redirect(`/login?message=${encodeMessage(verifyError.message)}`);
    }

    if (trustDevice) {
      await markTrustedDevice();
    }
  }

  redirect(nextPath.startsWith("/") ? nextPath : "/dashboard");
}

export async function signupAction(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const setupMfa = formData.get("setupMfa") === "on";

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/signup?message=Supabase%20is%20not%20configured.");
  }

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name
      }
    }
  });

  if (error) {
    redirect(`/signup?message=${encodeMessage(error.message)}`);
  }

  if (data.session) {
    redirect(
      setupMfa
        ? "/settings?message=Account%20created.%20Set%20up%20optional%20MFA%20below.&mfa=setup"
        : "/dashboard"
    );
  }

  redirect(
    setupMfa
      ? "/login?message=Check%20your%20email%20to%20confirm%20your%20account,%20then%20set%20up%20MFA%20from%20Settings."
      : "/login?message=Check%20your%20email%20to%20confirm%20your%20account."
  );
}

export async function signoutAction() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/login");
}
