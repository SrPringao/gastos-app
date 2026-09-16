import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPatrimonioReportData } from "@/lib/reports/patrimonio-report-data";
import { buildPatrimonioPdf } from "@/lib/reports/build-patrimonio-pdf";
import { parseReportOptions } from "@/lib/reports/report-options";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = parseReportOptions(body);
    if (!parsed.options) {
      return NextResponse.json(
        { error: parsed.error || "Opciones invalidas" },
        { status: 400 }
      );
    }

    const data = await getPatrimonioReportData(user, parsed.options);
    const bytes = buildPatrimonioPdf(data);
    const filename = `expensebro-reporte-${data.fileStamp}.pdf`;

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[API] POST /api/net-worth/report:", error);
    return NextResponse.json(
      { error: "No se pudo generar el reporte" },
      { status: 500 }
    );
  }
}
