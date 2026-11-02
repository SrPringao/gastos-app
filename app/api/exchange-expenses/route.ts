import { NextRequest, NextResponse } from "next/server";
import { getUserWithAccess } from "@/lib/services/access";
import { createExchangeExpense, getExchangeExpenses } from "@/lib/services/exchange-expenses";

export async function GET() {
  try {
    const user = await getUserWithAccess("exchange");
    if (!user)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    return NextResponse.json(await getExchangeExpenses(user.id));
  } catch (error) {
    console.error("[API] GET /api/exchange-expenses:", error);
    return NextResponse.json({ error: "Error al obtener gastos del intercambio" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserWithAccess("exchange");
    if (!user)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const result = await createExchangeExpense(user.id, await request.json());
    if (result.error)
      return NextResponse.json({ error: result.error }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] POST /api/exchange-expenses:", error);
    return NextResponse.json({ error: "Error al guardar el gasto" }, { status: 500 });
  }
}
