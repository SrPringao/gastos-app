import { NextRequest, NextResponse } from "next/server";
import { mergeContacts } from "@/lib/services/contacts";
import { getCurrentUserId } from "@/lib/auth";

/** Fusiona { sourceId } dentro de { targetId } */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const body = await request.json();
    const sourceId = Number(body.sourceId);
    const targetId = Number(body.targetId);
    if (!Number.isInteger(sourceId) || !Number.isInteger(targetId)) {
      return NextResponse.json({ error: "Personas invalidas" }, { status: 400 });
    }
    const result = await mergeContacts(userId, sourceId, targetId);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] POST /api/contacts/merge:", error);
    return NextResponse.json({ error: "Error al fusionar personas" }, { status: 500 });
  }
}
