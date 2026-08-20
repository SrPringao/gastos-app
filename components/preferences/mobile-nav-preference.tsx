"use client";

import { CheckIcon, ChevronDownIcon, ChevronUpIcon, XIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/components/preferences-provider";
import {
  allMobileNavCandidates,
  quickActions,
  resolveMobileNavEntries,
  DEFAULT_MOBILE_NAV_HREFS,
  type NavItem,
  type QuickAction,
} from "@/lib/nav-config";

const MAX_ITEMS = 5;

type Candidate =
  | { id: string; kind: "section"; item: NavItem }
  | { id: string; kind: "action"; item: QuickAction };

const sectionCandidates: Candidate[] = allMobileNavCandidates.map((item) => ({
  id: item.href,
  kind: "section",
  item,
}));

const actionCandidates: Candidate[] = quickActions.map((action) => ({
  id: action.id,
  kind: "action",
  item: action,
}));

const allCandidates: Candidate[] = [...sectionCandidates, ...actionCandidates];

/**
 * Elige que aparece en la tab bar movil (0 a 5): secciones del sidebar y/o
 * funciones rapidas. El orden se edita en la lista "En la barra". Con 0
 * items la barra no se muestra. Persiste en user_preferences.
 */
export function MobileNavPreference() {
  const { mobileNavHrefs, setMobileNavHrefs } = usePreferences();
  const selected = resolveMobileNavEntries(mobileNavHrefs).map((entry) =>
    entry.type === "action" ? entry.action.id : entry.item.href
  );

  function add(id: string) {
    if (selected.includes(id) || selected.length >= MAX_ITEMS) return;
    setMobileNavHrefs([...selected, id]);
  }

  function remove(id: string) {
    setMobileNavHrefs(selected.filter((s) => s !== id));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= selected.length) return;
    const next = [...selected];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setMobileNavHrefs(next);
  }

  const isDefault =
    !mobileNavHrefs ||
    (mobileNavHrefs.length === DEFAULT_MOBILE_NAV_HREFS.length &&
      mobileNavHrefs.every((h, i) => h === DEFAULT_MOBILE_NAV_HREFS[i]));

  const selectedCount = selected.length;
  const atMax = selectedCount >= MAX_ITEMS;

  function candidateLabel(candidate: Candidate) {
    return candidate.item.label;
  }

  function renderCatalog(candidates: Candidate[]) {
    const available = candidates.filter((c) => !selected.includes(c.id));

    if (available.length === 0) {
      return (
        <p className="text-muted-foreground px-1 py-3 text-sm">
          Ya estan todas en la barra. Quita una arriba para agregar otra.
        </p>
      );
    }

    return (
      <div className="space-y-1">
        {available.map((candidate) => {
          const { id, item } = candidate;
          return (
            <button
              key={id}
              type="button"
              onClick={() => add(id)}
              disabled={atMax}
              className={cn(
                "hover:bg-secondary/60 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              )}
            >
              <span className="bg-secondary text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                <item.icon className="size-4" />
              </span>
              <span className="flex-1 text-sm font-medium">{candidateLabel(candidate)}</span>
              <span className="text-muted-foreground text-xs">
                {atMax ? "Barra llena" : "Agregar"}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu rapido</CardTitle>
        <p className="text-muted-foreground text-sm font-normal">
          Hasta {MAX_ITEMS} elementos. En el celular es la barra inferior; en
          escritorio, un rayo abajo a la derecha. Si la dejas vacia, no aparece
          en ninguno.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div>
          <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
            <p className="text-sm font-medium">En la barra</p>
            <p className="text-muted-foreground font-figures text-xs">
              {selectedCount} de {MAX_ITEMS}
            </p>
          </div>
          <ol className="space-y-1">
            {selected.length === 0 && (
              <li className="text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-sm">
                Sin elementos. El menu rapido no se muestra.
              </li>
            )}
            {selected.map((id, index) => {
              const candidate = allCandidates.find((c) => c.id === id);
              if (!candidate) return null;
              const { item } = candidate;
              const isFirst = index === 0;
              const isLast = index === selected.length - 1;

              return (
                <li
                  key={id}
                  className="border-border bg-background/50 flex items-center gap-2 rounded-lg border px-2 py-1.5"
                >
                  <span className="bg-primary text-primary-foreground font-figures flex size-5 shrink-0 items-center justify-center rounded-full text-xs">
                    {index + 1}
                  </span>
                  <span className="bg-secondary text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                    <item.icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {candidateLabel(candidate)}
                  </span>
                  <div className="flex shrink-0 items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => move(index, -1)}
                      disabled={isFirst}
                      aria-label={`Subir ${candidateLabel(candidate)}`}
                    >
                      <ChevronUpIcon />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => move(index, 1)}
                      disabled={isLast}
                      aria-label={`Bajar ${candidateLabel(candidate)}`}
                    >
                      <ChevronDownIcon />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => remove(id)}
                      aria-label={`Quitar ${candidateLabel(candidate)}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <XIcon />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div>
          <p className="mb-2 px-1 text-sm font-medium">Agregar a la barra</p>
          <Tabs defaultValue="sections">
            <TabsList className="mb-3 grid w-full grid-cols-2">
              <TabsTrigger value="sections">Secciones</TabsTrigger>
              <TabsTrigger value="actions">Funciones rapidas</TabsTrigger>
            </TabsList>
            <TabsContent value="sections">{renderCatalog(sectionCandidates)}</TabsContent>
            <TabsContent value="actions">{renderCatalog(actionCandidates)}</TabsContent>
          </Tabs>
        </div>

        {isDefault && (
          <p className="text-muted-foreground flex items-center gap-1.5 px-1 text-xs">
            <CheckIcon className="size-3.5" />
            Usando el orden por defecto: Inicio, Gastos, Cuentas, Configuracion.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
