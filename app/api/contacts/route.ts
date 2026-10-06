import { NextRequest, NextResponse } from "next/server";
import { createContact, getContacts } from "@/lib/services/contacts";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const includeArchived = new URL(request.url).searchParams.get("archived") === "1";
    const list = await getContacts(userId, { includeArchived });
    return NextResponse.json(list);
  } catch (error) {
    console.error("[API] GET /api/contacts:", error);
    return NextResponse.json({ error: "Error al obtener personas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const body = await request.json();
    const result = await createContact(userId, String(body.name ?? ""));
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ contact: result.contact, existed: result.existed });
  } catch (error) {
    console.error("[API] POST /api/contacts:", error);
    return NextResponse.json({ error: "Error al crear persona" }, { status: 500 });
  }
}
