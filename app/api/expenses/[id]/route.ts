import { NextRequest, NextResponse } from "next/server";
import { updateExpense, getExpenseById } from "@/lib/services/expenses";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = Number((await params).id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalido" }, { status: 400 });
    }
    const expense = await getExpenseById(id);
    if (!expense) {
      return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });
    }
    return NextResponse.json(expense);
  } catch (error) {
    console.error("[API] GET /api/expenses/[id]:", error);
    return NextResponse.json(
      { error: "Error al obtener gasto" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = Number((await params).id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalido" }, { status: 400 });
    }
    const body = await request.json();

    const result = await updateExpense(id, {
      amount: body.amount,
      accountId: body.accountId,
      categoryId: body.categoryId ?? null,
      date: body.date,
      description: body.description ?? null,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] PATCH /api/expenses/[id]:", error);
    return NextResponse.json(
      { error: "Error al actualizar gasto" },
      { status: 500 }
    );
  }
}
