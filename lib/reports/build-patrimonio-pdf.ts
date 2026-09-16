import { SimplePdf, type PdfRgb } from "./simple-pdf";
import type { PatrimonioReportData, ReportLine } from "./patrimonio-report-data";

const ink: PdfRgb = { r: 25, g: 25, b: 25 };
const midnight: PdfRgb = { r: 14, g: 14, b: 14 };
const paper: PdfRgb = { r: 255, g: 255, b: 255 };
const slate: PdfRgb = { r: 109, g: 110, b: 113 };
const cloud: PdfRgb = { r: 242, g: 242, b: 244 };
const hairline: PdfRgb = { r: 228, g: 228, b: 231 };
const voltage: PdfRgb = { r: 64, g: 91, b: 255 };
const violet: PdfRgb = { r: 112, g: 132, b: 255 };
const emerald: PdfRgb = { r: 5, g: 150, b: 105 };
const danger: PdfRgb = { r: 185, g: 28, b: 28 };

const MARGIN = 40;
const FOOTER_FROM_TOP_OFFSET = 36;
const BOTTOM = 52;

type Cursor = {
  pdf: SimplePdf;
  y: number;
  contentW: number;
  data: PatrimonioReportData;
  first: boolean;
};

export function buildPatrimonioPdf(data: PatrimonioReportData): Uint8Array {
  const pdf = new SimplePdf();
  const ctx: Cursor = {
    pdf,
    y: 0,
    contentW: pdf.pageW - MARGIN * 2,
    data,
    first: true,
  };

  startPage(ctx);
  drawIntro(ctx);
  if (data.facts.length > 0) drawFacts(ctx);
  if (data.options.includePatrimonio) {
    drawMetrics(ctx);
    drawSection(ctx, "Positivos", data.assets, data.assetsLabel, emerald);
    drawSection(ctx, "Deudas", data.debts, data.debtsLabel, danger);
    drawSection(
      ctx,
      "Gastos previstos (simulador)",
      data.projections,
      data.previstoLabel,
      voltage
    );
  }
  if (data.options.includeCurrentMonth) {
    ensure(ctx, 92);
    drawEyebrow(ctx, "Mes en curso");
    drawMonthSummary(ctx);
    drawSection(
      ctx,
      `Gastado por categoria · ${data.monthLabel}`,
      data.spentByCategory,
      data.spentLabel,
      ink
    );
    drawSection(
      ctx,
      "Gastado por cuenta",
      data.spentByAccount,
      data.spentLabel,
      ink
    );
  }
  if (data.options.includeHistory) drawMonths(ctx);
  if (data.options.includeFixedExpenses) {
    drawSection(
      ctx,
      "Gastos fijos recurrentes",
      data.fixedExpenses,
      data.fixedTotalLabel,
      ink
    );
  }
  drawUsageNote(ctx);
  drawFooters(ctx);

  return pdf.build();
}

function startPage(ctx: Cursor) {
  if (!ctx.first) ctx.pdf.addPage();
  ctx.first = false;
  if (ctx.pdf.pageCount === 1) {
    drawCoverHeader(ctx.pdf, ctx.data);
    ctx.y = 118;
  } else {
    drawContHeader(ctx.pdf, ctx.data);
    ctx.y = 64;
  }
}

function ensure(ctx: Cursor, h: number) {
  if (ctx.y + h > ctx.pdf.pageH - BOTTOM) startPage(ctx);
}

function drawCoverHeader(pdf: SimplePdf, data: PatrimonioReportData) {
  pdf.fillRect(0, 0, pdf.pageW, 96, midnight);
  pdf.fillRect(0, 96, pdf.pageW, 3, voltage);
  pdf.text(MARGIN, 32, "EXPENSEBRO", {
    size: 9,
    font: "sans-bold",
    color: violet,
  });
  pdf.text(MARGIN, 54, "Reporte para Claude", {
    size: 20,
    font: "sans-bold",
    color: paper,
  });
  pdf.text(MARGIN, 76, `${data.ownerName}  ·  ${data.generatedAtLabel}`, {
    size: 9,
    color: { r: 167, g: 169, b: 172 },
    maxWidth: pdf.pageW - MARGIN * 2,
  });
}

function drawContHeader(pdf: SimplePdf, data: PatrimonioReportData) {
  pdf.fillRect(0, 0, pdf.pageW, 44, midnight);
  pdf.fillRect(0, 44, pdf.pageW, 2, voltage);
  pdf.text(MARGIN, 28, "ExpenseBro  ·  Reporte para Claude", {
    size: 10,
    font: "sans-bold",
    color: paper,
  });
  pdf.text(pdf.pageW - MARGIN, 28, data.generatedOn, {
    size: 9,
    font: "mono",
    color: { r: 167, g: 169, b: 172 },
    align: "right",
  });
}

function includedLabels(data: PatrimonioReportData): string[] {
  const labels: string[] = [];
  if (data.options.includePatrimonio) {
    labels.push("patrimonio (positivos, deudas, neto y simulador)");
  }
  if (data.options.includeCurrentMonth) {
    labels.push(`mes en curso (${data.monthLabel})`);
  }
  if (data.options.includeHistory) {
    labels.push(`historial de ${data.options.historyMonths} meses`);
  }
  if (data.options.includeFixedExpenses) labels.push("gastos fijos recurrentes");
  return labels;
}

function drawIntro(ctx: Cursor) {
  const { pdf, data, contentW } = ctx;
  const sections = includedLabels(data);
  const lines = pdf.wrap(
    `Snapshot financiero para seguir el analisis con Claude. Moneda MXN. Este archivo incluye: ${sections.join("; ")}.`,
    contentW,
    9,
    "sans"
  );
  for (const line of lines) {
    pdf.text(MARGIN, ctx.y, line, { size: 9, color: slate });
    ctx.y += 13;
  }
  ctx.y += 14;
}

function drawMetrics(ctx: Cursor) {
  const { pdf, data, contentW } = ctx;
  const gap = 10;
  const boxW = (contentW - gap * 2) / 3;
  const boxH = 70;
  const items = [
    {
      label: "Positivos",
      value: data.assetsLabel,
      color: emerald,
      fill: { r: 236, g: 253, b: 245 },
      border: { r: 167, g: 243, b: 208 },
    },
    {
      label: "Deudas",
      value: data.debtsLabel,
      color: danger,
      fill: { r: 254, g: 242, b: 242 },
      border: { r: 254, g: 202, b: 202 },
    },
    {
      label: "Neto",
      value: data.netLabel,
      color: data.netCents >= 0 ? emerald : danger,
      fill: cloud,
      border: hairline,
    },
  ];
  items.forEach((item, i) => {
    const x = MARGIN + i * (boxW + gap);
    pdf.roundedRect(x, ctx.y, boxW, boxH, 14, item.fill, item.border, 0.8);
    pdf.text(x + 12, ctx.y + 20, item.label.toUpperCase(), {
      size: 8,
      font: "sans-bold",
      color: item.color,
    });
    pdf.text(x + 12, ctx.y + 44, item.value, {
      size: 11,
      font: "sans-bold",
      color: item.color,
      maxWidth: boxW - 24,
    });
  });
  ctx.y += boxH + 16;
}

function drawFacts(ctx: Cursor) {
  drawEyebrow(ctx, "Lectura rapida");
  for (const fact of ctx.data.facts) {
    const lines = ctx.pdf.wrap(`- ${fact}`, ctx.contentW, 9, "sans");
    ensure(ctx, lines.length * 13 + 4);
    for (const line of lines) {
      ctx.pdf.text(MARGIN, ctx.y, line, { size: 9, color: ink });
      ctx.y += 13;
    }
    ctx.y += 3;
  }
  ctx.y += 10;
}

function drawEyebrow(ctx: Cursor, title: string) {
  ctx.pdf.text(MARGIN, ctx.y, title.toUpperCase(), {
    size: 8,
    font: "sans-bold",
    color: slate,
  });
  ctx.y += 16;
}

function drawSection(
  ctx: Cursor,
  title: string,
  rows: ReportLine[],
  totalLabel: string,
  totalColor: PdfRgb
) {
  const firstH = rows[0]?.detail ? 28 : 22;
  ensure(ctx, rows.length === 0 ? 58 : 52 + firstH);
  drawEyebrow(ctx, title);
  if (rows.length === 0) {
    ctx.pdf.text(MARGIN, ctx.y, "Nada registrado.", { size: 9, color: slate });
    ctx.y += 22;
    return;
  }
  drawTableHeader(ctx);
  for (const row of rows) {
    const rowH = row.detail ? 28 : 22;
    const yBefore = ctx.y;
    ensure(ctx, rowH + 2);
    if (ctx.y < yBefore) drawTableHeader(ctx);
    drawTableRow(ctx, row, rowH);
  }
  ensure(ctx, 22);
  ctx.pdf.hline(MARGIN, ctx.y, ctx.contentW, hairline, 0.8);
  ctx.y += 14;
  ctx.pdf.text(MARGIN, ctx.y, "Total", {
    size: 9,
    font: "sans-bold",
    color: ink,
  });
  ctx.pdf.text(MARGIN + ctx.contentW, ctx.y, totalLabel, {
    size: 9,
    font: "sans-bold",
    color: totalColor,
    align: "right",
  });
  ctx.y += 22;
}

function drawTableHeader(ctx: Cursor) {
  ctx.pdf.text(MARGIN, ctx.y, "CONCEPTO", {
    size: 7,
    font: "sans-bold",
    color: slate,
  });
  ctx.pdf.text(MARGIN + ctx.contentW, ctx.y, "MONTO MXN", {
    size: 7,
    font: "sans-bold",
    color: slate,
    align: "right",
  });
  ctx.y += 8;
  ctx.pdf.hline(MARGIN, ctx.y, ctx.contentW, hairline);
  ctx.y += 12;
}

function drawTableRow(ctx: Cursor, row: ReportLine, rowH: number) {
  const amountW = 110;
  ctx.pdf.text(MARGIN, ctx.y, row.label, {
    size: 9,
    font: "sans-bold",
    color: ink,
    maxWidth: ctx.contentW - amountW - 8,
  });
  ctx.pdf.text(MARGIN + ctx.contentW, ctx.y, row.amountLabel, {
    size: 9,
    font: "sans",
    color: ink,
    align: "right",
  });
  if (row.detail) {
    ctx.pdf.text(MARGIN, ctx.y + 12, row.detail, {
      size: 8,
      color: slate,
      maxWidth: ctx.contentW - amountW - 8,
    });
  }
  ctx.y += rowH;
}

function drawMonthSummary(ctx: Cursor) {
  const { pdf, data, contentW } = ctx;
  const h = 78;
  pdf.roundedRect(MARGIN, ctx.y, contentW, h, 14, cloud);
  const col = contentW / 3;
  const cells = [
    { label: "Gastado", value: data.spentLabel },
    { label: "Presupuesto", value: data.budgetLabel ?? "Sin presupuesto" },
    {
      label: data.budgetRemainingLabel ? "Disponible" : "Movimientos",
      value: data.budgetRemainingLabel ?? String(data.expenseCount),
    },
  ];
  cells.forEach((cell, i) => {
    const x = MARGIN + col * i + 14;
    pdf.text(x, ctx.y + 22, cell.label.toUpperCase(), {
      size: 8,
      font: "sans-bold",
      color: slate,
    });
    pdf.text(x, ctx.y + 46, cell.value, {
      size: 11,
      font: "sans-bold",
      color: ink,
      maxWidth: col - 24,
    });
  });
  if (data.budgetPctLabel) {
    pdf.text(
      MARGIN + 14,
      ctx.y + 66,
      `${data.budgetPctLabel} del presupuesto usado`,
      { size: 8, color: slate }
    );
  }
  ctx.y += h + 18;
}

function drawMonths(ctx: Cursor) {
  const first = ctx.data.months[0];
  const firstH = first?.budgetLabel ? 28 : 22;
  ensure(ctx, 52 + firstH);
  drawEyebrow(
    ctx,
    `Historial de gastos (${ctx.data.options.historyMonths} meses)`
  );
  drawTableHeader(ctx);
  for (const month of ctx.data.months) {
    const detail =
      month.budgetLabel != null ? `presupuesto ${month.budgetLabel}` : undefined;
    const rowH = detail ? 28 : 22;
    const yBefore = ctx.y;
    ensure(ctx, rowH + 2);
    if (ctx.y < yBefore) drawTableHeader(ctx);
    drawTableRow(
      ctx,
      {
        label: month.label,
        detail,
        amountLabel: month.spentLabel,
        amountCents: month.spentCents,
      },
      rowH
    );
  }
  ctx.y += 10;
}

function drawUsageNote(ctx: Cursor) {
  ensure(ctx, 72);
  ctx.y += 8;
  ctx.pdf.roundedRect(MARGIN, ctx.y, ctx.contentW, 58, 12, cloud);
  ctx.pdf.text(MARGIN + 16, ctx.y + 18, "Como usar este archivo", {
    size: 9,
    font: "sans-bold",
    color: ink,
  });
  const tip =
    "Adjuntalo en Claude y pide continuar el analisis. Las cifras son un snapshot a la fecha de generacion, en MXN. Solo incluye las secciones que marcaste al generar este archivo.";
  const tipLines = ctx.pdf.wrap(tip, ctx.contentW - 32, 8, "sans");
  let ty = ctx.y + 32;
  for (const line of tipLines) {
    ctx.pdf.text(MARGIN + 16, ty, line, { size: 8, color: slate });
    ty += 11;
  }
  ctx.y += 70;
}

function drawFooters(ctx: Cursor) {
  const { pdf } = ctx;
  for (let i = 0; i < pdf.pageCount; i++) {
    pdf.usePage(i);
    pdf.text(MARGIN, pdf.pageH - FOOTER_FROM_TOP_OFFSET, "ExpenseBro · documento privado", {
      size: 8,
      color: slate,
    });
    pdf.text(
      pdf.pageW - MARGIN,
      pdf.pageH - FOOTER_FROM_TOP_OFFSET,
      `${i + 1} / ${pdf.pageCount}`,
      {
        size: 8,
        font: "mono",
        color: slate,
        align: "right",
      }
    );
  }
}
