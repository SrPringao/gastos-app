import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/services/push-notifications";

export const runtime = "nodejs";

export async function GET() {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return NextResponse.json(
      { error: "VAPID no configurado" },
      { status: 503 }
    );
  }
  return NextResponse.json({ publicKey });
}
