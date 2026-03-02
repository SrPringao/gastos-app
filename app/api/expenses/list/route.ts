import { NextRequest, NextResponse } from "next/server";
import { getExpensesWithDetails } from "@/lib/services/expenses";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "100", 10),
      500
    );

    const expenses = await getExpensesWithDetails(limit);
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("[API] GET /api/expenses/list:", error);
    return NextResponse.json(
      { error: "Error al obtener gastos" },
      { status: 500 }
    );
  }
}
