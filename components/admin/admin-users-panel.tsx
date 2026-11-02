"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { EbCard } from "@/components/ui/eb/card";
import { IOSSwitch } from "@/components/ui/eb/form-kit";
import { showToast } from "@/components/ui/eb/toast";
import { initialOf } from "@/lib/dashboard-metrics";
import { USER_FEATURES, type UserFeatureKey } from "@/lib/features";
import type { UserActivity } from "@/lib/services/admin";
import { cn } from "@/lib/utils";

type Status = "active" | "idle" | "inactive" | "never";

/** Activo: registro en la ultima semana. Poco activo: en el ultimo mes. */
function statusOf(days: number | null): Status {
  if (days === null) return "never";
  if (days < 7) return "active";
  if (days < 30) return "idle";
  return "inactive";
}

const STATUS: Record<Status, { label: string; color: string }> = {
  active: { label: "Activo", color: "var(--eb-green)" },
  idle: { label: "Poco activo", color: "var(--eb-orange)" },
  inactive: { label: "Inactivo", color: "var(--eb-red)" },
  never: { label: "Sin gastos", color: "var(--eb-text-tertiary)" },
};

/** "hoy", "ayer", "hace 5 días", "hace 3 meses" */
function relativeDays(days: number): string {
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "hace 1 mes" : `hace ${months} meses`;
  const years = Math.floor(days / 365);
  return years === 1 ? "hace 1 año" : `hace ${years} años`;
}

function shortDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
    .replace(".", "");
}

function plural(n: number, one: string, many: string) {
  return `${n.toLocaleString("es-MX")} ${n === 1 ? one : many}`;
}

function StatTile({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <EbCard size="mobile" className="flex flex-col gap-1 px-5 py-4">
      <span className="text-eb-text-tertiary flex items-center gap-1.5 text-[13px]">
        {color && <span aria-hidden="true" className="size-[7px] rounded-full" style={{ background: color }} />}
        {label}
      </span>
      <span className="eb-rounded text-[28px] leading-none font-bold tracking-[-0.02em]">{value}</span>
    </EbCard>
  );
}

function UserRow({
  user,
  isMe,
  onToggle,
  pending,
}: {
  user: UserActivity;
  isMe: boolean;
  onToggle: (feature: UserFeatureKey, enabled: boolean) => void;
  pending: boolean;
}) {
  const labelId = useId();
  const status = STATUS[statusOf(user.daysSinceLastExpense)];
  const name = user.displayName?.trim() || user.email || "Sin nombre";

  return (
    <li className="border-eb-separator flex flex-col gap-3 border-b px-5 py-4 last:border-b-0 md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center md:gap-5">
      {/* Usuario */}
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="text-eb-text flex size-10 flex-none items-center justify-center rounded-full text-[15px] font-semibold"
          style={{ background: "var(--eb-neutral-tile)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
        >
          {initialOf(name)}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[15px] font-semibold">{name}</span>
            {isMe && <span className="text-eb-text-tertiary flex-none text-[12px]">(tú)</span>}
            {user.isSuperAdmin && (
              <span
                className="text-eb-link flex-none rounded-full px-2 py-px text-[11px] font-semibold"
                style={{ background: "rgba(94,107,255,0.14)" }}
              >
                Admin
              </span>
            )}
          </span>
          {user.displayName && user.email && (
            <span className="text-eb-text-tertiary truncate text-[13px]">{user.email}</span>
          )}
        </div>
      </div>

      {/* Ultimo registro */}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-[14px] font-medium">
          <span aria-hidden="true" className="size-[7px] flex-none rounded-full" style={{ background: status.color }} />
          {status.label}
        </span>
        <span className="text-eb-text-tertiary text-[13px]">
          {user.lastExpenseAt && user.daysSinceLastExpense !== null
            ? `Último registro ${relativeDays(user.daysSinceLastExpense)} · ${shortDate(user.lastExpenseAt)}`
            : `Alta ${shortDate(user.joinedAt)}`}
        </span>
      </div>

      {/* Conteos */}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[14px] font-medium tabular-nums">{plural(user.totalExpenses, "gasto", "gastos")}</span>
        <span className="text-eb-text-tertiary text-[13px] tabular-nums">
          {user.expensesLast30Days > 0
            ? `${plural(user.expensesLast30Days, "registro", "registros")} en 30 días`
            : user.firstExpenseAt
              ? `Desde ${shortDate(user.firstExpenseAt)}`
              : "Aún no registra"}
        </span>
      </div>

      {/* Funciones especiales */}
      <div className="flex items-center justify-between gap-3 md:justify-end">
        <span id={labelId} className="text-eb-text-secondary text-[14px]">
          {USER_FEATURES.exchange.label}
        </span>
        <IOSSwitch
          checked={user.features.includes("exchange")}
          onChange={(enabled) => onToggle("exchange", enabled)}
          disabled={pending}
          labelledBy={labelId}
        />
      </div>
    </li>
  );
}

/**
 * Panel de Super admin: quien usa la app (por fecha de captura) y las
 * funciones especiales de cada usuario. Ordenado por actividad reciente.
 */
export function AdminUsersPanel({
  users: initialUsers,
  currentUserId,
}: {
  users: UserActivity[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const counts = users.reduce(
    (acc, u) => {
      acc[statusOf(u.daysSinceLastExpense)] += 1;
      return acc;
    },
    { active: 0, idle: 0, inactive: 0, never: 0 } as Record<Status, number>
  );

  function patchFeatures(userId: string, feature: UserFeatureKey, enabled: boolean) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              features: enabled
                ? [...u.features.filter((f) => f !== feature), feature]
                : u.features.filter((f) => f !== feature),
            }
          : u
      )
    );
  }

  async function toggle(user: UserActivity, feature: UserFeatureKey, enabled: boolean) {
    setPendingId(user.id);
    patchFeatures(user.id, feature, enabled);
    const name = user.displayName?.trim() || user.email || "el usuario";
    try {
      const res = await fetch(`/api/admin/users/${user.id}/features`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature, enabled }),
      });
      if (!res.ok) throw new Error();
      showToast({
        message: `${USER_FEATURES[feature].label} ${enabled ? "activado" : "desactivado"} para ${name}`,
      });
      // Si es uno mismo, el menu tiene que mostrar u ocultar la seccion
      if (user.id === currentUserId) router.refresh();
    } catch {
      patchFeatures(user.id, feature, !enabled);
      showToast({ message: "No se pudo guardar el cambio" });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Usuarios" value={users.length} />
        <StatTile label="Activos" value={counts.active} color={STATUS.active.color} />
        <StatTile label="Poco activos" value={counts.idle} color={STATUS.idle.color} />
        <StatTile label="Inactivos o sin gastos" value={counts.inactive + counts.never} color={STATUS.inactive.color} />
      </div>

      <EbCard className="overflow-hidden">
        <div
          className={cn(
            "text-eb-text-tertiary border-eb-separator hidden border-b px-5 py-3 text-[12px] font-semibold tracking-[0.04em] uppercase",
            "md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:gap-5"
          )}
        >
          <span>Usuario</span>
          <span>Actividad</span>
          <span>Registros</span>
          <span className="text-right">Funciones</span>
        </div>
        {users.length === 0 ? (
          <p className="text-eb-text-tertiary px-6 py-12 text-center text-[14px]">Aún no hay usuarios.</p>
        ) : (
          <ul>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isMe={user.id === currentUserId}
                pending={pendingId === user.id}
                onToggle={(feature, enabled) => toggle(user, feature, enabled)}
              />
            ))}
          </ul>
        )}
      </EbCard>
    </div>
  );
}
