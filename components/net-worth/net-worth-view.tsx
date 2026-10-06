"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownIcon,
  BanknoteIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { EbCard } from "@/components/ui/eb/card";
import { Money } from "@/components/ui/eb/money";
import { CategoryTile } from "@/components/ui/eb/category-tile";
import { SegmentedBar } from "@/components/ui/eb/segmented-bar";
import { GroupHeader } from "@/components/ui/eb/grouped-list";
import { PageGlow } from "@/components/ui/eb/page-glow";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PRIVATE_MASK, usePrivacy } from "@/components/privacy";
import { EntryFormDialog } from "@/components/net-worth/entry-form-dialog";
import { ProjectionDialog } from "@/components/net-worth/projection-dialog";
import { accountTone } from "@/lib/account-colors";
import {
  debtCycleProgress,
  daysBetween,
  groupReceivables,
  initialOf,
  resolveAssetKind,
  effectiveDueDate,
} from "@/lib/dashboard-metrics";
import { formatMoney } from "@/lib/utils/money";
import { todayDateString } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";
import type { Account, NetWorthEntry, NetWorthProjection } from "@/lib/db/schema";

type DialogState =
  | { type: "entry"; kind: "asset" | "debt"; entry?: NetWorthEntry }
  | { type: "projection"; projection?: NetWorthProjection }
  | null;

// ---------------------------------------------------------------------------
// Piezas visuales
// ---------------------------------------------------------------------------

/** Tile de 30px con el color de la cuenta y su inicial ("Nu", "R") */
function AccountTile({ label, account }: { label: string; account?: Account }) {
  if (account?.type === "cash") {
    return <CategoryTile color="green" icon={BanknoteIcon} size={30} />;
  }
  const firstWord = label.trim().split(/\s+/)[0] ?? "";
  const text = firstWord.length <= 2 ? firstWord : initialOf(label);
  if (!account) return <CategoryTile color="gray" label={text} size={30} />;
  const tone = accountTone(account.color);
  return (
    <div
      aria-hidden="true"
      className="flex size-[30px] flex-none items-center justify-center rounded-[8px] text-[12px] font-bold text-white"
      style={{
        background: `linear-gradient(145deg, ${tone.light}, ${tone.dark})`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28)",
      }}
    >
      {text}
    </div>
  );
}

function PersonAvatar({ name }: { name: string }) {
  return (
    <div
      aria-hidden="true"
      className="text-eb-text flex size-[30px] flex-none items-center justify-center rounded-full text-[13px] font-semibold"
      style={{
        background: "linear-gradient(180deg, #6E6E75, #48484E)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
        color: "#fff",
      }}
    >
      {initialOf(name)}
    </div>
  );
}

function IconAction({
  label,
  onClick,
  disabled,
  tone = "neutral",
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "destructive";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex size-[30px] items-center justify-center rounded-[9px] disabled:opacity-30",
        tone === "destructive"
          ? "text-eb-red bg-[rgba(255,105,97,0.14)]"
          : "text-eb-text-muted bg-[var(--eb-glass-strong)]"
      )}
    >
      {children}
    </button>
  );
}

/** Acciones de escritorio (solo en hover): ordenar, editar, borrar */
type RowActions = {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  name: string;
};

function HoverActions({ actions }: { actions: RowActions }) {
  return (
    <div className="eb-row-actions hidden items-center gap-1.5 md:flex">
      {(actions.onMoveUp || actions.onMoveDown) && (
        <>
          <IconAction label={`Subir ${actions.name}`} onClick={() => actions.onMoveUp?.()} disabled={!actions.onMoveUp}>
            <ChevronUpIcon size={14} strokeWidth={2.2} />
          </IconAction>
          <IconAction label={`Bajar ${actions.name}`} onClick={() => actions.onMoveDown?.()} disabled={!actions.onMoveDown}>
            <ChevronDownIcon size={14} strokeWidth={2.2} />
          </IconAction>
        </>
      )}
      <IconAction label={`Editar ${actions.name}`} onClick={actions.onEdit}>
        <PencilIcon size={14} strokeWidth={2} />
      </IconAction>
      <IconAction label={`Eliminar ${actions.name}`} onClick={actions.onDelete} tone="destructive">
        <Trash2Icon size={14} strokeWidth={2} />
      </IconAction>
    </div>
  );
}

/**
 * Fila de Patrimonio (52px, 60px con detalle). Tocar la fila abre la
 * edicion; en escritorio ademas aparecen acciones con hover.
 */
function NetWorthRow({
  leading,
  title,
  subtitle,
  detail,
  trailing,
  onActivate,
  actions,
  tall = false,
  indent = false,
  titleClassName,
  ariaExpanded,
  entryId,
}: {
  leading: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  detail?: React.ReactNode;
  trailing?: React.ReactNode;
  onActivate?: () => void;
  actions?: RowActions;
  tall?: boolean;
  indent?: boolean;
  titleClassName?: string;
  ariaExpanded?: boolean;
  /** Ancla para "Ver en Patrimonio" desde Cuentas (?entry=<id>) */
  entryId?: number;
}) {
  const interactive = !!onActivate;
  return (
    <div
      id={entryId ? `nw-entry-${entryId}` : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-expanded={ariaExpanded}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate?.();
        }
      }}
      className={cn(
        "eb-row flex items-center gap-3 px-4 outline-none focus-visible:bg-[var(--eb-fill-subtle)]",
        tall ? "min-h-[60px]" : "min-h-[52px]",
        interactive && "cursor-pointer",
        indent && "pl-14"
      )}
    >
      {leading}
      <div className="eb-row-body border-eb-separator flex min-w-0 flex-1 items-center gap-2 self-stretch border-b">
        <div className={cn("flex min-w-0 flex-1 flex-col", detail ? "gap-1 py-2" : "py-1.5")}>
          <span className={cn("truncate text-[16px]", titleClassName)}>{title}</span>
          {subtitle && <span className="text-eb-text-tertiary truncate text-[13px]">{subtitle}</span>}
          {detail}
        </div>
        {actions && <HoverActions actions={actions} />}
        {trailing && <div className="ml-1 shrink-0 text-right">{trailing}</div>}
      </div>
    </div>
  );
}

function Section({
  title,
  total,
  children,
  footer,
}: {
  title: string;
  total?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <GroupHeader className="px-4" trailing={total}>
        {title}
      </GroupHeader>
      <EbCard
        size="list-sm"
        as="div"
        className="overflow-hidden md:rounded-[22px] [&>.eb-row:last-child_.eb-row-body]:border-b-0 [&>div>.eb-row:last-child_.eb-row-body]:border-b-0"
      >
        {children}
      </EbCard>
      {footer}
    </section>
  );
}

function dueText(days: number): string {
  if (days < 0) return `Venció hace ${Math.abs(days)} ${Math.abs(days) === 1 ? "día" : "días"}`;
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence mañana";
  return `Vence en ${days} días`;
}

// ---------------------------------------------------------------------------
// Vista
// ---------------------------------------------------------------------------

export function NetWorthView({
  accounts,
  entries,
  projections,
  highlightEntryId,
}: {
  accounts: Account[];
  entries: NetWorthEntry[];
  projections: NetWorthProjection[];
  /** Item a resaltar al llegar desde Cuentas ("Ver en Patrimonio") */
  highlightEntryId?: number;
}) {
  const router = useRouter();
  const { hidden, toggle: toggleHidden } = usePrivacy("netWorth");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [view, setView] = useState<"today" | "projected">("today");
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    // Si el item resaltado esta dentro de un grupo colapsado, se abre
    const target = entries.find((e) => e.id === highlightEntryId);
    if (!target) return {};
    if (target.kind === "debt" && target.amount === 0) return { zeroDebts: true };
    const contact = target.contact?.trim().toLocaleLowerCase("es-MX");
    return contact ? { [`contact-${contact}`]: true } : {};
  });

  useEffect(() => {
    if (!highlightEntryId) return;
    const el = document.getElementById(`nw-entry-${highlightEntryId}`);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.classList.add("eb-highlight");
    const timer = window.setTimeout(() => el.classList.remove("eb-highlight"), 2400);
    return () => window.clearTimeout(timer);
  }, [highlightEntryId]);
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const today = todayDateString();

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  // Los dias restantes de una deuda salen del dia de pago de su tarjeta
  const paymentDayByAccount = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.paymentDay])),
    [accounts]
  );
  const assets = entries.filter((e) => e.kind === "asset");
  const debts = entries.filter((e) => e.kind === "debt");
  const accountEntries = assets.filter((e) => resolveAssetKind(e) === "account");
  const receivables = groupReceivables(assets.filter((e) => resolveAssetKind(e) === "receivable"));
  const incomes = assets.filter((e) => resolveAssetKind(e) === "income");
  const activeDebts = debts.filter((e) => e.amount > 0);
  const zeroDebts = debts.filter((e) => e.amount === 0);

  const totalAssets = assets.reduce((sum, e) => sum + e.amount, 0);
  const totalDebts = debts.reduce((sum, e) => sum + e.amount, 0);
  const totalAccounts = accountEntries.reduce((sum, e) => sum + e.amount, 0);
  const net = totalAssets - totalDebts;
  const totalProjected = projections.reduce((sum, p) => sum + p.amount, 0);
  const netProjected = net - totalProjected;
  const heroValue = view === "today" ? net : netProjected;
  const positiveShare = totalAssets + totalDebts > 0 ? (totalAssets / (totalAssets + totalDebts)) * 100 : 0;

  const money = (cents: number, options?: Parameters<typeof formatMoney>[1]) =>
    hidden ? PRIVATE_MASK : formatMoney(cents, options);

  function refresh() {
    router.refresh();
  }

  async function deleteEntry(entry: NetWorthEntry) {
    setBusy(true);
    try {
      await fetch(`/api/net-worth/entries/${entry.id}`, { method: "DELETE" });
      refresh();
    } finally {
      setBusy(false);
    }
  }

  /**
   * Mueve una entrada dentro de su seccion: intercambia su lugar con el
   * vecino de la seccion dentro del orden global de su tipo (positivo/deuda).
   */
  async function move(section: NetWorthEntry[], index: number, direction: -1 | 1) {
    const neighbor = section[index + direction];
    const current = section[index];
    if (!neighbor || busy) return;
    const global = (current.kind === "asset" ? assets : debts).map((e) => e.id);
    const a = global.indexOf(current.id);
    const b = global.indexOf(neighbor.id);
    [global[a], global[b]] = [global[b], global[a]];
    setBusy(true);
    try {
      await fetch("/api/net-worth/entries/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: global }),
      });
      refresh();
    } finally {
      setBusy(false);
    }
  }

  function rowActions(section: NetWorthEntry[], index: number): RowActions {
    const entry = section[index];
    return {
      name: entry.label,
      onMoveUp: index > 0 ? () => move(section, index, -1) : undefined,
      onMoveDown: index < section.length - 1 ? () => move(section, index, 1) : undefined,
      onEdit: () => setDialog({ type: "entry", kind: entry.kind, entry }),
      onDelete: () => deleteEntry(entry),
    };
  }

  const edit = (entry: NetWorthEntry) => () => setDialog({ type: "entry", kind: entry.kind, entry });

  function debtRow(entry: NetWorthEntry, section: NetWorthEntry[], index: number, indent = false) {
    const due = effectiveDueDate(entry, paymentDayByAccount, today);
    const days = due ? daysBetween(today, due) : null;
    const soon = days !== null && days <= 16;
    return (
      <NetWorthRow
        key={entry.id}
        tall={!!due}
        indent={indent}
        leading={<AccountTile label={entry.label} account={entry.accountId ? accountById.get(entry.accountId) : undefined} />}
        title={entry.label}
        detail={
          due && days !== null ? (
            <>
              <div
                className="h-1 w-[120px] overflow-hidden rounded-[2px]"
                style={{ background: "var(--eb-mini-track)" }}
                role="img"
                aria-label={`${Math.round(debtCycleProgress(due, today) * 100)} % del ciclo transcurrido`}
              >
                <div
                  className="h-full"
                  style={{
                    width: `${Math.round(debtCycleProgress(due, today) * 100)}%`,
                    background: soon ? "#FF9F0A" : "#8E8E93",
                  }}
                />
              </div>
              <span className={cn("text-[13px]", soon ? "text-eb-orange" : "text-eb-text-tertiary")}>
                {dueText(days)}
              </span>
            </>
          ) : undefined
        }
        trailing={<Money value={entry.amount} private="netWorth" className="text-[16px] font-medium" />}
        onActivate={edit(entry)}
        entryId={entry.id}
        actions={rowActions(section, index)}
      />
    );
  }

  const nearestZero = zeroDebts
    .map((e) => ({ entry: e, due: effectiveDueDate(e, paymentDayByAccount, today) }))
    .filter((x): x is { entry: NetWorthEntry; due: string } => x.due !== null)
    .map(({ entry, due }) => ({ entry, days: daysBetween(today, due) }))
    .sort((a, b) => a.days - b.days)[0];

  const hero = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="text-eb-text-secondary text-[15px]">
          {view === "today" ? "Neto después de pagos" : "Neto con previstos"}
        </div>
        <Money value={heroValue} size="hero-net" private="netWorth" className="md:hidden" />
        <Money value={heroValue} size="hero" private="netWorth" className="hidden md:inline-flex" />
      </div>
      <SegmentedBar
        height={14}
        ariaLabel={`Tienes ${Math.round(positiveShare)} %, debes ${100 - Math.round(positiveShare)} %`}
        segments={(
          [
            { key: "assets", share: positiveShare, tone: "positive" },
            { key: "debts", share: 100 - positiveShare, tone: "negative" },
          ] as const
        ).filter((s) => s.share > 0)}
      />
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Tienes", value: totalAssets, dot: "#30D158" },
          { label: "Debes", value: totalDebts, dot: "#FF6961" },
        ].map((item) => (
          <div key={item.label} className="flex flex-col gap-0.5">
            <div className="text-eb-text-secondary flex items-center gap-1.5 text-[13px]">
              <span aria-hidden="true" className="size-2 rounded-full" style={{ background: item.dot }} />
              {item.label}
            </div>
            <Money value={item.value} private="netWorth" className="text-[17px] font-semibold" />
          </div>
        ))}
      </div>
    </div>
  );

  const segmented = (
    <div
      role="tablist"
      aria-label="Vista"
      className="eb-glass grid grid-cols-2 gap-0.5 rounded-[11px] p-0.5"
    >
      {(
        [
          { key: "today", label: "Hoy" },
          { key: "projected", label: `Con previstos · ${money(netProjected, { cents: false })}` },
        ] as const
      ).map((tab) => {
        const active = view === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setView(tab.key)}
            className={cn(
              "h-8 truncate rounded-[9px] px-2 text-[13px] transition-colors",
              active ? "text-eb-text font-semibold" : "text-eb-text-muted font-medium"
            )}
            style={
              active
                ? { background: "var(--eb-segment-active)", boxShadow: "var(--eb-segment-active-shadow)" }
                : undefined
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  const headerButtonClass =
    "flex size-9 items-center justify-center rounded-full text-eb-link transition-colors hover:text-eb-link-hover";
  const headerButtonStyle = {
    background: "var(--eb-glass-strong)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
  };

  const leftColumn = (
    <div className="flex flex-col gap-[26px]">
      <Section title="Cuentas" total={accountEntries.length > 0 ? money(totalAccounts, { cents: false }) : undefined}>
        {accountEntries.length === 0 ? (
          <p className="text-eb-text-tertiary px-4 py-4 text-[14px]">
            Agrega un positivo ligado a una cuenta de débito o efectivo.
          </p>
        ) : (
          accountEntries.map((entry, index) => (
            <NetWorthRow
              key={entry.id}
              leading={<AccountTile label={entry.label} account={entry.accountId ? accountById.get(entry.accountId) : undefined} />}
              title={entry.label}
              trailing={<Money value={entry.amount} private="netWorth" className="text-[16px] font-medium" />}
              onActivate={edit(entry)}
        entryId={entry.id}
              actions={rowActions(accountEntries, index)}
            />
          ))
        )}
      </Section>

      {receivables.length > 0 && (
        <Section title="Te deben">
          {receivables.map((group) => {
            if (group.entries.length === 1) {
              const entry = group.entries[0];
              const sectionEntries = receivables.flatMap((g) => g.entries);
              return (
                <NetWorthRow
                  key={group.key}
                  leading={<PersonAvatar name={group.name} />}
                  title={group.name}
                  subtitle={group.concepts.length > 0 ? group.concepts.join(" · ") : undefined}
                  trailing={<Money value={group.total} private="netWorth" className="text-[16px] font-medium" />}
                  onActivate={edit(entry)}
        entryId={entry.id}
                  actions={rowActions(sectionEntries, sectionEntries.indexOf(entry))}
                />
              );
            }
            const isOpen = !!expanded[group.key];
            return (
              <div key={group.key} className="eb-row">
                <NetWorthRow
                  leading={<PersonAvatar name={group.name} />}
                  title={group.name}
                  subtitle={group.concepts.join(" · ")}
                  ariaExpanded={isOpen}
                  trailing={
                    <span className="flex items-center gap-2">
                      <Money value={group.total} private="netWorth" className="text-[16px] font-medium" />
                      <ChevronDownIcon
                        size={14}
                        strokeWidth={2.4}
                        className={cn("text-eb-chevron transition-transform", isOpen && "rotate-180")}
                        aria-hidden="true"
                      />
                    </span>
                  }
                  onActivate={() => setExpanded((prev) => ({ ...prev, [group.key]: !isOpen }))}
                />
                {isOpen &&
                  group.entries.map((entry, index) => (
                    <NetWorthRow
                      key={entry.id}
                      indent
                      leading={null}
                      title={entry.label}
                      titleClassName="text-[15px] text-eb-text-muted"
                      trailing={<Money value={entry.amount} private="netWorth" className="text-[15px]" />}
                      onActivate={edit(entry)}
        entryId={entry.id}
                      actions={rowActions(group.entries, index)}
                    />
                  ))}
              </div>
            );
          })}
        </Section>
      )}

      {incomes.length > 0 && (
        <Section title="Por recibir">
          {incomes.map((entry, index) => (
            <NetWorthRow
              key={entry.id}
              leading={<CategoryTile color="green" icon={ArrowDownIcon} size={30} />}
              title={entry.label}
              trailing={
                <Money value={entry.amount} sign="positive" private="netWorth" className="text-eb-green text-[16px] font-medium" />
              }
              onActivate={edit(entry)}
        entryId={entry.id}
              actions={rowActions(incomes, index)}
            />
          ))}
        </Section>
      )}
    </div>
  );

  const rightColumn = (
    <div className="flex flex-col gap-[26px]">
      <Section title="Deudas" total={debts.length > 0 ? money(totalDebts, { cents: false }) : undefined}>
        {debts.length === 0 && (
          <p className="text-eb-text-tertiary px-4 py-4 text-[14px]">Sin deudas registradas.</p>
        )}
        {activeDebts.map((entry, index) => debtRow(entry, activeDebts, index))}
        {zeroDebts.length > 0 && (
          <div className="eb-row">
            <NetWorthRow
              leading={
                <div
                  aria-hidden="true"
                  className="text-eb-text-tertiary flex size-[30px] flex-none items-center justify-center rounded-[8px]"
                  style={{ background: "var(--eb-neutral-tile)" }}
                >
                  <CheckIcon size={16} strokeWidth={2} />
                </div>
              }
              title={`${zeroDebts.length} ${zeroDebts.length === 1 ? "tarjeta" : "tarjetas"} en $0`}
              titleClassName="text-eb-text-muted"
              subtitle={
                nearestZero
                  ? `${nearestZero.entry.label} ${dueText(nearestZero.days).replace("Vence", "vence").replace("Venció", "venció")}`
                  : undefined
              }
              ariaExpanded={!!expanded.zeroDebts}
              trailing={
                <ChevronRightIcon
                  size={14}
                  strokeWidth={2.4}
                  className={cn("text-eb-chevron transition-transform", expanded.zeroDebts && "rotate-90")}
                  aria-hidden="true"
                />
              }
              onActivate={() => setExpanded((prev) => ({ ...prev, zeroDebts: !prev.zeroDebts }))}
            />
            {expanded.zeroDebts && zeroDebts.map((entry, index) => debtRow(entry, zeroDebts, index, true))}
          </div>
        )}
      </Section>

      <Section
        title="Gastos previstos"
        footer={
          projections.length > 0 ? (
            <p className="text-eb-text-tertiary px-4 pt-1 text-[13px]">
              Con previstos tu neto queda en {money(netProjected)}
            </p>
          ) : undefined
        }
      >
        {projections.map((projection) => (
          <NetWorthRow
            key={projection.id}
            leading={<CategoryTile color="orange" icon={ClockIcon} size={30} />}
            title={projection.label}
            trailing={<Money value={projection.amount} sign="negative" private="netWorth" className="text-[16px] font-medium" />}
            onActivate={() => setDialog({ type: "projection", projection })}
          />
        ))}
        <button
          type="button"
          onClick={() => setDialog({ type: "projection" })}
          className="eb-row text-eb-link flex min-h-[52px] w-full items-center gap-3 px-4 text-left text-[16px]"
        >
          <span
            aria-hidden="true"
            className="flex size-[30px] flex-none items-center justify-center rounded-full"
            style={{ background: "rgba(94,107,255,0.18)" }}
          >
            <PlusIcon size={16} strokeWidth={2.4} />
          </span>
          Agregar previsto
        </button>
      </Section>
    </div>
  );

  return (
    <div className="relative overflow-hidden">
      <PageGlow variant="net-worth" className="md:hidden" />
      <div className="relative z-[1] mx-auto flex max-w-[1120px] flex-col gap-[26px] px-4 pt-4 pb-14 md:gap-7 md:px-6 md:pt-10 md:pb-16 lg:px-12">
        <header className="flex items-end justify-between gap-4 px-1 md:px-0">
          <h1 className="eb-title">Patrimonio</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={hidden ? "Mostrar saldos" : "Ocultar saldos"}
              aria-pressed={hidden}
              onClick={toggleHidden}
              className={headerButtonClass}
              style={headerButtonStyle}
            >
              {hidden ? <EyeOffIcon size={18} strokeWidth={2} /> : <EyeIcon size={18} strokeWidth={2} />}
            </button>
            <Popover open={addOpen} onOpenChange={setAddOpen}>
              <PopoverTrigger asChild>
                <button type="button" aria-label="Agregar" className={headerButtonClass} style={headerButtonStyle}>
                  <PlusIcon size={18} strokeWidth={2.4} />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-52 p-1.5">
                {(
                  [
                    { kind: "asset", label: "Positivo", hint: "Cuenta, préstamo o ingreso" },
                    { kind: "debt", label: "Deuda", hint: "Tarjeta o pago pendiente" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.kind}
                    type="button"
                    onClick={() => {
                      setAddOpen(false);
                      setDialog({ type: "entry", kind: option.kind });
                    }}
                    className="flex w-full flex-col rounded-[10px] px-3 py-2 text-left transition-colors hover:bg-[var(--eb-fill-subtle)]"
                  >
                    <span className="text-[15px] font-medium">{option.label}</span>
                    <span className="text-eb-text-tertiary text-[12px]">{option.hint}</span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Movil: heroe sobre el fondo. Escritorio: dentro de una tarjeta. */}
        <div className="flex flex-col gap-[26px] px-1 md:hidden">{hero}</div>
        <div className="md:hidden">{segmented}</div>
        <EbCard variant="hero" className="hidden flex-col gap-6 px-7 py-[26px] md:flex">
          {hero}
          <div className="max-w-[420px]">{segmented}</div>
        </EbCard>

        <div className="flex flex-col gap-[26px] md:grid md:grid-cols-2 md:items-start md:gap-5">
          {leftColumn}
          {rightColumn}
        </div>
      </div>

      {dialog?.type === "entry" && (
        <EntryFormDialog
          kind={dialog.kind}
          accounts={accounts}
          entry={dialog.entry}
          open
          onOpenChange={(open) => !open && setDialog(null)}
          onSaved={refresh}
        />
      )}
      {dialog?.type === "projection" && (
        <ProjectionDialog
          key={dialog.projection?.id ?? "new"}
          projection={dialog.projection}
          open
          onOpenChange={(open) => !open && setDialog(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
