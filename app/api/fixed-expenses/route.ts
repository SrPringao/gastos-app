import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import {
  getFixedExpenses,
  createFixedExpense,
} from "@/lib/services/fixed-expenses";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const items = await getFixedExpenses(userId);
    return NextResponse.json(items);
  } catch (error) {
    console.error("[API] GET /api/fixed-expenses:", error);
    return NextResponse.json({ error: "Error al obtener gastos fijos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await request.json();
    const result = await createFixedExpense(userId, {
      name: body.name,
      amount: parseFloat(body.amount),
      dayOfMonth: body.dayOfMonth ? Number(body.dayOfMonth) : null,
      category: body.category ?? null,
    });

    if (result.error)
      return NextResponse.json({ error: result.error }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] POST /api/fixed-expenses:", error);
    return NextResponse.json({ error: "Error al crear gasto fijo" }, { status: 500 });
  }
}
