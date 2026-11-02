import { NextRequest, NextResponse } from "next/server";
import { getUserWithAccess } from "@/lib/services/access";
import { deleteExchangeExpense, updateExchangeExpense } from "@/lib/services/exchange-expenses";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = Number((await params).id);
    if (isNaN(id))
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const user = await getUserWithAccess("exchange");
    if (!user)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const result = await updateExchangeExpense(user.id, id, await request.json());
    if (result.error)
      return NextResponse.json({ error: result.error }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] PATCH /api/exchange-expenses/[id]:", error);
    return NextResponse.json({ error: "Error al actualizar el gasto" }, { status: 500 });
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

    const user = await getUserWithAccess("exchange");
    if (!user)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const result = await deleteExchangeExpense(user.id, id);
    if (result.error)
      return NextResponse.json({ error: result.error }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/exchange-expenses/[id]:", error);
    return NextResponse.json({ error: "Error al eliminar el gasto" }, { status: 500 });
  }
}
