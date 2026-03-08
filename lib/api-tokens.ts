import { createHash, randomBytes } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiTokens } from "@/lib/db/schema";

const PREFIX = "gastos_";
const TOKEN_BYTES = 32;

export type ExpiresIn = "7d" | "30d" | "90d" | "365d";

const DAYS: Record<ExpiresIn, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "365d": 365,
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateToken(): string {
  const random = randomBytes(TOKEN_BYTES).toString("hex");
  return PREFIX + random;
}

export async function createApiToken(
  userId: string,
  expiresIn: ExpiresIn = "30d"
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + DAYS[expiresIn]);

  await db.insert(apiTokens).values({
    userId,
    tokenHash,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function validateApiToken(
  token: string
): Promise<{ userId: string } | null> {
  if (!token.startsWith(PREFIX) || token.length !== PREFIX.length + TOKEN_BYTES * 2) {
    return null;
  }

  const tokenHash = hashToken(token);
  const now = new Date();

  const rows = await db
    .select({ userId: apiTokens.userId })
    .from(apiTokens)
    .where(
      and(
        eq(apiTokens.tokenHash, tokenHash),
        gt(apiTokens.expiresAt, now)
      )
    )
    .limit(1);

  return rows[0] ? { userId: rows[0].userId } : null;
}
