import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Falta DATABASE_URL en .env.local");
}

const sql = postgres(connectionString, { prepare: false });

/**
 * Migracion no destructiva: preferencia de vista de "Cuentas" en Inicio
 * (saldos de Patrimonio o gastado del mes). Null = automatica.
 */
async function main() {
  await sql.unsafe(`
    ALTER TABLE user_preferences
    ADD COLUMN IF NOT EXISTS accounts_view text
  `);
  console.log("Columna user_preferences.accounts_view lista.");
  await sql.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
