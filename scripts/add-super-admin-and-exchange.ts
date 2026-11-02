import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Falta DATABASE_URL en .env.local");
}

const sql = postgres(connectionString, { prepare: false });

/** Super admin inicial; tambien se le enciende Intercambio */
const SUPER_ADMIN_EMAIL = "franco.aldrete@gmail.com";

/**
 * Migracion no destructiva:
 * - users.is_super_admin (acceso al panel de Super admin)
 * - user_features (funciones especiales por usuario)
 * - exchange_expenses (gastos del intercambio, aparte de expenses)
 */
async function main() {
  await sql.unsafe(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS user_features (
      id serial PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      feature text NOT NULL,
      enabled_by uuid REFERENCES users(id) ON DELETE SET NULL,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await sql.unsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS user_features_user_feature_unique
    ON user_features (user_id, feature)
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS exchange_expenses (
      id serial PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount integer NOT NULL,
      currency text NOT NULL DEFAULT 'MXN',
      reason text NOT NULL,
      category text NOT NULL DEFAULT 'other',
      date timestamp NOT NULL,
      note text,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await sql.unsafe(`
    CREATE INDEX IF NOT EXISTS exchange_expenses_user_date_idx
    ON exchange_expenses (user_id, date)
  `);

  const admins = await sql`
    UPDATE users SET is_super_admin = true
    WHERE lower(email) = ${SUPER_ADMIN_EMAIL}
    RETURNING id
  `;
  for (const admin of admins) {
    await sql`
      INSERT INTO user_features (user_id, feature, enabled_by)
      VALUES (${admin.id}, 'exchange', ${admin.id})
      ON CONFLICT (user_id, feature) DO NOTHING
    `;
  }

  console.log("Columna users.is_super_admin lista.");
  console.log("Tablas user_features y exchange_expenses listas.");
  console.log(
    admins.length > 0
      ? `${SUPER_ADMIN_EMAIL} es super admin y tiene Intercambio.`
      : `Aviso: no se encontro ${SUPER_ADMIN_EMAIL}; nadie quedo como super admin.`
  );
  await sql.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
