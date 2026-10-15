
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!id || id.length > 150) {
      return NextResponse.json(
        { error: "ID toko tidak valid." },
        { status: 400 }
      );
    }

    const body: unknown = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Data transaksi tidak valid." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;
    const type = data.type;
    const amount = data.amount;
    const note = typeof data.note === "string" ? data.note.trim() : "";

    if (type !== "add" && type !== "sold") {
      return NextResponse.json(
        { error: "Jenis transaksi tidak valid." },
        { status: 400 }
      );
    }

    if (
      typeof amount !== "number" ||
      !Number.isSafeInteger(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        { error: "Jumlah harus bilangan bulat positif." },
        { status: 400 }
      );
    }

    if (note.length > 500) {
      return NextResponse.json(
        { error: "Catatan maksimal 500 karakter." },
        { status: 400 }
      );
    }

    const partnerRef = db.collection("partners").doc(id);
    const movementRef = db.collection("stockMovements").doc();

    const stockAfter = await db.runTransaction(async (transaction) => {
      const partnerSnapshot = await transaction.get(partnerRef);

      if (!partnerSnapshot.exists) {
        throw new Error("STORE_NOT_FOUND");
      }

      const partner = partnerSnapshot.data()!;
      const stockBefore = Number(partner.totalStock ?? 0);

      if (
        !Number.isSafeInteger(stockBefore) ||
        stockBefore < 0
      ) {
        throw new Error("INVALID_STOCK");
      }

      if (type === "sold" && amount > stockBefore) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      const nextStock =
        type === "add"
          ? stockBefore + amount
          : stockBefore - amount;

      if (!Number.isSafeInteger(nextStock) || nextStock < 0) {
        throw new Error("INVALID_STOCK");
      }

      const movementLabel =
        type === "add"
          ? `Tambah ${amount} unit`
          : `Terjual ${amount} unit`;

      transaction.update(partnerRef, {
        totalStock: nextStock,
        lastMovement: note
          ? `${movementLabel} — ${note}`
          : movementLabel,
        lastMovementAt: FieldValue.serverTimestamp(),
      });

      transaction.create(movementRef, {
        partnerId: id,
        storeName: String(partner.storeName ?? ""),
        type,
        amount,
        note,
        stockBefore,
        stockAfter: nextStock,
        createdAt: FieldValue.serverTimestamp(),
      });

      return nextStock;
    });

    return NextResponse.json({ stockAfter });
  } catch (error) {
    console.error("Gagal menyimpan transaksi stok:", error);

    const code = error instanceof Error ? error.message : "";

    if (code === "STORE_NOT_FOUND") {
      return NextResponse.json(
        { error: "Toko tidak ditemukan." },
        { status: 404 }
      );
    }

    if (code === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        { error: "Stok tidak cukup untuk transaksi ini." },
        { status: 400 }
      );
    }

    if (code === "INVALID_STOCK") {
      return NextResponse.json(
        { error: "Data stok tidak valid." },
        { status: 409 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Format JSON tidak valid." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Transaksi stok gagal disimpan." },
      { status: 500 }
    );
  }
}
