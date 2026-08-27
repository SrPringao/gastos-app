import { NextRequest, NextResponse } from "next/server";
import { sendDailyExpenseSummaries } from "@/lib/services/push-notifications";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await sendDailyExpenseSummaries();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[CRON] daily-summary:", error);
    return NextResponse.json(
      { error: "Error al enviar resumenes" },
      { status: 500 }
    );
  }
}
