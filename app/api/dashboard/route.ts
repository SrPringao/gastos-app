import { NextRequest, NextResponse } from "next/server";
import {
  getTotalSpentThisMonth,
  getSpentByAccountThisMonth,
  getRecentExpenses,
} from "@/lib/services/dashboard";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "5", 10),
      50
    );

    const [totalSpent, spentByAccount, recentExpenses] = await Promise.all([
      getTotalSpentThisMonth(),
      getSpentByAccountThisMonth(),
      getRecentExpenses(limit),
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
