import { NextResponse } from "next/server";
import { getMonthsWithExpenses } from "@/lib/services/dashboard";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const months = await getMonthsWithExpenses(userId);
    return NextResponse.json(months);
  } catch (error) {
    console.error("[API] GET /api/dashboard/months:", error);
    return NextResponse.json(
      { error: "Error al obtener meses" },
      { status: 500 }
    );
  }
}
