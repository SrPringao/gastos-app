import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Falta DATABASE_URL en .env.local");
}

const sql = postgres(connectionString, { prepare: false });

/**
 * Migracion no destructiva: tipo de cambio a pesos de cada gasto del
 * intercambio. Los gastos en euros existentes se completan solos al abrir
 * /intercambio.
 */
async function main() {
  await sql.unsafe(`
    ALTER TABLE exchange_expenses
    ADD COLUMN IF NOT EXISTS fx_rate numeric(12, 6),
    ADD COLUMN IF NOT EXISTS fx_date date
  `);
  console.log("Columnas exchange_expenses.fx_rate y fx_date listas.");
  await sql.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
