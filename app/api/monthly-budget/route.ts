import { NextRequest, NextResponse } from "next/server";
import { getMonthlyBudget, upsertMonthlyBudget } from "@/lib/services/monthly-budgets";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Mes invalido. Usa formato YYYY-MM" },
        { status: 400 }
      );
    }

    const amount = await getMonthlyBudget(userId, month);
    return NextResponse.json({ amount: amount ?? 0 });
  } catch (error) {
    console.error("[API] GET /api/monthly-budget:", error);
    return NextResponse.json(
      { error: "Error al obtener presupuesto" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const body = await request.json();
    const month = body.month as string | undefined;
    const amount = typeof body.amount === "number" ? body.amount : parseFloat(body.amount);

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Mes invalido. Usa formato YYYY-MM" },
        { status: 400 }
      );
    }
    const amountCents = Math.round(amount * 100);
    if (isNaN(amountCents) || amountCents < 0) {
      return NextResponse.json(
        { error: "Monto invalido" },
        { status: 400 }
      );
    }

    const result = await upsertMonthlyBudget(userId, month, amountCents);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, amount: amountCents });
  } catch (error) {
    console.error("[API] PUT /api/monthly-budget:", error);
    return NextResponse.json(
      { error: "Error al guardar presupuesto" },
      { status: 500 }
    );
  }
}
