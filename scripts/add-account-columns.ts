import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Falta DATABASE_URL en .env.local");
}

const sql = postgres(connectionString, { prepare: false });

async function main() {
  await sql.unsafe(`
    ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS color text,
    ADD COLUMN IF NOT EXISTS image_url text
  `);
  console.log("Columnas color e image_url agregadas a accounts.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
