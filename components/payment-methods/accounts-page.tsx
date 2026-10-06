"use client";

import { useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/use-media-query";
import { AccountsCatalogDesktop, defaultSelection, walletOwners } from "./accounts-catalog-view";
import { AccountsMobile } from "./accounts-mobile";
import { NewMethodFlow } from "./new-method-flow";
import type { PaymentMethodCatalogItem } from "@/lib/payment-methods";

/** Raiz de la pagina Cuentas: catalogo (escritorio), pila Wallet (iPhone) y "Nuevo metodo" */
export function AccountsPage({
  items,
  suggestions,
  monthShort,
  monthLong,
}: {
  items: PaymentMethodCatalogItem[];
  suggestions: string[];
  monthShort: string;
  monthLong: string;
}) {
  const isMobile = useIsMobile();
  const [newOpen, setNewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(() => defaultSelection(items));
  const owners = useMemo(() => walletOwners(items), [items]);

  return (
    <>
      <AccountsMobile
        items={items}
        owners={owners}
        suggestions={suggestions}
        monthShort={monthShort}
        monthLong={monthLong}
        onNewMethod={() => setNewOpen(true)}
      />
      <div className="hidden px-6 pt-10 pb-16 md:block lg:px-12">
        <AccountsCatalogDesktop
          items={items}
          suggestions={suggestions}
          monthShort={monthShort}
          onNewMethod={() => setNewOpen(true)}
          selectedId={selectedId}
          onSelectedIdChange={setSelectedId}
        />
      </div>
      <NewMethodFlow
        open={newOpen}
        onOpenChange={setNewOpen}
        owners={owners}
        suggestions={suggestions}
        onCreated={setSelectedId}
        variant={isMobile ? "mobile" : "desktop"}
      />
    </>
  );
}
