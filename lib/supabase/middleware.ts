import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.getClaims();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api/");
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/registro") ||
    pathname.startsWith("/auth");

  // Las APIs no se redirigen; cada ruta maneja su propia autenticacion
  if (isApiRoute) {
    return supabaseResponse;
  }

  if (!user && !isAuthRoute) {
    const urlRedirect = request.nextUrl.clone();
    urlRedirect.pathname = "/login";
    return NextResponse.redirect(urlRedirect);
  }

  if (user && isAuthRoute) {
    const urlRedirect = request.nextUrl.clone();
    urlRedirect.pathname = "/";
    return NextResponse.redirect(urlRedirect);
  }

  return supabaseResponse;
}
