import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Tabla de ejemplo - elimina cuando definas tus tablas reales (gastos, cuentas, categorias)
export const example = pgTable("example", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
