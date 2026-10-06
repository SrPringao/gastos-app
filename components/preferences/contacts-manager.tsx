"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GroupBox } from "@/components/ui/eb/form-kit";
import { showToast } from "@/components/ui/eb/toast";
import { initialOf } from "@/lib/dashboard-metrics";
import { formatMoney } from "@/lib/utils/money";
import { cn } from "@/lib/utils";

export type ManagedContact = {
  id: number;
  name: string;
  archived: boolean;
  /** Positivos ligados y lo que suman (centavos) */
  entries: number;
  balance: number;
};

async function request(url: string, method: "PATCH" | "POST", body: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) return null;
  const data = await res.json().catch(() => null);
  return (data?.error as string) || "No se pudo guardar";
}

function ContactRow({ contact, others }: { contact: ManagedContact; others: ManagedContact[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(contact.name);
  const [mergeInto, setMergeInto] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<string | null>, message: string) {
    setBusy(true);
    setError(null);
    const failure = await action();
    setBusy(false);
    if (failure) {
      setError(failure);
      return;
    }
    showToast({ message });
    setEditing(false);
    router.refresh();
  }

  const target = others.find((o) => String(o.id) === mergeInto);
  const detail =
    contact.entries === 0
      ? "Sin positivos"
      : `${contact.entries} ${contact.entries === 1 ? "positivo" : "positivos"} · ${formatMoney(contact.balance)}`;

  return (
    <div className={cn("flex flex-col", contact.archived && "opacity-60")}>
      <div className="flex min-h-[52px] items-center gap-3 px-4">
        <span
          aria-hidden="true"
          className="flex size-[30px] flex-none items-center justify-center rounded-full text-[13px] font-semibold text-white"
          style={{ background: "linear-gradient(180deg, #6E6E75, #48484E)" }}
        >
          {initialOf(contact.name)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[16px]">{contact.name}</span>
          <span className="text-eb-text-tertiary text-[12px]">
            {contact.archived ? `Archivada · ${detail}` : detail}
          </span>
        </div>
        <button
          type="button"
          aria-expanded={editing}
          onClick={() => {
            setEditing((v) => !v);
            setName(contact.name);
            setError(null);
          }}
          className="text-eb-link py-2 pl-2 text-[15px]"
        >
          {editing ? "Listo" : "Editar"}
        </button>
      </div>

      {editing && (
        <div className="flex flex-col gap-3 px-4 pb-4">
          <div className="flex items-center gap-2">
            <input
              aria-label={`Nuevo nombre de ${contact.name}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-eb-text h-10 min-w-0 flex-1 rounded-[10px] border-0 px-3 text-[16px] outline-none"
              style={{ background: "var(--eb-ios-fill)" }}
            />
            <button
              type="button"
              disabled={busy || !name.trim() || name.trim() === contact.name}
              onClick={() =>
                run(() => request(`/api/contacts/${contact.id}`, "PATCH", { name }), "Nombre actualizado")
              }
              className="text-eb-link text-[15px] font-semibold disabled:opacity-40"
            >
              Renombrar
            </button>
          </div>

          {others.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                aria-label={`Fusionar ${contact.name} con`}
                value={mergeInto}
                onChange={(e) => setMergeInto(e.target.value)}
                className="text-eb-text h-10 min-w-0 flex-1 rounded-[10px] border-0 px-3 text-[16px] outline-none"
                style={{ background: "var(--eb-ios-fill)" }}
              >
                <option value="">Fusionar con…</option>
                {others.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy || !target}
                onClick={() =>
                  target &&
                  run(
                    () => request("/api/contacts/merge", "POST", { sourceId: contact.id, targetId: target.id }),
                    `${contact.name} se fusionó con ${target.name}`
                  )
                }
                className="text-eb-link text-[15px] font-semibold disabled:opacity-40"
              >
                Fusionar
              </button>
            </div>
          )}
          {target && (
            <p className="text-eb-text-tertiary text-[13px] leading-[1.4]">
              Los positivos de {contact.name} pasan a {target.name} y {contact.name} desaparece de la lista.
            </p>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(
                () => request(`/api/contacts/${contact.id}`, "PATCH", { archived: !contact.archived }),
                contact.archived ? `${contact.name} restaurada` : `${contact.name} archivada`
              )
            }
            className={cn("self-start text-[15px]", contact.archived ? "text-eb-link" : "text-eb-red")}
          >
            {contact.archived ? "Restaurar" : "Archivar"}
          </button>
          {error && <p className="text-eb-red text-[13px]">{error}</p>}
        </div>
      )}
    </div>
  );
}

/**
 * Administrar personas (expensebro-modales-prompt.md, 4.3): renombrar,
 * fusionar duplicados y archivar. Una persona archivada no aparece en los
 * chips de Patrimonio, pero sus positivos se conservan.
 */
export function ContactsManager({ contacts }: { contacts: ManagedContact[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personas</CardTitle>
        <p className="text-muted-foreground text-sm font-normal">
          Las personas que te deben en Patrimonio. Fusiona duplicados o archiva a quien ya no uses.
        </p>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aún no tienes personas guardadas. Se agregan desde Patrimonio, en “¿Quién te debe?”.
          </p>
        ) : (
          <GroupBox variant="mobile">
            {contacts.map((contact) => (
              <ContactRow
                key={contact.id}
                contact={contact}
                others={contacts.filter((c) => c.id !== contact.id)}
              />
            ))}
          </GroupBox>
        )}
      </CardContent>
    </Card>
  );
}
