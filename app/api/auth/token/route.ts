import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createApiToken,
  deleteRevokedApiTokens,
  listApiTokens,
  revokeApiToken,
  type ExpiresIn,
} from "@/lib/api-tokens";

const VALID_EXPIRES: ExpiresIn[] = ["7d", "30d", "90d", "365d"];

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const tokens = await listApiTokens(session.user.id);
    return NextResponse.json({ tokens });
  } catch (err) {
    console.error("[API] GET /api/auth/token:", err);
    return NextResponse.json(
      { error: "Error al obtener tokens" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const expiresIn = body.expiresIn ?? "30d";
    const name = typeof body.name === "string" ? body.name : undefined;

    if (!VALID_EXPIRES.includes(expiresIn)) {
      return NextResponse.json(
        { error: "expiresIn debe ser 7d, 30d, 90d o 365d" },
        { status: 400 }
      );
    }

    const { token, expiresAt } = await createApiToken(
      session.user.id,
      expiresIn,
      name
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    if (searchParams.get("revoked") === "true") {
      const deleted = await deleteRevokedApiTokens(session.user.id);
      return NextResponse.json({ success: true, deleted });
    }

    const idParam = searchParams.get("id");
    const tokenId = idParam ? Number(idParam) : NaN;

    if (!Number.isInteger(tokenId)) {
      return NextResponse.json(
        { error: "id de token invalido" },
        { status: 400 }
      );
    }

    const revoked = await revokeApiToken(session.user.id, tokenId);
    if (!revoked) {
      return NextResponse.json(
        { error: "Token no encontrado o ya revocado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API] DELETE /api/auth/token:", err);
    return NextResponse.json(
      { error: "Error al revocar token" },
      { status: 500 }
    );
  }
}
