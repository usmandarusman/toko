import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/firebase-admin";
import { getRequestUser } from "@/app/lib/require-user";

type RouteContext = { params: Promise<{ id: string }> };
const MAX_ID_LENGTH = 150;
const MAX_DELETE_BATCH = 400;

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });

  try {
    const { id } = await context.params;
    if (!id || id.length > MAX_ID_LENGTH) return NextResponse.json({ error: "ID toko tidak valid." }, { status: 400 });

    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Data toko tidak valid." }, { status: 400 });
    }
    const data = body as Record<string, unknown>;
    const storeName = typeof data.storeName === "string" ? data.storeName.trim() : "";
    const owner = typeof data.owner === "string" ? data.owner.trim() : "";
    const phone = typeof data.phone === "string" ? data.phone.trim() : "";
    const address = typeof data.address === "string" ? data.address.trim() : "";

    if (!storeName) return NextResponse.json({ error: "Nama toko wajib diisi." }, { status: 400 });
    if (storeName.length > 100 || owner.length > 100 || phone.length > 30 || address.length > 300) {
      return NextResponse.json({ error: "Ada informasi toko yang terlalu panjang." }, { status: 400 });
    }

    const partnerRef = db.collection("partners").doc(id);
    const snapshot = await partnerRef.get();
    if (!snapshot.exists || snapshot.data()?.ownerId !== user.uid) {
      return NextResponse.json({ error: "Toko tidak ditemukan." }, { status: 404 });
    }
    await partnerRef.update({ storeName, owner, phone, address });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gagal memperbarui informasi toko:", error);
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Format JSON tidak valid." }, { status: 400 });
    return NextResponse.json({ error: "Gagal memperbarui informasi toko." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });

  try {
    const { id } = await context.params;
    if (!id || id.length > MAX_ID_LENGTH) return NextResponse.json({ error: "ID toko tidak valid." }, { status: 400 });

    const partnerRef = db.collection("partners").doc(id);
    const snapshot = await partnerRef.get();
    if (!snapshot.exists || snapshot.data()?.ownerId !== user.uid) {
      return NextResponse.json({ error: "Toko tidak ditemukan." }, { status: 404 });
    }

    let deletedMovements = 0;
    while (true) {
      const movements = await db.collection("stockMovements")
        .where("partnerId", "==", id)
        .where("ownerId", "==", user.uid)
        .limit(MAX_DELETE_BATCH)
        .get();
      if (movements.empty) break;
      const batch = db.batch();
      for (const movement of movements.docs) batch.delete(movement.ref);
      await batch.commit();
      deletedMovements += movements.size;
    }
    await partnerRef.delete();
    return NextResponse.json({ success: true, message: "Toko dan riwayat stok berhasil dihapus.", deletedMovements });
  } catch (error) {
    console.error("Gagal menghapus toko dan riwayat stok:", error);
    return NextResponse.json({ error: "Gagal menghapus toko atau riwayat stok." }, { status: 500 });
  }
}
