import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api/");
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/registro") ||
    pathname.startsWith("/auth");

  if (isApiRoute) {
    return NextResponse.next();
  }

  if (!session?.user && !isAuthRoute) {
    const urlRedirect = request.nextUrl.clone();
    urlRedirect.pathname = "/login";
    return NextResponse.redirect(urlRedirect);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
