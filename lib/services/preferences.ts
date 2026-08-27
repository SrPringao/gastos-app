import { db } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type Theme = "dark" | "light";

export type UserPreferencesData = {
  theme: Theme;
  hideNetWorthAmounts: boolean;
  /** Hrefs (en orden) de las secciones elegidas para la tab bar movil; null = default */
  mobileNavHrefs: string[] | null;
};

const DEFAULT_PREFERENCES: UserPreferencesData = {
  theme: "dark",
  hideNetWorthAmounts: false,
  mobileNavHrefs: null,
};

export async function getUserPreferences(
  userId: string
): Promise<UserPreferencesData> {
  const result = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  const row = result[0];
  if (!row) return DEFAULT_PREFERENCES;

  return {
    theme: row.theme as Theme,
    hideNetWorthAmounts: row.hideNetWorthAmounts,
    mobileNavHrefs: row.mobileNavItems ?? null,
  };
}

type UserPreferencesUpdate = Partial<Omit<UserPreferencesData, "mobileNavHrefs">> & {
  mobileNavHrefs?: string[] | null;
};

/** Actualiza solo las preferencias enviadas; crea el registro si no existe. */
export async function upsertUserPreferences(
  userId: string,
  updates: UserPreferencesUpdate
): Promise<UserPreferencesData> {
  const { mobileNavHrefs, ...rest } = updates;
  const dbUpdates = {
    ...rest,
    ...(mobileNavHrefs !== undefined ? { mobileNavItems: mobileNavHrefs } : {}),
  };

  const existing = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(userPreferences)
      .set({ ...dbUpdates, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId));
  } else {
    await db.insert(userPreferences).values({
      userId,
      theme: DEFAULT_PREFERENCES.theme,
      hideNetWorthAmounts: DEFAULT_PREFERENCES.hideNetWorthAmounts,
      ...dbUpdates,
    });
  }

  return getUserPreferences(userId);
}
