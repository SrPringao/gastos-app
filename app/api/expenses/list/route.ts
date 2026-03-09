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
    const month = searchParams.get("month") || undefined;
    const monthKey =
      month && /^\d{4}-\d{2}$/.test(month) ? month : undefined;
    
    const accountIdParam = searchParams.get("accountId");
    const accountId = accountIdParam ? parseInt(accountIdParam, 10) : undefined;

    const date = searchParams.get("date") || undefined;
    const dateStr =
      date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;

    const expenses = await getExpensesWithDetails(userId, limit, monthKey, accountId, dateStr);
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("[API] GET /api/expenses/list:", error);
    return NextResponse.json(
      { error: "Error al obtener gastos" },
      { status: 500 }
    );
  }
}
