import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { deleteFixedExpense, updateFixedExpense } from "@/lib/services/fixed-expenses";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = Number((await params).id);
    if (isNaN(id))
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const userId = await getCurrentUserId();
    if (!userId)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await request.json();
    const result = await updateFixedExpense(userId, id, {
      name: body.name,
      amount: body.amount !== undefined ? parseFloat(body.amount) : undefined,
      dayOfMonth: body.dayOfMonth !== undefined ? (body.dayOfMonth ? Number(body.dayOfMonth) : null) : undefined,
      category: body.category,
    });

    if (result.error)
      return NextResponse.json({ error: result.error }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] PATCH /api/fixed-expenses/[id]:", error);
    return NextResponse.json({ error: "Error al actualizar gasto fijo" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = Number((await params).id);
    if (isNaN(id))
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const userId = await getCurrentUserId();
    if (!userId)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const result = await deleteFixedExpense(userId, id);
    if (result.error)
      return NextResponse.json({ error: result.error }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/fixed-expenses/[id]:", error);
    return NextResponse.json({ error: "Error al eliminar gasto fijo" }, { status: 500 });
  }
}
