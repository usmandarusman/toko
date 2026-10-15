import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const MAX_ID_LENGTH = 150;
const MAX_DELETE_BATCH = 400;

// EDIT TOKO — tetap menggunakan ID dokumen Firestore.
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!id || id.length > MAX_ID_LENGTH) {
      return NextResponse.json(
        { error: "ID toko tidak valid." },
        { status: 400 }
      );
    }

    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Data toko tidak valid." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const storeName =
      typeof data.storeName === "string"
        ? data.storeName.trim()
        : "";
    const owner =
      typeof data.owner === "string" ? data.owner.trim() : "";
    const phone =
      typeof data.phone === "string" ? data.phone.trim() : "";
    const address =
      typeof data.address === "string" ? data.address.trim() : "";

    if (!storeName) {
      return NextResponse.json(
        { error: "Nama toko wajib diisi." },
        { status: 400 }
      );
    }

    if (
      storeName.length > 100 ||
      owner.length > 100 ||
      phone.length > 30 ||
      address.length > 300
    ) {
      return NextResponse.json(
        { error: "Ada informasi toko yang terlalu panjang." },
        { status: 400 }
      );
    }

    const partnerRef = db.collection("partners").doc(id);
    const snapshot = await partnerRef.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        { error: "Toko tidak ditemukan." },
        { status: 404 }
      );
    }

    await partnerRef.update({
      storeName,
      owner,
      phone,
      address,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gagal memperbarui informasi toko:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Format JSON tidak valid." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Gagal memperbarui informasi toko." },
      { status: 500 }
    );
  }
}

// HAPUS TOKO — cari toko berdasarkan storeName dari body request.
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const body: unknown = await request.json().catch(() => null);

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Nama toko wajib dikirim." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;
    const storeName =
      typeof data.storeName === "string"
        ? data.storeName.trim()
        : "";

    if (!storeName || storeName.length > 100) {
      return NextResponse.json(
        { error: "Nama toko tidak valid." },
        { status: 400 }
      );
    }

    // Cari dokumen toko berdasarkan nama toko.
    const partnersSnapshot = await db
      .collection("partners")
      .where("storeName", "==", storeName)
      .limit(2)
      .get();

    if (partnersSnapshot.empty) {
      return NextResponse.json(
        { error: "Toko tidak ditemukan." },
        { status: 404 }
      );
    }

    // Jangan menghapus jika nama toko tidak unik.
    if (partnersSnapshot.size > 1) {
      return NextResponse.json(
        {
          error:
            "Ada lebih dari satu toko dengan nama tersebut. Pastikan nama toko unik.",
        },
        { status: 409 }
      );
    }

    const partnerDoc = partnersSnapshot.docs[0];
    const partnerRef = partnerDoc.ref;

    // Hapus riwayat stok yang storeName-nya sama persis.
    const movementsRef = db.collection("stockMovements");
    let deletedMovements = 0;

    while (true) {
      const movementsSnapshot = await movementsRef
        .where("storeName", "==", storeName)
        .limit(MAX_DELETE_BATCH)
        .get();

      if (movementsSnapshot.empty) {
        break;
      }

      const batch = db.batch();

      for (const movement of movementsSnapshot.docs) {
        batch.delete(movement.ref);
      }

      await batch.commit();
      deletedMovements += movementsSnapshot.size;
    }

    // Hapus dokumen toko setelah riwayat stok dihapus.
    await partnerRef.delete();

    return NextResponse.json({
      success: true,
      message: `Toko ${storeName} dan riwayat stok berhasil dihapus.`,
      deletedMovements,
    });
  } catch (error) {
    console.error("Gagal menghapus toko dan riwayat stok:", error);

    return NextResponse.json(
      {
        error:
          "Gagal menghapus toko atau riwayat stok. Periksa konfigurasi database.",
      },
      { status: 500 }
    );
  }
}
