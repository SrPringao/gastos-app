import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getBudgetImpact } from "@/lib/expense-suggestions";

/** ?date=YYYY-MM-DD&amount=centavos -> impacto en el presupuesto, o null sin presupuesto */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") ?? "";
    const amount = Number(searchParams.get("amount"));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(amount) || amount < 0) {
      return NextResponse.json({ error: "Parametros invalidos" }, { status: 400 });
    }
    const impact = await getBudgetImpact(userId, date, amount);
    return NextResponse.json({ impact });
  } catch (error) {
    console.error("[API] GET /api/expenses/budget-impact:", error);
    return NextResponse.json({ error: "Error al calcular el presupuesto" }, { status: 500 });
  }
}
