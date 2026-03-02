import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Falta DATABASE_URL en .env.local");
}

const sql = postgres(connectionString, { prepare: false });

async function main() {
  await sql`DROP TABLE IF EXISTS example`;
  console.log("Tabla 'example' eliminada.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
