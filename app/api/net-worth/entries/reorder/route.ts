import { NextRequest, NextResponse } from "next/server";
import { reorderNetWorthEntries } from "@/lib/services/net-worth";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const body = await request.json();
    const orderedIds = Array.isArray(body.orderedIds)
      ? body.orderedIds.map(Number)
      : [];

    const result = await reorderNetWorthEntries(userId, orderedIds);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] POST /api/net-worth/entries/reorder:", error);
    return NextResponse.json(
      { error: "Error al reordenar registros" },
      { status: 500 }
    );
  }
}
