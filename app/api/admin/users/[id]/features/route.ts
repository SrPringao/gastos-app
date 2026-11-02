import { NextRequest, NextResponse } from "next/server";
import { getUserWithAccess, setUserFeature } from "@/lib/services/access";
import { isUserFeatureKey } from "@/lib/features";

/** Enciende o apaga una funcion especial a un usuario. Solo super admin. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getUserWithAccess("superAdmin");
    if (!admin)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const userId = (await params).id;
    if (!/^[0-9a-f-]{36}$/i.test(userId))
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const body = await request.json();
    if (!isUserFeatureKey(body.feature) || typeof body.enabled !== "boolean")
      return NextResponse.json({ error: "Función o estado inválido" }, { status: 400 });

    await setUserFeature(userId, body.feature, body.enabled, admin.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] PATCH /api/admin/users/[id]/features:", error);
    return NextResponse.json({ error: "Error al actualizar la función" }, { status: 500 });
  }
}
