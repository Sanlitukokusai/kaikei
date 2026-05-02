import { NextRequest, NextResponse } from "next/server";
import { actionClient } from "@/lib/supabase";

// Handles email-magic-link / OAuth redirect.
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  if (code) {
    const sb = await actionClient();
    await sb.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(next, req.url));
}
