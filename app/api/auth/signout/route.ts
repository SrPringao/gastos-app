import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API] POST /api/auth/signout:", err);
    return NextResponse.json(
      { error: "Error al cerrar sesion" },
      { status: 500 }
    );
  }
}
