import { NextRequest, NextResponse } from "next/server";
import { getAccounts, createAccount } from "@/lib/services/accounts";
import { getCurrentUserId } from "@/lib/auth";
import { createLinkedBalance } from "@/lib/services/net-worth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const accounts = await getAccounts(userId);
    return NextResponse.json(accounts);
  } catch (error) {
    console.error("[API] GET /api/accounts:", error);
    return NextResponse.json(
      { error: "Error al obtener cuentas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const body = await request.json();
    const result = await createAccount(userId, {
      name: body.name,
      type: body.type,
      color: body.color ?? null,
      imageUrl: body.imageUrl ?? null,
      cutoffDay: body.cutoffDay ?? null,
      paymentDay: body.paymentDay ?? null,
      creditLimit: body.creditLimit ?? null,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Opcional: crear en la misma accion su saldo ligado en Patrimonio
    // (deuda si es credito, cuenta si es debito/efectivo).
    let netWorthEntryId: number | null = null;
    if (typeof body.patrimonioAmount === "number") {
      const entry = await createLinkedBalance(userId, result.account, body.patrimonioAmount);
      if ("error" in entry) {
        return NextResponse.json({ error: entry.error, account: result.account }, { status: 400 });
      }
      netWorthEntryId = entry.id;
    }

    return NextResponse.json({ success: true, account: result.account, netWorthEntryId });
  } catch (error) {
    console.error("[API] POST /api/accounts:", error);
    return NextResponse.json(
      { error: "Error al crear cuenta" },
      { status: 500 }
    );
  }
}
