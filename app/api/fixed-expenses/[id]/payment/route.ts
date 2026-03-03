import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { markAsPaid, markAsUnpaid } from "@/lib/services/fixed-expenses";

export async function POST(
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
    const { month } = body;
    if (!month || !/^\d{4}-\d{2}$/.test(month))
      return NextResponse.json({ error: "Mes inválido" }, { status: 400 });

    const result = await markAsPaid(userId, id, month);
    if (result.error)
      return NextResponse.json({ error: result.error }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] POST /api/fixed-expenses/[id]/payment:", error);
    return NextResponse.json({ error: "Error al marcar como pagado" }, { status: 500 });
  }
}

export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    if (!month || !/^\d{4}-\d{2}$/.test(month))
      return NextResponse.json({ error: "Mes inválido" }, { status: 400 });

    const result = await markAsUnpaid(userId, id, month);
    if (result.error)
      return NextResponse.json({ error: result.error }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/fixed-expenses/[id]/payment:", error);
    return NextResponse.json({ error: "Error al desmarcar pago" }, { status: 500 });
  }
}
