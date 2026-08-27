import { NextRequest, NextResponse } from "next/server";
import { deleteMapping } from "@/lib/services/card-name-mappings";
import { getCurrentUserId } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
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
    const result = await deleteMapping(userId, id);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/card-name-mappings/[id]:", error);
    return NextResponse.json(
      { error: "Error al eliminar mapeo" },
      { status: 500 }
    );
  }
}
