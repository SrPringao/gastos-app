import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { sendToUser } from "@/lib/services/push-notifications";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : "Gastos";
    const notificationBody =
      typeof body.body === "string" && body.body.trim()
        ? body.body.trim()
        : "Esta es una notificacion de prueba";
    const url =
      typeof body.url === "string" && body.url.trim() ? body.url.trim() : "/";

    const result = await sendToUser({
      userId,
      title,
      body: notificationBody,
      url,
      tag: "push-test",
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[API] POST /api/push-notifications/send-test:", error);
    return NextResponse.json(
      { error: "Error al enviar la prueba" },
      { status: 500 }
    );
  }
}
