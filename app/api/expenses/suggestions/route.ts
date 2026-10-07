import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getRecentMerchants, getTopMethods, getUsageCounts } from "@/lib/expense-suggestions";
import { todayDateString } from "@/lib/utils/dates";

/** Recientes, metodos mas usados y conteos de uso para el flujo "Nuevo gasto" */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const month = todayDateString().slice(0, 7);
    const [recents, topMethods, usage] = await Promise.all([
      getRecentMerchants(userId, { days: 30, limit: 6 }),
      getTopMethods(userId, month, 3),
      getUsageCounts(userId),
    ]);
    return NextResponse.json({ recents, topMethods, usage });
  } catch (error) {
    console.error("[API] GET /api/expenses/suggestions:", error);
    return NextResponse.json({ error: "Error al obtener sugerencias" }, { status: 500 });
  }
}
