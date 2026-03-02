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
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text,
      display_name text,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );

    ALTER TABLE accounts ADD COLUMN IF NOT EXISTS user_id uuid;
    ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id uuid;
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id uuid;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'accounts_user_id_users_id_fk'
      ) THEN
        ALTER TABLE accounts
        ADD CONSTRAINT accounts_user_id_users_id_fk
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END $$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'categories_user_id_users_id_fk'
      ) THEN
        ALTER TABLE categories
        ADD CONSTRAINT categories_user_id_users_id_fk
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END $$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'expenses_user_id_users_id_fk'
      ) THEN
        ALTER TABLE expenses
        ADD CONSTRAINT expenses_user_id_users_id_fk
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS monthly_budgets (
      id serial PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      month text NOT NULL,
      amount integer NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS monthly_budgets_user_month_unique
      ON monthly_budgets (user_id, month);
  `);

  console.log("Tablas users/monthly_budgets y relaciones por usuario creadas.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
