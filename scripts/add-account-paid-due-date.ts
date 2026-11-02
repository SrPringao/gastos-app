import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Falta DATABASE_URL en .env.local");
}

const sql = postgres(connectionString, { prepare: false });

/**
 * Migracion no destructiva: fecha de pago ya cubierta por tarjeta
 * ("Ya pagué este corte"). Null = ningun corte marcado.
 */
async function main() {
  await sql.unsafe(`
    ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS paid_due_date date
  `);
  console.log("Columna accounts.paid_due_date lista.");
  await sql.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
