import { NextRequest, NextResponse } from "next/server";
import { getCategories, createCategory } from "@/lib/services/categories";

export async function GET() {
  try {
    const categories = await getCategories();
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
    const body = await request.json();
    const result = await createCategory({
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
