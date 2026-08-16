import { createHash } from "crypto";
import webpush, { WebPushError } from "web-push";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";

export type SubscribeInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
  deviceType?: string | null;
  expirationTime?: number | null;
};

export type SendToUserParams = {
  userId: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
};

function hashEndpoint(endpoint: string): string {
  return createHash("sha256").update(endpoint).digest("hex");
}

function vapidConfigured(): boolean {
  return Boolean(
    process.env.VAPID_SUBJECT &&
      process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY
  );
}

function configureVapid(): boolean {
  if (!vapidConfigured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!.replace(/=/g, "")
  );
  return true;
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null;
}

export async function upsertSubscription(
  userId: string,
  input: SubscribeInput
) {
  const endpoint = input.endpoint.trim();
  const p256dh = input.p256dh.trim();
  const auth = input.auth.trim();
  if (!endpoint || !p256dh || !auth) {
    return { error: "Faltan endpoint, p256dh o auth" };
  }

  const endpointHash = hashEndpoint(endpoint);
  const now = new Date();
  const userAgent = input.userAgent?.trim() || null;
  const deviceType = input.deviceType?.trim() || null;
  const expirationTime =
    typeof input.expirationTime === "number" &&
    Number.isFinite(input.expirationTime)
      ? Math.trunc(input.expirationTime)
      : null;

  const existing = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpointHash, endpointHash))
    .limit(1);

  const row = existing[0];
  if (row) {
    await db
      .update(pushSubscriptions)
      .set({
        userId,
        endpoint,
        p256dh,
        auth,
        userAgent,
        deviceType,
        expirationTime,
        lastSeenAt: now,
        lastError: null,
        updatedAt: now,
      })
      .where(eq(pushSubscriptions.id, row.id));
    return { success: true, id: row.id };
  }

  const inserted = await db
    .insert(pushSubscriptions)
    .values({
      userId,
      endpoint,
      endpointHash,
      p256dh,
      auth,
      userAgent,
      deviceType,
      expirationTime,
      lastSeenAt: now,
    })
    .returning({ id: pushSubscriptions.id });

  return { success: true, id: inserted[0]?.id };
}

export async function listSubscriptions(userId: string) {
  return db
    .select({
      id: pushSubscriptions.id,
      deviceType: pushSubscriptions.deviceType,
      userAgent: pushSubscriptions.userAgent,
      lastSeenAt: pushSubscriptions.lastSeenAt,
      createdAt: pushSubscriptions.createdAt,
    })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))
    .orderBy(desc(pushSubscriptions.lastSeenAt), desc(pushSubscriptions.createdAt));
}

export async function deleteSubscription(userId: string, id: number) {
  const deleted = await db
    .delete(pushSubscriptions)
    .where(
      and(eq(pushSubscriptions.id, id), eq(pushSubscriptions.userId, userId))
    )
    .returning({ id: pushSubscriptions.id });
  return deleted.length > 0;
}

export async function sendToUser(
  params: SendToUserParams
): Promise<{ sent: number; failed: number }> {
  if (!configureVapid()) {
    return { sent: 0, failed: 0 };
  }

  const { userId, title, body, url, tag, data } = params;
  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const payload = JSON.stringify({
    title,
    body,
    url: url || "/",
    tag: tag || "default",
    data: data || {},
  });

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
        { TTL: 86400, urgency: "normal" }
      );
      sent += 1;
      await db
        .update(pushSubscriptions)
        .set({ lastSeenAt: new Date(), lastError: null, updatedAt: new Date() })
        .where(eq(pushSubscriptions.id, sub.id));
    } catch (err) {
      failed += 1;
      const statusCode =
        err instanceof WebPushError ? err.statusCode : undefined;
      if (statusCode && [404, 410, 403].includes(statusCode)) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id));
        continue;
      }
      const message =
        err instanceof Error ? err.message.slice(0, 255) : "Error al enviar";
      await db
        .update(pushSubscriptions)
        .set({ lastError: message, updatedAt: new Date() })
        .where(eq(pushSubscriptions.id, sub.id));
    }
  }

  return { sent, failed };
}
