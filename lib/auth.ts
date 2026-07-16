import { headers } from "next/headers";
import { auth } from "@/auth";
import { validateApiToken } from "@/lib/api-tokens";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type CurrentUser = {
  id: string;
  email: string | null;
  displayName: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const headersList = await headers();
  const authHeader = headersList.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    const apiResult = await validateApiToken(token);
    if (apiResult) {
      const row = await db
        .select()
        .from(users)
        .where(eq(users.id, apiResult.userId))
        .limit(1);
      const u = row[0];
      if (u) {
        return {
          id: u.id,
          email: u.email,
          displayName: u.displayName,
        };
      }
    }
  }

  const session = await auth();
  if (!session?.user?.id) return null;

  const row = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  const u = row[0];
  if (!u) return null;

  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
  };
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}
