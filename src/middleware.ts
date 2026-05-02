import { NextRequest, NextResponse } from "next/server";
import { middlewareClient } from "@/lib/supabase";

const PUBLIC_PATHS = ["/login", "/auth/callback"];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });
  const sb = middlewareClient(req, res);
  const { data } = await sb.auth.getUser();

  const path = req.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));

  if (!data.user && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  if (data.user && path === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
