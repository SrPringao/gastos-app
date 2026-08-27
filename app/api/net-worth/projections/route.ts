import { NextRequest, NextResponse } from "next/server";
import {
  getNetWorthProjections,
  createNetWorthProjection,
} from "@/lib/services/net-worth";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const projections = await getNetWorthProjections(userId);
    return NextResponse.json(projections);
  } catch (error) {
    console.error("[API] GET /api/net-worth/projections:", error);
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
    const result = await createNetWorthProjection(userId, {
      label: body.label,
      amount: body.amount,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] POST /api/net-worth/projections:", error);
    return NextResponse.json(
      { error: "Error al crear registro" },
      { status: 500 }
    );
  }
}
