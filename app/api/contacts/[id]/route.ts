import { NextRequest, NextResponse } from "next/server";
import { renameContact, setContactArchived } from "@/lib/services/contacts";
import { getCurrentUserId } from "@/lib/auth";

/** Renombrar ({ name }) y/o archivar/restaurar ({ archived }) */
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

    if (typeof body.name === "string") {
      const result = await renameContact(userId, id, body.name);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    }
    if (typeof body.archived === "boolean") {
      const result = await setContactArchived(userId, id, body.archived);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] PATCH /api/contacts/[id]:", error);
    return NextResponse.json({ error: "Error al actualizar persona" }, { status: 500 });
  }
}
