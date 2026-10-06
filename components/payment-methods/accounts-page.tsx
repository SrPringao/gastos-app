"use client";

import { useMemo, useState } from "react";
import { AccountsCatalogDesktop, defaultSelection, walletOwners } from "./accounts-catalog-view";
import { NewMethodFlow } from "./new-method-flow";
import type { PaymentMethodCatalogItem } from "@/lib/payment-methods";

/** Raiz de la pagina Cuentas: catalogo, seleccion y flujo "Nuevo metodo" */
export function AccountsPage({
  items,
  suggestions,
  monthShort,
}: {
  items: PaymentMethodCatalogItem[];
  suggestions: string[];
  monthShort: string;
}) {
  const [newOpen, setNewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(() => defaultSelection(items));
  const owners = useMemo(() => walletOwners(items), [items]);

  return (
    <div className="px-4 pt-6 pb-16 md:px-6 md:pt-10 lg:px-12">
      <AccountsCatalogDesktop
        items={items}
        suggestions={suggestions}
        monthShort={monthShort}
        onNewMethod={() => setNewOpen(true)}
        selectedId={selectedId}
        onSelectedIdChange={setSelectedId}
      />
      <NewMethodFlow
        open={newOpen}
        onOpenChange={setNewOpen}
        owners={owners}
        suggestions={suggestions}
        onCreated={setSelectedId}
        variant="desktop"
      />
    </div>
  );
}
