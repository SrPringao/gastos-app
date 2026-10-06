import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Falta DATABASE_URL en .env.local");
}

const sql = postgres(connectionString, { prepare: false });

/**
 * Migracion no destructiva para el catalogo de metodos de pago:
 * 1. accounts.archived_at (nullable).
 * 2. payment_day de tarjetas de credito que no lo tienen, derivado del
 *    dia de la fecha limite de su deuda ligada en Patrimonio. Si no hay
 *    deuda ligada con fecha, se queda en null. No se toca cutoff_day.
 */
async function main() {
  await sql.unsafe(`
    ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS archived_at timestamp
  `);

  const updated = await sql.unsafe(`
    UPDATE accounts a
    SET payment_day = sub.day, updated_at = now()
    FROM (
      SELECT DISTINCT ON (account_id)
        account_id,
        EXTRACT(DAY FROM due_date)::int AS day
      FROM net_worth_entries
      WHERE kind = 'debt' AND account_id IS NOT NULL AND due_date IS NOT NULL
      ORDER BY account_id, updated_at DESC
    ) sub
    WHERE a.id = sub.account_id
      AND a.type = 'credit'
      AND a.payment_day IS NULL
    RETURNING a.id, a.name, a.payment_day
  `);

  console.log("Columna archived_at lista.");
  console.log(`payment_day derivado en ${updated.length} tarjetas:`);
  for (const row of updated) console.log(`  ${row.name}: dia ${row.payment_day}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
