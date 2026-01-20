import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const start = Date.now(); // start timing

  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Use response for public routes / redirects
  if (pathname.startsWith("/login") && user) {
    const redirectUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  const publicRoutes = ["/login", "/auth/callback"];

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    console.log(
      `[Request] GET ${pathname} → 200 (public) - ${Date.now() - start}ms`,
    );
    return response;
  }

  // Redirect if not authenticated
  if (!user) {
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  console.log(`[Request] GET ${pathname} → 200 - ${Date.now() - start}ms`);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
