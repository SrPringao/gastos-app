import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Falta DATABASE_URL en .env.local");
}

const sql = postgres(connectionString, { prepare: false });

/**
 * Migracion no destructiva: agrega asset_kind y contact a net_worth_entries
 * y rellena asset_kind solo donde esta vacio, con la misma inferencia que
 * usa la app (lib/dashboard-metrics.ts > inferAssetKind).
 */
async function main() {
  await sql.unsafe(`
    ALTER TABLE net_worth_entries
    ADD COLUMN IF NOT EXISTS asset_kind text,
    ADD COLUMN IF NOT EXISTS contact text
  `);

  const updated = await sql.unsafe(`
    UPDATE net_worth_entries
    SET asset_kind = CASE
      WHEN account_id IS NOT NULL THEN 'account'
      WHEN label ILIKE '%sueldo%' THEN 'income'
      ELSE 'receivable'
    END
    WHERE kind = 'asset' AND asset_kind IS NULL
  `);

  console.log(
    `Columnas asset_kind y contact listas. Positivos clasificados: ${updated.count}.`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
