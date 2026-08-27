import { NextResponse } from "next/server";
import { getUnassignedCardGroups } from "@/lib/services/card-name-mappings";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const groups = await getUnassignedCardGroups(userId);
    return NextResponse.json(groups);
  } catch (error) {
    console.error("[API] GET /api/card-name-mappings/unassigned:", error);
    return NextResponse.json(
      { error: "Error al obtener tarjetas sin asignar" },
      { status: 500 }
    );
  }
}
