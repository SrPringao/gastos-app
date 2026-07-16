import { NextResponse } from "next/server";
import { signOut } from "@/auth";

export async function GET(request: Request) {
  try {
    await signOut({ redirect: false });
    const next = new URL(request.url).searchParams.get("next") ?? "/login";
    return NextResponse.redirect(new URL(next, request.url));
  } catch (err) {
    console.error("[API] GET /api/auth/signout:", err);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export async function POST() {
  try {
    await signOut({ redirect: false });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API] POST /api/auth/signout:", err);
    return NextResponse.json(
      { error: "Error al cerrar sesion" },
      { status: 500 }
    );
  }
}
