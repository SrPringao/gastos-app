import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { upsertSubscription } from "@/lib/services/push-notifications";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const result = await upsertSubscription(userId, {
      endpoint: typeof body.endpoint === "string" ? body.endpoint : "",
      p256dh: typeof body.p256dh === "string" ? body.p256dh : "",
      auth: typeof body.auth === "string" ? body.auth : "",
      userAgent: typeof body.userAgent === "string" ? body.userAgent : null,
      deviceType: typeof body.deviceType === "string" ? body.deviceType : null,
      expirationTime:
        typeof body.expirationTime === "number" ? body.expirationTime : null,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error("[API] POST /api/push-notifications/subscribe:", error);
    return NextResponse.json(
      { error: "Error al guardar la suscripcion" },
      { status: 500 }
    );
  }
}
