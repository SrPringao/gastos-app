import { NextRequest, NextResponse } from "next/server";
import { getUserPreferences, upsertUserPreferences } from "@/lib/services/preferences";
import { getCurrentUserId } from "@/lib/auth";
import { allMobileNavCandidates, quickActions } from "@/lib/nav-config";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const preferences = await getUserPreferences(userId);
    return NextResponse.json(preferences);
  } catch (error) {
    console.error("[API] GET /api/preferences:", error);
    return NextResponse.json(
      { error: "Error al obtener preferencias" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const updates: {
      theme?: "dark" | "light";
      hideNetWorthAmounts?: boolean;
      mobileNavHrefs?: string[] | null;
    } = {};

    if (body.theme !== undefined) {
      if (body.theme !== "dark" && body.theme !== "light") {
        return NextResponse.json({ error: "Tema invalido" }, { status: 400 });
      }
      updates.theme = body.theme;
    }

    if (body.hideNetWorthAmounts !== undefined) {
      if (typeof body.hideNetWorthAmounts !== "boolean") {
        return NextResponse.json(
          { error: "hideNetWorthAmounts debe ser boolean" },
          { status: 400 }
        );
      }
      updates.hideNetWorthAmounts = body.hideNetWorthAmounts;
    }

    if (body.mobileNavHrefs !== undefined) {
      if (body.mobileNavHrefs !== null) {
        const validHrefs = new Set(allMobileNavCandidates.map((item) => item.href));
        const validActionIds = new Set(quickActions.map((action) => action.id));
        const ids = body.mobileNavHrefs;
        if (
          !Array.isArray(ids) ||
          ids.length > 5 ||
          !ids.every(
            (id: unknown) =>
              typeof id === "string" && (validHrefs.has(id) || validActionIds.has(id))
          )
        ) {
          return NextResponse.json(
            { error: "mobileNavHrefs invalido: hasta 5 secciones o funciones validas" },
            { status: 400 }
          );
        }
      }
      updates.mobileNavHrefs = body.mobileNavHrefs;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No se envio ninguna preferencia valida" },
        { status: 400 }
      );
    }

    const preferences = await upsertUserPreferences(userId, updates);
    return NextResponse.json(preferences);
  } catch (error) {
    console.error("[API] PATCH /api/preferences:", error);
    return NextResponse.json(
      { error: "Error al guardar preferencias" },
      { status: 500 }
    );
  }
}
