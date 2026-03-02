import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email?.trim();
    const password = body.password;
    const displayName = body.displayName?.trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: authData, error: authError } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: displayName ? { display_name: displayName } : undefined,
        },
      });

    if (authError) {
      const msg =
        authError.message?.includes("already registered") ||
        authError.code === "user_already_exists"
          ? "Ese correo ya esta registrado"
          : authError.message ?? "Error al registrar";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "No se pudo crear el usuario" },
        { status: 500 }
      );
    }

    await db.insert(users).values({
      id: authData.user.id,
      email: authData.user.email ?? email,
      displayName: displayName ?? null,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    });
  } catch (err) {
    console.error("[API] POST /api/auth/signup:", err);
    return NextResponse.json(
      { error: "Error al registrar" },
      { status: 500 }
    );
  }
}
