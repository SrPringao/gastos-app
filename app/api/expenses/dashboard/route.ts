import { NextResponse } from "next/server";
import {
  getTotalSpentThisMonth,
  getSpentByAccountThisMonth,
  getSpentByCategoryThisMonth,
  getSpentByMonthLastNMonths,
  getExpenseCountThisMonth,
} from "@/lib/services/dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      totalSpent,
      countThisMonth,
      byMonth,
      byCategory,
      byAccount,
    ] = await Promise.all([
      getTotalSpentThisMonth(),
      getExpenseCountThisMonth(),
      getSpentByMonthLastNMonths(6),
      getSpentByCategoryThisMonth(),
      getSpentByAccountThisMonth(),
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
