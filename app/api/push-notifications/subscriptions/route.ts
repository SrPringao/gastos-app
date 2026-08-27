import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { listSubscriptions } from "@/lib/services/push-notifications";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const subscriptions = await listSubscriptions(userId);
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("[API] GET /api/push-notifications/subscriptions:", error);
    return NextResponse.json(
      { error: "Error al listar suscripciones" },
      { status: 500 }
    );
  }
}
