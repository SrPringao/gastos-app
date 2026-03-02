import { NextResponse } from "next/server";
import {
  getTotalSpentThisMonth,
  getSpentByAccountThisMonth,
  getSpentByCategoryThisMonth,
  getSpentByMonthLastNMonths,
  getExpenseCountThisMonth,
} from "@/lib/services/dashboard";
import { getCurrentUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const [
      totalSpent,
      countThisMonth,
      byMonth,
      byCategory,
      byAccount,
    ] = await Promise.all([
      getTotalSpentThisMonth(userId),
      getExpenseCountThisMonth(userId),
      getSpentByMonthLastNMonths(userId, 6),
      getSpentByCategoryThisMonth(userId),
      getSpentByAccountThisMonth(userId),
    ]);

    return NextResponse.json({
      totalSpent,
      countThisMonth,
      byMonth,
      byCategory,
      byAccount,
    });
  } catch (error) {
    console.error("[API] GET /api/expenses/dashboard:", error);
    return NextResponse.json(
      { error: "Error al obtener datos del dashboard de gastos" },
      { status: 500 }
    );
  }
}
