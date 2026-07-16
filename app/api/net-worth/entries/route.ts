import { NextRequest, NextResponse } from "next/server";
import {
  getNetWorthEntries,
  createNetWorthEntry,
} from "@/lib/services/net-worth";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const entries = await getNetWorthEntries(userId);
    return NextResponse.json(entries);
  } catch (error) {
    console.error("[API] GET /api/net-worth/entries:", error);
    return NextResponse.json(
      { error: "Error al obtener registros" },
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
    const result = await createNetWorthEntry(userId, {
      accountId: body.accountId ?? null,
      label: body.label,
      kind: body.kind,
      amount: body.amount,
      dueDate: body.dueDate ?? null,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] POST /api/net-worth/entries:", error);
    return NextResponse.json(
      { error: "Error al crear registro" },
      { status: 500 }
    );
  }
}
