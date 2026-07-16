import { NextResponse } from "next/server";
import { signOut } from "@/auth";

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
