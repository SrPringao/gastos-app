import { NextRequest, NextResponse } from "next/server";
import {
  getTotalSpentThisMonth,
  getSpentByAccountThisMonth,
  getRecentExpenses,
} from "@/lib/services/dashboard";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "5", 10),
      50
    );

    const [totalSpent, spentByAccount, recentExpenses] = await Promise.all([
      getTotalSpentThisMonth(userId),
      getSpentByAccountThisMonth(userId),
      getRecentExpenses(userId, limit),
    ]);

    return NextResponse.json({
      totalSpent,
      spentByAccount,
      recentExpenses,
    });
  } catch (error) {
    console.error("[API] GET /api/dashboard:", error);
    return NextResponse.json(
      { error: "Error al obtener datos del dashboard" },
      { status: 500 }
    );
  }
}
