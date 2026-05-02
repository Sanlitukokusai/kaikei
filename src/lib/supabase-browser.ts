import { createBrowserClient } from "@supabase/ssr";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function browserClient() {
  return createBrowserClient(URL, ANON, { db: { schema: "accounting" } });
}

export const DEMO_COMPANY_ID =
  process.env.NEXT_PUBLIC_DEMO_COMPANY_ID ?? "00000000-0000-0000-0000-000000000001";
