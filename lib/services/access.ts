import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userFeatures, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import {
  hasAccess,
  isUserFeatureKey,
  NO_ACCESS,
  type AccessRequirement,
  type UserAccess,
  type UserFeatureKey,
} from "@/lib/features";

export async function getUserFeatures(userId: string): Promise<UserFeatureKey[]> {
  const rows = await db
    .select({ feature: userFeatures.feature })
    .from(userFeatures)
    .where(eq(userFeatures.userId, userId));
  return rows.map((r) => r.feature).filter(isUserFeatureKey);
}

export async function getUserAccess(userId: string): Promise<UserAccess> {
  const [row, features] = await Promise.all([
    db
      .select({ isSuperAdmin: users.isSuperAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    getUserFeatures(userId),
  ]);
  if (!row[0]) return NO_ACCESS;
  return { isSuperAdmin: row[0].isSuperAdmin, features };
}

/**
 * Usuario actual si cumple el requisito (super admin o funcion encendida);
 * null si no hay sesion o no tiene acceso. Para pages y rutas de API.
 */
export async function getUserWithAccess(
  requirement: AccessRequirement
): Promise<{ id: string; access: UserAccess } | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const access = await getUserAccess(user.id);
  return hasAccess(access, requirement) ? { id: user.id, access } : null;
}

export async function setUserFeature(
  userId: string,
  feature: UserFeatureKey,
  enabled: boolean,
  enabledBy: string
): Promise<void> {
  if (enabled) {
    await db
      .insert(userFeatures)
      .values({ userId, feature, enabledBy })
      .onConflictDoNothing({ target: [userFeatures.userId, userFeatures.feature] });
  } else {
    await db
      .delete(userFeatures)
      .where(and(eq(userFeatures.userId, userId), eq(userFeatures.feature, feature)));
  }
}
