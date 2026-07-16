import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createApiToken, type ExpiresIn } from "@/lib/api-tokens";

const VALID_EXPIRES: ExpiresIn[] = ["7d", "30d", "90d", "365d"];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const expiresIn = body.expiresIn ?? "30d";

    if (!VALID_EXPIRES.includes(expiresIn)) {
      return NextResponse.json(
        { error: "expiresIn debe ser 7d, 30d, 90d o 365d" },
        { status: 400 }
      );
    }

    const { token, expiresAt } = await createApiToken(
      session.user.id,
      expiresIn
    );

    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString(),
      expiresIn,
    });
  } catch (err) {
    console.error("[API] POST /api/auth/token:", err);
    return NextResponse.json(
      { error: "Error al crear token" },
      { status: 500 }
    );
  }
}
