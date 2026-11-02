"use client";

import { useId, useMemo, useState } from "react";
import { ActionSheet, EbSheet } from "@/components/ui/eb/sheet";
import {
  AmountHero,
  FormSection,
  GroupBox,
  MethodPickerRow,
  Segmented,
  SwitchRow,
  TextRow,
  centsToAmountInput,
  parseAmount,
  type PickerMethod,
} from "@/components/ui/eb/form-kit";
import { ContactChips, type ContactOption } from "@/components/net-worth/contact-chips";
import { PaymentDayRow } from "@/components/payment-methods/method-form";
import { DateRow } from "@/components/ui/eb/date-row";
import { showToast } from "@/components/ui/eb/toast";
import {
  daysBetween,
  inferAssetKind,
  isCurrentCutPaid,
  nextPaymentDate,
  resolveAssetKind,
  type AssetKind,
} from "@/lib/dashboard-metrics";
import { dbDateToInputValue, formatDayMonth, todayDateString } from "@/lib/utils/dates";
import { formatMoney } from "@/lib/utils/money";
import type { Account, Contact, NetWorthEntry } from "@/lib/db/schema";

type Kind = "asset" | "debt";

const SECTION_OPTIONS: { value: AssetKind; label: string }[] = [
  { value: "account", label: "Cuenta" },
  { value: "receivable", label: "Te deben" },
  { value: "income", label: "Por recibir" },
];

const SECTION_LABEL: Record<AssetKind, string> = {
  account: "Cuenta",
  receivable: "Te deben",
  income: "Por recibir",
};

const DOT: Record<Kind, string> = { asset: "var(--eb-green)", debt: "var(--eb-red)" };

type Draft = {
  kind: Kind;
  amount: string;
  label: string;
  assetKind: AssetKind;
  contactId: number | null;
  accountId: number | null;
  syncEnabled: boolean;
  /** yyyy-mm-dd; solo deudas sin tarjeta de credito */
  dueDate: string;
  /** Dia de pago de la tarjeta ligada (vive en la cuenta, no en el elemento) */
  paymentDay: number | null;
  /** El corte que toca pagar ahora ya se pago (tambien vive en la cuenta) */
  cutPaid: boolean;
};

function initialDraft(entry: NetWorthEntry | undefined, kind: Kind, accounts: Account[]): Draft {
  if (entry) {
    const account = accounts.find((a) => a.id === entry.accountId);
    return {
      kind: entry.kind,
      amount: centsToAmountInput(entry.amount),
      label: entry.label,
      assetKind: resolveAssetKind(entry),
      contactId: entry.contactId ?? null,
      accountId: entry.accountId ?? null,
      syncEnabled: entry.syncEnabled,
      dueDate: entry.dueDate ? dbDateToInputValue(entry.dueDate) : "",
      paymentDay: account?.paymentDay ?? null,
      cutPaid: account ? isCurrentCutPaid(account, todayDateString()) : false,
    };
  }
  return {
    kind,
    amount: "",
    label: "",
    assetKind: "receivable",
    contactId: null,
    accountId: null,
    syncEnabled: false,
    dueDate: "",
    paymentDay: null,
    cutPaid: false,
  };
}

function daysText(days: number): string {
  if (days === 0) return "hoy";
  if (days === 1) return "mañana";
  return `en ${days} días`;
}

/**
 * Nuevo / Editar elemento de Patrimonio (expensebro-modales-prompt.md,
 * seccion 3). Montalo con `key` distinto por apertura para reiniciar el
 * formulario.
 */
export function PatrimonioEntrySheet({
  open,
  onClose,
  entry,
  initialKind = "asset",
  accounts,
  entries,
  contacts,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  /** Con entry: modo Editar */
  entry?: NetWorthEntry;
  /** Tipo preseleccionado al crear (Debo si se abrio desde Deudas) */
  initialKind?: Kind;
  accounts: Account[];
  /** Todos los elementos de Patrimonio (saldos por persona, metodos ocupados) */
  entries: NetWorthEntry[];
  contacts: Contact[];
  onSaved: () => void;
}) {
  const isEditing = !!entry;
  const [initial] = useState(() => initialDraft(entry, initialKind, accounts));
  const [draft, setDraft] = useState<Draft>(initial);
  // Mientras el usuario no elija seccion, se infiere del nombre y el metodo
  const [sectionTouched, setSectionTouched] = useState(isEditing);
  const [createdContacts, setCreatedContacts] = useState<Contact[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const syncId = useId();
  const cutPaidId = useId();
  const today = todayDateString();

  const amountCents = parseAmount(draft.amount);
  const method = accounts.find((a) => a.id === draft.accountId) ?? null;
  const isCreditDebt = draft.kind === "debt" && method?.type === "credit";
  const showContacts = draft.kind === "asset" && draft.assetKind === "receivable";

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const valid = isEditing
    ? dirty && draft.label.trim() !== "" && amountCents !== null
    : draft.label.trim() !== "" && amountCents !== null && amountCents > 0;

  const methods: PickerMethod[] = useMemo(
    () =>
      accounts
        .filter((a) => !a.archivedAt || a.id === draft.accountId)
        .map((a) => ({ id: a.id, name: a.name, type: a.type, color: a.color })),
    [accounts, draft.accountId]
  );

  // Cada metodo tiene a lo mas un elemento en Patrimonio
  const unavailable = useMemo(
    () =>
      new Map(
        entries
          .filter((e) => e.accountId != null && e.id !== entry?.id)
          .map((e) => [e.accountId as number, e.label])
      ),
    [entries, entry?.id]
  );

  const contactOptions: ContactOption[] = useMemo(() => {
    const all = [...contacts, ...createdContacts.filter((c) => !contacts.some((x) => x.id === c.id))];
    return all
      .filter((c) => !c.archivedAt || c.id === draft.contactId)
      .map((c) => {
        const own = entries.filter(
          (e) => e.kind === "asset" && e.contactId === c.id && resolveAssetKind(e) === "receivable" && e.id !== entry?.id
        );
        return {
          id: c.id,
          name: c.name,
          balance: own.reduce((sum, e) => sum + e.amount, 0),
          // Ultimo cambio de sus positivos; sin positivos, cuando se creo
          lastUsed:
            own.length > 0
              ? Math.max(...own.map((e) => new Date(e.updatedAt).getTime()))
              : new Date(c.createdAt).getTime(),
        };
      });
  }, [contacts, createdContacts, entries, entry?.id, draft.contactId]);

  function update(next: Partial<Draft>) {
    setDraft((d) => {
      const merged = { ...d, ...next };
      if (!sectionTouched && merged.kind === "asset") {
        merged.assetKind = inferAssetKind({ label: merged.label, accountId: merged.accountId });
      }
      return merged;
    });
  }

  function pickMethod(id: number | null) {
    const previous = method?.name ?? null;
    const nextMethod = accounts.find((a) => a.id === id) ?? null;
    const label = draft.label.trim();
    // El nombre se llena con el metodo si estaba vacio o era el del metodo anterior
    const autoName = nextMethod && (label === "" || (previous !== null && label === previous));
    update({
      accountId: id,
      label: autoName ? nextMethod.name : draft.label,
      syncEnabled: id === null ? false : draft.syncEnabled,
      paymentDay: nextMethod?.paymentDay ?? null,
      cutPaid: nextMethod ? isCurrentCutPaid(nextMethod, today) : false,
    });
  }

  async function save() {
    if (!valid || amountCents === null) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        label: draft.label.trim(),
        kind: draft.kind,
        accountId: draft.accountId,
        amount: amountCents,
        // Con tarjeta de credito la fecha sale de su dia de pago
        dueDate: draft.kind === "debt" && !isCreditDebt && draft.dueDate ? draft.dueDate : null,
        syncEnabled: draft.accountId !== null && draft.syncEnabled,
        ...(draft.kind === "asset" && {
          assetKind: draft.assetKind,
          contactId: draft.assetKind === "receivable" ? draft.contactId : null,
        }),
      };
      // Dia de pago y corte pagado son de la tarjeta: se guardan en la cuenta
      // y los ven Cuentas, Proximos pagos y el Dashboard
      const paymentDayChanged = draft.paymentDay !== (method?.paymentDay ?? null);
      const cutPaidChanged = method ? draft.cutPaid !== isCurrentCutPaid(method, today) : false;
      if (isCreditDebt && method && (paymentDayChanged || cutPaidChanged)) {
        const accountRes = await fetch(`/api/accounts/${method.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentDay: draft.paymentDay,
            paidDueDate: draft.cutPaid && currentCut ? currentCut : null,
          }),
        });
        if (!accountRes.ok) {
          const data = await accountRes.json().catch(() => null);
          setError(data?.error || "Error al guardar el día de pago");
          return;
        }
      }
      const res = await fetch(isEditing ? `/api/net-worth/entries/${entry.id}` : "/api/net-worth/entries", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Error al guardar");
        return;
      }
      showToast({ message: isEditing ? "Cambios guardados" : `${payload.label} agregado` });
      onClose();
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!entry) return;
    setConfirmDelete(false);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/net-worth/entries/${entry.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Error al eliminar");
        return;
      }
      showToast({ message: `${entry.label} eliminado` });
      onClose();
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  // --- Monto -------------------------------------------------------------
  const tint = draft.kind === "asset" ? "green" : "red";
  const heroLabel = isEditing ? (
    <>
      <span aria-hidden="true" className="size-[7px] rounded-full" style={{ background: DOT[draft.kind] }} />
      {draft.kind === "asset" ? `Saldo · ${SECTION_LABEL[draft.assetKind]}` : "Deuda"}
    </>
  ) : (
    "Monto"
  );
  const defaultFooter = draft.kind === "asset" ? "Suma a tu patrimonio" : "Resta a tu patrimonio";
  let heroFooter: React.ReactNode = defaultFooter;
  if (isEditing && amountCents !== null && amountCents !== entry.amount) {
    const diff = amountCents - entry.amount;
    heroFooter = (
      <>
        Antes {formatMoney(entry.amount)} ·{" "}
        <b className="font-semibold" style={{ color: diff > 0 ? "var(--eb-green)" : "var(--eb-red)" }}>
          {diff > 0 ? "+" : "−"}
          {formatMoney(Math.abs(diff))}
        </b>
      </>
    );
  }

  // --- Fecha de pago (deuda con tarjeta) ---------------------------------
  // currentCut: la fecha que toca pagar ahora, sin saltar el corte pagado
  const currentCut = isCreditDebt && draft.paymentDay ? nextPaymentDate(draft.paymentDay, today) : null;
  const followingCut =
    currentCut && draft.paymentDay ? nextPaymentDate(draft.paymentDay, today, currentCut) : null;
  let paymentSubtitle = "También se cambia en la tarjeta";
  if (currentCut && followingCut) {
    const due = draft.cutPaid ? followingCut : currentCut;
    paymentSubtitle = `Próximo pago ${daysText(daysBetween(today, due))} · también en la tarjeta`;
  }

  const methodName = method?.name ?? "el método";
  const syncFooter = !method
    ? "Elige un método de pago para activarla."
    : draft.kind === "asset"
      ? `Si lo activas, cada gasto nuevo con ${methodName} se resta de este saldo.`
      : `Cada gasto nuevo con ${methodName} sube esta deuda automáticamente.`;

  return (
    <>
      <EbSheet
        open={open}
        onClose={onClose}
        title={isEditing ? entry.label : "Nuevo"}
        ariaLabel={
          isEditing ? `Editar ${entry.label}` : draft.kind === "asset" ? "Nuevo en Patrimonio" : "Nueva deuda"
        }
        dirty={dirty}
        action={{
          label: saving ? "Guardando..." : isEditing ? "Guardar" : "Agregar",
          onClick: save,
          disabled: !valid || saving,
        }}
      >
        {!isEditing && (
          <Segmented<Kind>
            ariaLabel="Tipo"
            size="type"
            value={draft.kind}
            onChange={(kind) => update({ kind })}
            options={[
              { value: "asset", label: "Tengo", dot: DOT.asset },
              { value: "debt", label: "Debo", dot: DOT.debt },
            ]}
          />
        )}

        <AmountHero
          label={heroLabel}
          value={draft.amount}
          onChange={(amount) => update({ amount })}
          tint={tint}
          footer={heroFooter}
        />

        <FormSection variant="mobile">
          <GroupBox variant="mobile">
            <TextRow
              label="Nombre"
              value={draft.label}
              placeholder="Ej: Nu, Sueldo, iPad"
              onChange={(label) => update({ label })}
            />
            {draft.kind === "asset" && (
              <div className="flex flex-col gap-2.5 px-4 pt-2.5 pb-3">
                <span className="text-[16px]">Sección</span>
                <Segmented<AssetKind>
                  ariaLabel="Sección"
                  value={draft.assetKind}
                  onChange={(assetKind) => {
                    setSectionTouched(true);
                    setDraft((d) => ({ ...d, assetKind }));
                  }}
                  options={SECTION_OPTIONS}
                />
              </div>
            )}
          </GroupBox>
        </FormSection>

        {showContacts && (
          <ContactChips
            options={contactOptions}
            value={draft.contactId}
            onChange={(contactId) => update({ contactId })}
            onCreated={(contact) => setCreatedContacts((list) => [...list, contact])}
            amountCents={amountCents ?? 0}
          />
        )}

        <FormSection
          variant="mobile"
          footer={
            isCreditDebt
              ? "El día de pago y el corte pagado son de la tarjeta: también se actualizan en Cuentas y Próximos pagos."
              : "Opcional. Lígalo a una cuenta para poder sincronizarlo con tus gastos."
          }
        >
          <GroupBox variant="mobile">
            <MethodPickerRow
              methods={methods}
              value={draft.accountId}
              onChange={pickMethod}
              unavailable={unavailable}
            />
            {isCreditDebt && (
              <PaymentDayRow
                variant="mobile"
                value={draft.paymentDay}
                onChange={(paymentDay) => update({ paymentDay })}
                subtitle={paymentSubtitle}
              />
            )}
            {currentCut && followingCut && (
              <SwitchRow
                id={cutPaidId}
                label="Ya pagué este corte"
                subtitle={
                  draft.cutPaid
                    ? `Pago del ${formatDayMonth(currentCut)} listo · sigue el ${formatDayMonth(followingCut)}`
                    : `El del ${formatDayMonth(currentCut)}; lo que quede pasa al ${formatDayMonth(followingCut)}`
                }
                checked={draft.cutPaid}
                onChange={(cutPaid) => update({ cutPaid })}
              />
            )}
            {draft.kind === "debt" && !isCreditDebt && (
              <DateRow
                label="Fecha límite"
                subtitle="Opcional"
                placeholder="Sin fecha"
                value={draft.dueDate}
                onChange={(dueDate) => update({ dueDate })}
                shortcuts={false}
                clearable
              />
            )}
          </GroupBox>
        </FormSection>

        <FormSection variant="mobile" footer={syncFooter}>
          <GroupBox variant="mobile">
            <SwitchRow
              id={syncId}
              label="Sincronizar con gastos"
              checked={draft.accountId !== null && draft.syncEnabled}
              onChange={(syncEnabled) => update({ syncEnabled })}
              disabled={draft.accountId === null}
            />
          </GroupBox>
        </FormSection>

        {isEditing && (
          <GroupBox variant="mobile">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
              className="text-eb-red min-h-12 w-full px-4 text-center text-[16px]"
            >
              Eliminar de Patrimonio
            </button>
          </GroupBox>
        )}

        {error && <p className="text-eb-red px-4 text-[14px]">{error}</p>}
      </EbSheet>

      <ActionSheet
        open={confirmDelete}
        message={isEditing ? `¿Eliminar "${entry.label}" de Patrimonio? Esta acción no se puede deshacer.` : undefined}
        actions={[{ label: "Eliminar", destructive: true, onSelect: remove }]}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
