import { NextRequest, NextResponse } from "next/server";
import { getCategories, createCategory } from "@/lib/services/categories";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const categories = await getCategories(userId);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("[API] GET /api/categories:", error);
    return NextResponse.json(
      { error: "Error al obtener categorias" },
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
    const result = await createCategory(userId, {
      name: body.name,
      color: body.color ?? null,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] POST /api/categories:", error);
    return NextResponse.json(
      { error: "Error al crear categoria" },
      { status: 500 }
    );
  }
}
