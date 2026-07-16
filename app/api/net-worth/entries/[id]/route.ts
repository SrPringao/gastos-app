import { NextRequest, NextResponse } from "next/server";
import {
  updateNetWorthEntry,
  deleteNetWorthEntry,
} from "@/lib/services/net-worth";
import { getCurrentUserId } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = Number((await params).id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalido" }, { status: 400 });
    }
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const body = await request.json();
    const result = await updateNetWorthEntry(userId, id, {
      accountId: body.accountId,
      label: body.label,
      kind: body.kind,
      amount: body.amount,
      dueDate: body.dueDate,
      sortOrder: body.sortOrder,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] PATCH /api/net-worth/entries/[id]:", error);
    return NextResponse.json(
      { error: "Error al actualizar registro" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = Number((await params).id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalido" }, { status: 400 });
    }
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const result = await deleteNetWorthEntry(userId, id);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/net-worth/entries/[id]:", error);
    return NextResponse.json(
      { error: "Error al eliminar registro" },
      { status: 500 }
    );
  }
}
