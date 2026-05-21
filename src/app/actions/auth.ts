"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actionClient } from "@/lib/supabase";

export async function signInWithPassword(email: string, password: string) {
  const sb = await actionClient();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  redirect("/");
}

export type SignUpResult =
  | { error: string }
  | { needsVerification: true; email: string }
  | undefined;

export async function signUpWithPassword(
  email: string,
  password: string,
  companyName?: string,
): Promise<SignUpResult> {
  const sb = await actionClient();
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: companyName ? { company_name: companyName } : {} },
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return { error: "このメールアドレスは既に登録されています。ログインタブからサインインしてください。" };
    }
    return { error: error.message };
  }
  // Supabase obfuscates "user already exists" by returning a user with empty
  // identities array (anti-enumeration). Detect it explicitly.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { error: "このメールアドレスは既に登録されています。ログインタブからサインインしてください。" };
  }
  // No session = email confirmation required → ask for OTP code.
  if (data.user && !data.session) {
    return { needsVerification: true, email };
  }
  // Auto-signed-in (when Supabase email confirmation is disabled).
  revalidatePath("/", "layout");
  redirect("/");
}

export async function verifySignupOtp(email: string, token: string) {
  const sb = await actionClient();
  const { error } = await sb.auth.verifyOtp({ email, token, type: "signup" });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  redirect("/");
}

export async function resendSignupOtp(email: string) {
  const sb = await actionClient();
  const { error } = await sb.auth.resend({ type: "signup", email });
  if (error) return { error: error.message };
  return { ok: true as const };
}

export async function requestPasswordReset(email: string, origin: string) {
  const sb = await actionClient();
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
  });
  if (error) return { error: error.message };
  return { ok: true as const };
}

export async function updatePassword(newPassword: string) {
  const sb = await actionClient();
  const { error } = await sb.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const sb = await actionClient();
  await sb.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
