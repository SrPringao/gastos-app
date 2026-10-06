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
    ALTER TABLE net_worth_entries
    ADD COLUMN IF NOT EXISTS sync_enabled boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS sync_enabled_at timestamp
  `);
  console.log("Columnas sync_enabled y sync_enabled_at agregadas a net_worth_entries.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
