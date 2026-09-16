"use client";

import { useState } from "react";
import { CheckIcon, FileDownIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DEFAULT_REPORT_OPTIONS,
  HISTORY_MONTH_OPTIONS,
  hasAnyReportSection,
  type PatrimonioReportOptions,
} from "@/lib/reports/report-options";

type SectionKey = keyof Pick<
  PatrimonioReportOptions,
  | "includePatrimonio"
  | "includeCurrentMonth"
  | "includeHistory"
  | "includeFixedExpenses"
>;

const SECTIONS: {
  key: SectionKey;
  title: string;
  description: string;
}[] = [
  {
    key: "includePatrimonio",
    title: "Patrimonio",
    description: "Positivos, deudas, neto y simulador de previstos.",
  },
  {
    key: "includeCurrentMonth",
    title: "Mes en curso",
    description: "Gastado, presupuesto y desglose por categoria y cuenta.",
  },
  {
    key: "includeHistory",
    title: "Historial de gastos",
    description: "Totales mes a mes, con presupuesto si lo tienes.",
  },
  {
    key: "includeFixedExpenses",
    title: "Gastos fijos",
    description: "Recurrentes del mes (renta, suscripciones, etc.).",
  },
];

export function PatrimonioReportCard() {
  const [options, setOptions] = useState<PatrimonioReportOptions>(
    DEFAULT_REPORT_OPTIONS
  );
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDownload = hasAnyReportSection(options);

  function toggle(key: SectionKey) {
    setOptions((current) => ({ ...current, [key]: !current[key] }));
    setError(null);
  }

  async function handleDownload() {
    if (!canDownload) {
      setError("Elige al menos una seccion");
      return;
    }
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch("/api/net-worth/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "No se pudo generar el PDF");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="([^"]+)"/);
      anchor.href = url;
      anchor.download = match?.[1] ?? "expensebro-reporte.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("No se pudo descargar el PDF");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reporte para Claude</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-muted-foreground text-sm">
          Elige que va en el PDF antes de generarlo. Lo adjuntas en el chat y
          sigues el analisis solo con las cifras que quieras compartir. Incluye
          montos reales aunque los tengas ocultos en esta pantalla.
        </p>

        <div className="space-y-2">
          {SECTIONS.map((section) => {
            const checked = options[section.key];
            return (
              <div key={section.key} className="space-y-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => toggle(section.key)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-[10px] border p-3 text-left transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    checked
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:bg-secondary/50"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background"
                    )}
                  >
                    {checked ? <CheckIcon className="size-3" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      {section.title}
                    </span>
                    <span className="text-muted-foreground mt-0.5 block text-xs">
                      {section.description}
                    </span>
                  </span>
                </button>

                {section.key === "includeHistory" && options.includeHistory ? (
                  <div className="flex flex-wrap items-center gap-2 pl-8">
                    <p className="text-muted-foreground text-xs">Meses</p>
                    {HISTORY_MONTH_OPTIONS.map((count) => (
                      <Button
                        key={count}
                        type="button"
                        size="xs"
                        variant={
                          options.historyMonths === count ? "default" : "outline"
                        }
                        onClick={() =>
                          setOptions((current) => ({
                            ...current,
                            historyMonths: count,
                          }))
                        }
                      >
                        {count}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button
          type="button"
          onClick={handleDownload}
          disabled={downloading || !canDownload}
          className="gap-1.5"
        >
          <FileDownIcon className="size-4" />
          {downloading ? "Generando PDF..." : "Descargar PDF"}
        </Button>
      </CardContent>
    </Card>
  );
}
