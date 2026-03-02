import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";

export async function getCategories() {
  return db.select().from(categories).orderBy(categories.name);
}

export type CreateCategoryInput = {
  name: string;
  color?: string | null;
};

export async function createCategory(input: CreateCategoryInput) {
  const { name, color } = input;

  if (!name?.trim()) {
    return { error: "El nombre es requerido" };
  }

  await db.insert(categories).values({
    name: name.trim(),
    color: color || null,
  });

  return { success: true };
}
