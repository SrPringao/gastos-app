import { NextRequest, NextResponse } from "next/server";
import { getExpensesWithDetails } from "@/lib/services/expenses";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "100", 10),
      500
    );

    const expenses = await getExpensesWithDetails(userId, limit);
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("[API] GET /api/expenses/list:", error);
    return NextResponse.json(
      { error: "Error al obtener gastos" },
      { status: 500 }
    );
  }
}
