import { NextRequest, NextResponse } from "next/server";
import { createExpense } from "@/lib/services/expenses";
import { getExpenses } from "@/lib/services/expenses";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "100", 10),
      500
    );

    const expenses = await getExpenses(limit);
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("[API] GET /api/expenses:", error);
    return NextResponse.json(
      { error: "Error al obtener gastos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const amount = parseFloat(body.amount);
    if (isNaN(amount)) {
      return NextResponse.json(
        { error: "Monto invalido" },
        { status: 400 }
      );
    }

    const result = await createExpense({
      amount,
      accountId: Number(body.accountId),
      categoryId: body.categoryId ? Number(body.categoryId) : null,
      date: body.date || new Date().toISOString().slice(0, 10),
      description: body.description ?? null,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] POST /api/expenses:", error);
    return NextResponse.json(
      { error: "Error al crear gasto" },
      { status: 500 }
    );
  }
}
