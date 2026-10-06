"use client";

import { useState } from "react";
import { AccountsCatalogDesktop } from "./accounts-catalog-view";
import type { PaymentMethodCatalogItem } from "@/lib/payment-methods";

/** Raiz de la pagina Cuentas: catalogo y flujo "Nuevo metodo" */
export function AccountsPage({
  items,
  suggestions,
  monthShort,
}: {
  items: PaymentMethodCatalogItem[];
  suggestions: string[];
  monthShort: string;
}) {
  const [, setNewOpen] = useState(false);

  return (
    <div className="px-4 pt-6 pb-16 md:px-6 md:pt-10 lg:px-12">
      <AccountsCatalogDesktop
        items={items}
        suggestions={suggestions}
        monthShort={monthShort}
        onNewMethod={() => setNewOpen(true)}
      />
    </div>
  );
}
