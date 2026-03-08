import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createApiToken, type ExpiresIn } from "@/lib/api-tokens";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    return NextResponse.json({
      access_token: session.access_token,
      expires_at: session.expires_at,
    });
  } catch (err) {
    console.error("[API] GET /api/auth/token:", err);
    return NextResponse.json(
      { error: "Error al obtener token" },
      { status: 500 }
    );
  }
}

const VALID_EXPIRES: ExpiresIn[] = ["7d", "30d", "90d"];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const expiresIn = body.expiresIn ?? "30d";

    if (!VALID_EXPIRES.includes(expiresIn)) {
      return NextResponse.json(
        { error: "expiresIn debe ser 7d, 30d o 90d" },
        { status: 400 }
      );
    }

    const { token, expiresAt } = await createApiToken(user.id, expiresIn);

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
