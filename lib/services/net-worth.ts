import { db } from "@/lib/db";
import { netWorthEntries, netWorthProjections } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";

export async function getNetWorthEntries(userId: string | null) {
  if (!userId) return [];
  return db
    .select()
    .from(netWorthEntries)
    .where(eq(netWorthEntries.userId, userId))
    .orderBy(netWorthEntries.sortOrder, netWorthEntries.createdAt);
}

export async function getNetWorthEntryById(id: number) {
  const result = await db
    .select()
    .from(netWorthEntries)
    .where(eq(netWorthEntries.id, id))
    .limit(1);
  return result[0] ?? null;
}

export type CreateNetWorthEntryInput = {
  accountId?: number | null;
  label: string;
  kind: "asset" | "debt";
  amount: number;
  dueDate?: string | null;
  syncEnabled?: boolean;
};

export type UpdateNetWorthEntryInput = {
  accountId?: number | null;
  label?: string;
  kind?: "asset" | "debt";
  amount?: number;
  dueDate?: string | null;
  sortOrder?: number;
  syncEnabled?: boolean;
};

async function assertUniqueSyncedAccount(
  userId: string,
  accountId: number,
  exceptId?: number
) {
  const filters = [
    eq(netWorthEntries.userId, userId),
    eq(netWorthEntries.accountId, accountId),
    eq(netWorthEntries.syncEnabled, true),
  ];
  if (exceptId != null) filters.push(ne(netWorthEntries.id, exceptId));
  const rows = await db
    .select({ id: netWorthEntries.id, label: netWorthEntries.label })
    .from(netWorthEntries)
    .where(and(...filters))
    .limit(1);
  const other = rows[0];
  if (other) {
    return {
      error: `Ya hay una entrada sincronizada con esa cuenta (${other.label}).`,
    };
  }
  return null;
}

export async function applyExpenseToSyncedNetWorth(input: {
  userId: string;
  accountId: number;
  amountCents: number;
  expenseCreatedAt: Date;
}) {
  const { userId, accountId, amountCents, expenseCreatedAt } = input;
  if (!amountCents) return;

  const entries = await db
    .select()
    .from(netWorthEntries)
    .where(
      and(
        eq(netWorthEntries.userId, userId),
        eq(netWorthEntries.accountId, accountId),
        eq(netWorthEntries.syncEnabled, true)
      )
    );

  for (const entry of entries) {
    if (!entry.syncEnabledAt) continue;
    if (expenseCreatedAt.getTime() < entry.syncEnabledAt.getTime()) continue;
    const signed = entry.kind === "debt" ? amountCents : -amountCents;
    const next = Math.max(0, entry.amount + signed);
    if (next === entry.amount) continue;
    await db
      .update(netWorthEntries)
      .set({ amount: next, updatedAt: new Date() })
      .where(eq(netWorthEntries.id, entry.id));
  }
}

export async function createNetWorthEntry(
  userId: string,
  input: CreateNetWorthEntryInput
) {
  const { accountId, label, kind, amount, dueDate, syncEnabled } = input;

  if (!label?.trim()) {
    return { error: "El nombre es requerido" };
  }
  if (!kind || !["asset", "debt"].includes(kind)) {
    return { error: "Tipo invalido" };
  }
  if (typeof amount !== "number" || isNaN(amount) || amount < 0) {
    return { error: "Monto invalido" };
  }

  const wantsSync = Boolean(syncEnabled);
  const linkedAccountId = accountId ?? null;
  if (wantsSync && !linkedAccountId) {
    return { error: "Elige un metodo de pago para sincronizar" };
  }
  if (wantsSync && linkedAccountId) {
    const conflict = await assertUniqueSyncedAccount(userId, linkedAccountId);
    if (conflict) return conflict;
  }

  const siblings = await db
    .select({ sortOrder: netWorthEntries.sortOrder })
    .from(netWorthEntries)
    .where(eq(netWorthEntries.userId, userId));
  const maxSortOrder = siblings.reduce((max, s) => Math.max(max, s.sortOrder), -1);

  await db.insert(netWorthEntries).values({
    userId,
    accountId: linkedAccountId,
    label: label.trim(),
    kind,
    amount,
    dueDate: dueDate ? new Date(dueDate) : null,
    sortOrder: maxSortOrder + 1,
    syncEnabled: wantsSync,
    syncEnabledAt: wantsSync ? new Date() : null,
  });

  return { success: true };
}

export async function updateNetWorthEntry(
  userId: string,
  id: number,
  input: UpdateNetWorthEntryInput
) {
  const existing = await getNetWorthEntryById(id);
  if (!existing) {
    return { error: "Registro no encontrado" };
  }
  if (existing.userId !== userId) {
    return { error: "No autorizado" };
  }

  const { accountId, label, kind, amount, dueDate, sortOrder, syncEnabled } =
    input;

  if (label !== undefined && !label?.trim()) {
    return { error: "El nombre es requerido" };
  }
  if (kind && !["asset", "debt"].includes(kind)) {
    return { error: "Tipo invalido" };
  }
  if (
    amount !== undefined &&
    (typeof amount !== "number" || isNaN(amount) || amount < 0)
  ) {
    return { error: "Monto invalido" };
  }

  const nextAccountId =
    accountId !== undefined ? accountId : existing.accountId;
  let nextSync =
    syncEnabled !== undefined ? Boolean(syncEnabled) : existing.syncEnabled;
  if (!nextAccountId) nextSync = false;
  if (nextSync && nextAccountId) {
    const conflict = await assertUniqueSyncedAccount(
      userId,
      nextAccountId,
      id
    );
    if (conflict) return conflict;
  }

  const accountChanged =
    accountId !== undefined && accountId !== existing.accountId;
  const turningOn = nextSync && !existing.syncEnabled;
  const turningOff = !nextSync && existing.syncEnabled;
  let nextSyncEnabledAt = existing.syncEnabledAt;
  if (turningOff || !nextSync) {
    nextSyncEnabledAt = null;
  } else if (turningOn || (nextSync && accountChanged)) {
    nextSyncEnabledAt = new Date();
  }

  await db
    .update(netWorthEntries)
    .set({
      ...(accountId !== undefined && { accountId }),
      ...(label !== undefined && { label: label.trim() }),
      ...(kind !== undefined && { kind }),
      ...(amount !== undefined && { amount }),
      ...(dueDate !== undefined && {
        dueDate: dueDate ? new Date(dueDate) : null,
      }),
      ...(sortOrder !== undefined && { sortOrder }),
      syncEnabled: nextSync,
      syncEnabledAt: nextSyncEnabledAt,
      updatedAt: new Date(),
    })
    .where(eq(netWorthEntries.id, id));

  return { success: true };
}

export async function reorderNetWorthEntries(
  userId: string,
  orderedIds: number[]
) {
  const existing = await db
    .select({ id: netWorthEntries.id, userId: netWorthEntries.userId })
    .from(netWorthEntries)
    .where(eq(netWorthEntries.userId, userId));
  const ownedIds = new Set(existing.map((e) => e.id));

  if (!orderedIds.every((id) => ownedIds.has(id))) {
    return { error: "No autorizado" };
  }

  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(netWorthEntries)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(netWorthEntries.id, id))
    )
  );

  return { success: true };
}

export async function deleteNetWorthEntry(userId: string, id: number) {
  const existing = await getNetWorthEntryById(id);
  if (!existing) {
    return { error: "Registro no encontrado" };
  }
  if (existing.userId !== userId) {
    return { error: "No autorizado" };
  }

  await db.delete(netWorthEntries).where(eq(netWorthEntries.id, id));

  return { success: true };
}

export async function getNetWorthProjections(userId: string | null) {
  if (!userId) return [];
  return db
    .select()
    .from(netWorthProjections)
    .where(eq(netWorthProjections.userId, userId))
    .orderBy(netWorthProjections.createdAt);
}

export async function getNetWorthProjectionById(id: number) {
  const result = await db
    .select()
    .from(netWorthProjections)
    .where(eq(netWorthProjections.id, id))
    .limit(1);
  return result[0] ?? null;
}

export type CreateNetWorthProjectionInput = {
  label: string;
  amount: number;
};

export type UpdateNetWorthProjectionInput = {
  label?: string;
  amount?: number;
};

export async function createNetWorthProjection(
  userId: string,
  input: CreateNetWorthProjectionInput
) {
  const { label, amount } = input;

  if (!label?.trim()) {
    return { error: "El nombre es requerido" };
  }
  if (typeof amount !== "number" || isNaN(amount) || amount < 0) {
    return { error: "Monto invalido" };
  }

  await db.insert(netWorthProjections).values({
    userId,
    label: label.trim(),
    amount,
  });

  return { success: true };
}

export async function updateNetWorthProjection(
  userId: string,
  id: number,
  input: UpdateNetWorthProjectionInput
) {
  const existing = await getNetWorthProjectionById(id);
  if (!existing) {
    return { error: "Registro no encontrado" };
  }
  if (existing.userId !== userId) {
    return { error: "No autorizado" };
  }

  const { label, amount } = input;

  if (label !== undefined && !label?.trim()) {
    return { error: "El nombre es requerido" };
  }
  if (
    amount !== undefined &&
    (typeof amount !== "number" || isNaN(amount) || amount < 0)
  ) {
    return { error: "Monto invalido" };
  }

  await db
    .update(netWorthProjections)
    .set({
      ...(label !== undefined && { label: label.trim() }),
      ...(amount !== undefined && { amount }),
    })
    .where(eq(netWorthProjections.id, id));

  return { success: true };
}

export async function deleteNetWorthProjection(userId: string, id: number) {
  const existing = await getNetWorthProjectionById(id);
  if (!existing) {
    return { error: "Registro no encontrado" };
  }
  if (existing.userId !== userId) {
    return { error: "No autorizado" };
  }

  await db
    .delete(netWorthProjections)
    .where(eq(netWorthProjections.id, id));

  return { success: true };
}
