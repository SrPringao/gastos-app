import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Falta DATABASE_URL en .env.local");
}

const sql = postgres(connectionString, { prepare: false });

/** Debe coincidir con contactNameKey de lib/contacts.ts */
function contactNameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Migracion no destructiva (expensebro-modales-prompt.md, 4.1 y 5):
 * - Tabla contacts con indice unico (user_id, name_key).
 * - net_worth_entries.contact_id (FK a contacts, nullable). El texto
 *   `contact` se conserva.
 * - user_preferences.default_budget (presupuesto por defecto, nullable).
 * - Un contacto por cada texto distinto de "quien te debe" (normalizado);
 *   los textos que normalizan igual se fusionan con el nombre mas usado.
 * Se puede correr varias veces: no duplica contactos ni re-liga positivos.
 */
async function main() {
  const report = await sql.begin(async (tx) => {
    await tx.unsafe(`
      CREATE TABLE IF NOT EXISTS contacts (
        id serial PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name text NOT NULL,
        name_key text NOT NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        archived_at timestamp
      )
    `);
    await tx.unsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS contacts_user_name_key_unique
      ON contacts (user_id, name_key)
    `);
    await tx.unsafe(`
      ALTER TABLE net_worth_entries
      ADD COLUMN IF NOT EXISTS contact_id integer REFERENCES contacts(id) ON DELETE SET NULL
    `);
    await tx.unsafe(`
      ALTER TABLE user_preferences
      ADD COLUMN IF NOT EXISTS default_budget integer
    `);

    const rows = (await tx.unsafe(`
      SELECT user_id, contact, count(*)::int AS uses, max(updated_at) AS last_used
      FROM net_worth_entries
      WHERE kind = 'asset' AND contact IS NOT NULL AND trim(contact) <> '' AND contact_id IS NULL
      GROUP BY user_id, contact
    `)) as unknown as { user_id: string; contact: string; uses: number; last_used: Date }[];

    // Agrupa por (usuario, clave): el nombre mas usado gana; empate -> el mas reciente
    const groups = new Map<
      string,
      { userId: string; key: string; variants: { name: string; raw: string; uses: number; lastUsed: Date }[] }
    >();
    for (const row of rows) {
      const name = row.contact.trim().replace(/\s+/g, " ");
      const key = contactNameKey(name);
      const id = `${row.user_id}:${key}`;
      const group = groups.get(id) ?? { userId: row.user_id, key, variants: [] };
      group.variants.push({ name, raw: row.contact, uses: row.uses, lastUsed: row.last_used });
      groups.set(id, group);
    }

    const created: string[] = [];
    const reused: string[] = [];
    const merged: { into: string; from: string[] }[] = [];
    let linked = 0;

    for (const group of groups.values()) {
      const winner = [...group.variants].sort(
        (a, b) => b.uses - a.uses || b.lastUsed.getTime() - a.lastUsed.getTime()
      )[0];

      const inserted = (await tx.unsafe(
        `INSERT INTO contacts (user_id, name, name_key)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, name_key) DO NOTHING
         RETURNING id`,
        [group.userId, winner.name, group.key]
      )) as unknown as { id: number }[];
      let contactId = inserted[0]?.id;
      if (contactId) {
        created.push(winner.name);
      } else {
        const existing = (await tx.unsafe(
          `SELECT id, name FROM contacts WHERE user_id = $1 AND name_key = $2`,
          [group.userId, group.key]
        )) as unknown as { id: number; name: string }[];
        contactId = existing[0].id;
        reused.push(existing[0].name);
      }

      const distinctNames = [...new Set(group.variants.map((v) => v.name))];
      if (distinctNames.length > 1) {
        merged.push({ into: winner.name, from: distinctNames.filter((n) => n !== winner.name) });
      }

      for (const variant of group.variants) {
        const updated = await tx.unsafe(
          `UPDATE net_worth_entries
           SET contact_id = $1
           WHERE user_id = $2 AND kind = 'asset' AND contact = $3 AND contact_id IS NULL`,
          [contactId, group.userId, variant.raw]
        );
        linked += updated.count;
      }
    }

    return { created, reused, merged, linked };
  });

  console.log("Tabla contacts, contact_id y default_budget listos.");
  console.log(`Contactos creados (${report.created.length}): ${report.created.join(", ") || "ninguno"}`);
  if (report.reused.length > 0) {
    console.log(`Contactos que ya existian (${report.reused.length}): ${report.reused.join(", ")}`);
  }
  console.log(
    report.merged.length > 0
      ? `Fusionados: ${report.merged.map((m) => `${m.from.join(", ")} -> ${m.into}`).join("; ")}`
      : "Fusionados: ninguno"
  );
  console.log(`Positivos ligados a un contacto: ${report.linked}`);
  await sql.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
