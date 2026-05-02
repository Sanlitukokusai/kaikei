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

export async function signUpWithPassword(email: string, password: string, companyName?: string) {
  const sb = await actionClient();
  const { error } = await sb.auth.signUp({
    email,
    password,
    options: { data: companyName ? { company_name: companyName } : {} },
  });
  if (error) return { error: error.message };
  // If email confirmations are disabled, the user is auto-signed-in.
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const sb = await actionClient();
  await sb.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
