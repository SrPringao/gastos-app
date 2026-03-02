import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getCategories(userId: string | null) {
  if (!userId) return [];
  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(categories.name);
}

export type CreateCategoryInput = {
  name: string;
  color?: string | null;
};

export async function createCategory(
  userId: string,
  input: CreateCategoryInput
) {
  const { name, color } = input;

  if (!name?.trim()) {
    return { error: "El nombre es requerido" };
  }

  await db.insert(categories).values({
    userId,
    name: name.trim(),
    color: color || null,
  });

  return { success: true };
}
