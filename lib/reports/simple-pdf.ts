/**
 * Generador minimo de PDF 1.4 con las 14 fuentes estandar.
 * Origen abajo-izquierda internamente; la API publica usa Y desde arriba
 * para que el layout del reporte se lea como una pagina web.
 */

export type PdfFont = "sans" | "sans-bold" | "mono" | "mono-bold";

export type PdfRgb = { r: number; g: number; b: number };

const PAGE_W = 612;
const PAGE_H = 792;

const FONT_RES: Record<PdfFont, { name: string; base: string }> = {
  sans: { name: "F1", base: "Helvetica" },
  "sans-bold": { name: "F2", base: "Helvetica-Bold" },
  mono: { name: "F3", base: "Courier" },
  "mono-bold": { name: "F4", base: "Courier-Bold" },
};

function pdfColor(c: PdfRgb): string {
  const n = (v: number) => (v / 255).toFixed(4);
  return `${n(c.r)} ${n(c.g)} ${n(c.b)}`;
}

function encodeWinAnsi(input: string): string {
  let out = "(";
  for (const ch of input) {
    if (ch === "\\" || ch === "(" || ch === ")") {
      out += `\\${ch}`;
      continue;
    }
    const code = ch.charCodeAt(0);
    if (code >= 32 && code <= 126) {
      out += ch;
      continue;
    }
    const mapped = WINANSI[ch];
    if (mapped != null) {
      out += `\\${mapped.toString(8).padStart(3, "0")}`;
      continue;
    }
    if (code <= 255) {
      out += `\\${code.toString(8).padStart(3, "0")}`;
      continue;
    }
    out += "?";
  }
  return `${out})`;
}

const WINANSI: Record<string, number> = {
  "\u00A0": 0xa0,
  "\u00A1": 0xa1,
  "\u00B0": 0xb0,
  "\u00BF": 0xbf,
  "\u00C1": 0xc1,
  "\u00C9": 0xc9,
  "\u00CD": 0xcd,
  "\u00D1": 0xd1,
  "\u00D3": 0xd3,
  "\u00DA": 0xda,
  "\u00DC": 0xdc,
  "\u00E1": 0xe1,
  "\u00E9": 0xe9,
  "\u00ED": 0xed,
  "\u00F1": 0xf1,
  "\u00F3": 0xf3,
  "\u00FA": 0xfa,
  "\u00FC": 0xfc,
  "\u2013": 0x96,
  "\u2014": 0x97,
  "\u2018": 0x91,
  "\u2019": 0x92,
  "\u201C": 0x93,
  "\u201D": 0x94,
  "\u2022": 0x95,
  "\u2026": 0x85,
};

function avgCharWidth(font: PdfFont, size: number): number {
  const em = font.startsWith("mono") ? 0.6 : 0.5;
  return size * em;
}

export class SimplePdf {
  readonly pageW = PAGE_W;
  readonly pageH = PAGE_H;
  private pages: string[][] = [];
  private pageIndex = 0;

  constructor() {
    this.pages.push([]);
  }

  get pageCount(): number {
    return this.pages.length;
  }

  addPage() {
    this.pages.push([]);
    this.pageIndex = this.pages.length - 1;
  }

  usePage(index: number) {
    if (index < 0 || index >= this.pages.length) {
      throw new Error("Pagina PDF fuera de rango");
    }
    this.pageIndex = index;
  }

  private cmd(s: string) {
    this.pages[this.pageIndex].push(s);
  }

  private pdfY(yFromTop: number): number {
    return this.pageH - yFromTop;
  }

  fillRect(x: number, yFromTop: number, w: number, h: number, color: PdfRgb) {
    const y = this.pdfY(yFromTop) - h;
    this.cmd(`${pdfColor(color)} rg`);
    this.cmd(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  }

  strokeRect(
    x: number,
    yFromTop: number,
    w: number,
    h: number,
    color: PdfRgb,
    width = 1
  ) {
    const y = this.pdfY(yFromTop) - h;
    this.cmd(`${pdfColor(color)} RG`);
    this.cmd(`${width} w`);
    this.cmd(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
  }

  roundedRect(
    x: number,
    yFromTop: number,
    w: number,
    h: number,
    r: number,
    fill?: PdfRgb,
    stroke?: PdfRgb,
    strokeWidth = 1
  ) {
    const radius = Math.min(r, w / 2, h / 2);
    const y = this.pdfY(yFromTop) - h;
    const c = radius * 0.5522847498;
    const x1 = x;
    const y1 = y;
    const x2 = x + w;
    const y2 = y + h;
    const path = [
      ` ${ (x1 + radius).toFixed(2) } ${y1.toFixed(2)} m`,
      ` ${ (x2 - radius).toFixed(2) } ${y1.toFixed(2)} l`,
      ` ${x2.toFixed(2)} ${y1.toFixed(2)} ${x2.toFixed(2)} ${(y1 + c).toFixed(2)} ${x2.toFixed(2)} ${(y1 + radius).toFixed(2)} c`,
      ` ${x2.toFixed(2)} ${(y2 - radius).toFixed(2)} l`,
      ` ${x2.toFixed(2)} ${y2.toFixed(2)} ${(x2 - c).toFixed(2)} ${y2.toFixed(2)} ${(x2 - radius).toFixed(2)} ${y2.toFixed(2)} c`,
      ` ${(x1 + radius).toFixed(2)} ${y2.toFixed(2)} l`,
      ` ${x1.toFixed(2)} ${y2.toFixed(2)} ${x1.toFixed(2)} ${(y2 - c).toFixed(2)} ${x1.toFixed(2)} ${(y2 - radius).toFixed(2)} c`,
      ` ${x1.toFixed(2)} ${(y1 + radius).toFixed(2)} l`,
      ` ${x1.toFixed(2)} ${y1.toFixed(2)} ${(x1 + c).toFixed(2)} ${y1.toFixed(2)} ${(x1 + radius).toFixed(2)} ${y1.toFixed(2)} c`,
      ` h`,
    ].join("");
    this.cmd(path.trim());
    if (fill && stroke) {
      this.cmd(`${pdfColor(fill)} rg`);
      this.cmd(`${pdfColor(stroke)} RG`);
      this.cmd(`${strokeWidth} w`);
      this.cmd("B");
    } else if (fill) {
      this.cmd(`${pdfColor(fill)} rg`);
      this.cmd("f");
    } else if (stroke) {
      this.cmd(`${pdfColor(stroke)} RG`);
      this.cmd(`${strokeWidth} w`);
      this.cmd("S");
    }
  }

  hline(x: number, yFromTop: number, w: number, color: PdfRgb, width = 0.6) {
    const y = this.pdfY(yFromTop);
    this.cmd(`${pdfColor(color)} RG`);
    this.cmd(`${width} w`);
    this.cmd(`${x.toFixed(2)} ${y.toFixed(2)} m ${(x + w).toFixed(2)} ${y.toFixed(2)} l S`);
  }

  text(
    x: number,
    yFromTop: number,
    value: string,
    opts: {
      size: number;
      font?: PdfFont;
      color: PdfRgb;
      align?: "left" | "right";
      maxWidth?: number;
    }
  ) {
    const font = opts.font ?? "sans";
    let drawn = value.replace(/\s+/g, " ").trimEnd();
    if (opts.maxWidth) {
      drawn = this.truncate(drawn, opts.maxWidth, opts.size, font);
    }
    let drawX = x;
    if (opts.align === "right") {
      drawX = x - this.measure(drawn, opts.size, font);
    }
    const baseline = this.pdfY(yFromTop);
    this.cmd("BT");
    this.cmd(`/${FONT_RES[font].name} ${opts.size} Tf`);
    this.cmd(`${pdfColor(opts.color)} rg`);
    this.cmd(`${drawX.toFixed(2)} ${baseline.toFixed(2)} Td`);
    this.cmd(`${encodeWinAnsi(drawn)} Tj`);
    this.cmd("ET");
  }

  measure(text: string, size: number, font: PdfFont = "sans"): number {
    return text.length * avgCharWidth(font, size);
  }

  truncate(text: string, maxWidth: number, size: number, font: PdfFont = "sans"): string {
    if (this.measure(text, size, font) <= maxWidth) return text;
    const ellipsis = "...";
    let cut = text;
    while (cut.length > 0 && this.measure(cut + ellipsis, size, font) > maxWidth) {
      cut = cut.slice(0, -1);
    }
    return cut + ellipsis;
  }

  wrap(
    text: string,
    maxWidth: number,
    size: number,
    font: PdfFont = "sans"
  ): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (this.measure(next, size, font) <= maxWidth) {
        current = next;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [""];
  }

  build(): Uint8Array {
    const encoder = new TextEncoder();
    const fontKeys = Object.keys(FONT_RES) as PdfFont[];
    const fontDict = fontKeys
      .map((key, i) => `/${FONT_RES[key].name} ${3 + i} 0 R`)
      .join(" ");

    const pageCount = this.pages.length;
    const firstPageObj = 7;
    const pageObjNums = this.pages.map((_, i) => firstPageObj + i * 2);

    const byNum = new Map<number, string>();
    byNum.set(1, "<< /Type /Catalog /Pages 2 0 R >>");
    byNum.set(
      2,
      `<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(" ")}] /Count ${pageCount} >>`
    );
    fontKeys.forEach((key, i) => {
      byNum.set(
        3 + i,
        `<< /Type /Font /Subtype /Type1 /BaseFont /${FONT_RES[key].base} /Encoding /WinAnsiEncoding >>`
      );
    });

    this.pages.forEach((cmds, i) => {
      const pageObj = pageObjNums[i];
      const contentObj = pageObj + 1;
      const stream = cmds.join("\n") + "\n";
      const streamBytes = encoder.encode(stream);
      byNum.set(
        pageObj,
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << ${fontDict} >> >> /Contents ${contentObj} 0 R >>`
      );
      byNum.set(
        contentObj,
        `<< /Length ${streamBytes.length} >>\nstream\n${stream}endstream`
      );
    });

    const header = "%PDF-1.4\n%\x80\x81\x82\x83\n";
    const maxObj = Math.max(...byNum.keys());
    const chunks: Uint8Array[] = [encoder.encode(header)];
    const offsets = [0];
    let offset = chunks[0].length;
    for (let n = 1; n <= maxObj; n++) {
      const body = byNum.get(n);
      if (!body) {
        throw new Error(`PDF object ${n} missing`);
      }
      offsets.push(offset);
      const objBytes = encoder.encode(`${n} 0 obj\n${body}\nendobj\n`);
      chunks.push(objBytes);
      offset += objBytes.length;
    }

    const xrefStart = offset;
    let xref = `xref\n0 ${maxObj + 1}\n0000000000 65535 f \n`;
    for (let n = 1; n <= maxObj; n++) {
      xref += `${String(offsets[n]).padStart(10, "0")} 00000 n \n`;
    }
    const trailer = `trailer\n<< /Size ${maxObj + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
    chunks.push(encoder.encode(xref + trailer));

    const pdf = new Uint8Array(chunks.reduce((sum, c) => sum + c.length, 0));
    let cursor = 0;
    for (const chunk of chunks) {
      pdf.set(chunk, cursor);
      cursor += chunk.length;
    }
    return pdf;
  }
}
