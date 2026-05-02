// Server-only Supabase clients (cookie-aware, App Router).
// For client components, import from "@/lib/supabase-browser".

import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!URL || !ANON) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL/ANON_KEY");

const SCHEMA = { db: { schema: "accounting" as const } };

// For Server Components (read-only cookie context).
export async function serverClient() {
  const store = await cookies();
  return createServerClient(URL, ANON, {
    ...SCHEMA,
    cookies: {
      getAll: () => store.getAll(),
      setAll: () => {},
    },
  });
}

// For Server Actions / Route Handlers.
export async function actionClient() {
  const store = await cookies();
  return createServerClient(URL, ANON, {
    ...SCHEMA,
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) {
          try { store.set(name, value, options); } catch { /* read-only contexts */ }
        }
      },
    },
  });
}

// For middleware — must mutate the response cookies.
export function middlewareClient(req: NextRequest, res: NextResponse) {
  return createServerClient(URL, ANON, {
    ...SCHEMA,
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) {
          req.cookies.set({ name, value, ...options });
          res.cookies.set({ name, value, ...options });
        }
      },
    },
  });
}

export const DEMO_COMPANY_ID =
  process.env.NEXT_PUBLIC_DEMO_COMPANY_ID ?? "00000000-0000-0000-0000-000000000001";
