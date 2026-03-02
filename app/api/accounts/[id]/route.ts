import { NextRequest, NextResponse } from "next/server";
import { updateAccount, getAccountById } from "@/lib/services/accounts";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = Number((await params).id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID invalido" },
        { status: 400 }
      );
    }
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const account = await getAccountById(id);
    if (!account) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }
    if (account.userId && account.userId !== userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return NextResponse.json(account);
  } catch (error) {
    console.error("[API] GET /api/accounts/[id]:", error);
    return NextResponse.json(
      { error: "Error al obtener cuenta" },
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
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const body = await request.json();
    const result = await updateAccount(userId, id, {
      name: body.name,
      type: body.type,
      color: body.color ?? null,
      imageUrl: body.imageUrl ?? null,
      cutoffDay: body.cutoffDay ?? null,
      paymentDay: body.paymentDay ?? null,
      creditLimit: body.creditLimit ?? null,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] PATCH /api/accounts/[id]:", error);
    return NextResponse.json(
      { error: "Error al actualizar cuenta" },
      { status: 500 }
    );
  }
}
