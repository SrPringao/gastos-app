import { NextRequest, NextResponse } from "next/server";
import {
  getCardNameMappings,
  createOrUpdateMapping,
} from "@/lib/services/card-name-mappings";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const mappings = await getCardNameMappings(userId);
    return NextResponse.json(mappings);
  } catch (error) {
    console.error("[API] GET /api/card-name-mappings:", error);
    return NextResponse.json(
      { error: "Error al obtener mapeos" },
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
    const result = await createOrUpdateMapping(userId, {
      rawCardName: body.rawCardName,
      accountId: Number(body.accountId),
      reassignExistingExpenses: body.reassignExistingExpenses ?? true,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] POST /api/card-name-mappings:", error);
    return NextResponse.json(
      { error: "Error al crear mapeo" },
      { status: 500 }
    );
  }
}
