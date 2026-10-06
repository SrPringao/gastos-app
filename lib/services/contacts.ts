import { db } from "@/lib/db";
import { contacts, netWorthEntries } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { cleanContactName, contactNameKey } from "@/lib/contacts";

/** Personas guardadas del usuario (archivadas incluidas si se piden) */
export async function getContacts(userId: string, options: { includeArchived?: boolean } = {}) {
  const filters = [eq(contacts.userId, userId)];
  if (!options.includeArchived) filters.push(isNull(contacts.archivedAt));
  return db.select().from(contacts).where(and(...filters)).orderBy(contacts.name);
}

export async function getContactById(userId: string, id: number) {
  const rows = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Crea una persona. Si ya existe una con la misma clave (ej. "camila" vs
 * "Camila") devuelve esa en lugar de duplicarla, y la desarchiva.
 */
export async function createContact(userId: string, rawName: string) {
  const name = cleanContactName(rawName ?? "");
  if (!name) return { error: "El nombre es requerido" };
  const nameKey = contactNameKey(name);

  const existing = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.userId, userId), eq(contacts.nameKey, nameKey)))
    .limit(1);
  if (existing[0]) {
    if (existing[0].archivedAt) {
      const [restored] = await db
        .update(contacts)
        .set({ archivedAt: null })
        .where(eq(contacts.id, existing[0].id))
        .returning();
      return { contact: restored, existed: true as const };
    }
    return { contact: existing[0], existed: true as const };
  }

  const [created] = await db.insert(contacts).values({ userId, name, nameKey }).returning();
  return { contact: created, existed: false as const };
}

/** Renombra y mantiene en sync el texto de sus positivos */
export async function renameContact(userId: string, id: number, rawName: string) {
  const contact = await getContactById(userId, id);
  if (!contact) return { error: "Persona no encontrada" };
  const name = cleanContactName(rawName ?? "");
  if (!name) return { error: "El nombre es requerido" };
  const nameKey = contactNameKey(name);

  if (nameKey !== contact.nameKey) {
    const clash = await db
      .select({ id: contacts.id, name: contacts.name })
      .from(contacts)
      .where(and(eq(contacts.userId, userId), eq(contacts.nameKey, nameKey)))
      .limit(1);
    if (clash[0]) {
      return { error: `Ya existe ${clash[0].name}. Usa "Fusionar" para juntarlas.` };
    }
  }

  await db.update(contacts).set({ name, nameKey }).where(eq(contacts.id, id));
  await db
    .update(netWorthEntries)
    .set({ contact: name, updatedAt: new Date() })
    .where(and(eq(netWorthEntries.userId, userId), eq(netWorthEntries.contactId, id)));
  return { success: true as const };
}

/** Archivar oculta la persona de los chips; sus positivos se conservan */
export async function setContactArchived(userId: string, id: number, archived: boolean) {
  const contact = await getContactById(userId, id);
  if (!contact) return { error: "Persona no encontrada" };
  await db
    .update(contacts)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(contacts.id, id));
  return { success: true as const };
}

/**
 * Fusiona un duplicado: los positivos de `sourceId` pasan a `targetId` y el
 * duplicado se elimina (solo la persona; ningun positivo se borra).
 */
export async function mergeContacts(userId: string, sourceId: number, targetId: number) {
  if (sourceId === targetId) return { error: "Elige dos personas distintas" };
  const [source, target] = await Promise.all([
    getContactById(userId, sourceId),
    getContactById(userId, targetId),
  ]);
  if (!source || !target) return { error: "Persona no encontrada" };

  await db.transaction(async (tx) => {
    await tx
      .update(netWorthEntries)
      .set({ contactId: target.id, contact: target.name, updatedAt: new Date() })
      .where(and(eq(netWorthEntries.userId, userId), eq(netWorthEntries.contactId, source.id)));
    await tx.delete(contacts).where(eq(contacts.id, source.id));
  });
  return { success: true as const };
}
