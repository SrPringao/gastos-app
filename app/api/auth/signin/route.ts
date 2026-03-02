import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email?.trim();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const msg =
        error.message?.includes("Invalid login") ||
        error.message?.includes("invalid_credentials")
          ? "Correo o contraseña incorrectos"
          : error.message ?? "Error al iniciar sesion";
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API] POST /api/auth/signin:", err);
    return NextResponse.json(
      { error: "Error al iniciar sesion" },
      { status: 500 }
    );
  }
}
