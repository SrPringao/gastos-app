import { NextRequest, NextResponse } from "next/server";
import { getAccountById, updateAccount } from "@/lib/services/accounts";

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = Number((await params).id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalido" }, { status: 400 });
    }

    const { getCurrentUserId } = await import("@/lib/auth");
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const account = await getAccountById(id);
    if (!account) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }
    if (account.userId && account.userId !== userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "No se envio ninguna imagen" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "La imagen no debe superar 2MB" },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato no permitido. Usa JPEG, PNG o WebP" },
        { status: 400 }
      );
    }

    const fileServerUrl = process.env.FILE_SERVER_URL;
    const fileServerSecret = process.env.FILE_SERVER_SECRET;
    if (!fileServerUrl || !fileServerSecret) {
      console.error("[API] Faltan FILE_SERVER_URL / FILE_SERVER_SECRET");
      return NextResponse.json(
        { error: "Servicio de imagenes no configurado" },
        { status: 500 }
      );
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${id}-${Date.now()}.${ext}`;
    const uploadForm = new FormData();
    uploadForm.append("file", file, path);

    const uploadResponse = await fetch(`${fileServerUrl}/upload`, {
      method: "POST",
      headers: { "X-Upload-Secret": fileServerSecret },
      body: uploadForm,
    });

    if (!uploadResponse.ok) {
      console.error("[API] Upload error:", await uploadResponse.text());
      return NextResponse.json(
        { error: "Error al subir la imagen" },
        { status: 500 }
      );
    }

    const { url: imageUrl } = (await uploadResponse.json()) as {
      url: string;
    };

    const updateResult = await updateAccount(userId, id, { imageUrl });
    if (updateResult.error) {
      return NextResponse.json({ error: updateResult.error }, { status: 500 });
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("[API] POST /api/accounts/[id]/upload:", error);
    return NextResponse.json(
      { error: "Error al subir imagen" },
      { status: 500 }
    );
  }
}
