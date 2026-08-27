import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { deleteSubscription } from "@/lib/services/push-notifications";

export const runtime = "nodejs";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await context.params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return NextResponse.json({ error: "Id invalido" }, { status: 400 });
    }

    const deleted = await deleteSubscription(userId, numericId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Suscripcion no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "[API] DELETE /api/push-notifications/subscriptions/[id]:",
      error
    );
    return NextResponse.json(
      { error: "Error al borrar la suscripcion" },
      { status: 500 }
    );
  }
}
