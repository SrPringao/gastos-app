import { NextRequest, NextResponse } from "next/server";
import { getAccounts, createAccount } from "@/lib/services/accounts";

export async function GET() {
  try {
    const accounts = await getAccounts();
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
    const body = await request.json();
    const result = await createAccount({
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
    console.error("[API] POST /api/accounts:", error);
    return NextResponse.json(
      { error: "Error al crear cuenta" },
      { status: 500 }
    );
  }
}
