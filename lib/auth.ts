import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { validateApiToken } from "@/lib/api-tokens";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type CurrentUser = {
  id: string;
  email: string | null;
  displayName: string | null;
};

async function getUserFromSupabaseToken(token: string): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (!user) return null;

  const row = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!row[0]) {
    await db.insert(users).values({
      id: user.id,
      email: user.email ?? null,
      displayName: user.user_metadata?.display_name ?? user.user_metadata?.name ?? null,
      updatedAt: new Date(),
    });
  }

  return {
    id: user.id,
    email: user.email ?? null,
    displayName:
      row[0]?.displayName ??
      user.user_metadata?.display_name ??
      user.user_metadata?.name ??
      null,
  };
}

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
    const user = await getUserFromSupabaseToken(token);
    if (user) return user;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const row = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!row[0]) {
    await db.insert(users).values({
      id: user.id,
      email: user.email ?? null,
      displayName: user.user_metadata?.display_name ?? user.user_metadata?.name ?? null,
      updatedAt: new Date(),
    });
  }

  return {
    id: user.id,
    email: user.email ?? null,
    displayName:
      row[0]?.displayName ??
      user.user_metadata?.display_name ??
      user.user_metadata?.name ??
      null,
  };
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}
