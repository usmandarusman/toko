
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";

function timestampToISO(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }

  if (typeof value === "string") return value;

  return "";
}

export async function GET() {
  try {
    const snapshot = await db.collection("partners").get();

    const partners = snapshot.docs.map((item) => {
      const data = item.data();
      const stock = Number(data.totalStock ?? 0);

      return {
        id: item.id,
        storeName: String(data.storeName ?? ""),
        owner: String(data.owner ?? ""),
        phone: String(data.phone ?? ""),
        address: String(data.address ?? ""),
        totalStock:
          Number.isSafeInteger(stock) && stock >= 0 ? stock : 0,
        lastMovement: String(
          data.lastMovement ?? "Belum ada transaksi"
        ),
        lastMovementAt: timestampToISO(data.lastMovementAt),
      };
    });

    return NextResponse.json(
      { partners },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Gagal mengambil daftar toko:", error);

    return NextResponse.json(
      { error: "Gagal mengambil data toko." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const partnerRef = db.collection("partners").doc();

    await partnerRef.create({
      storeName,
      owner,
      phone,
      address,
      totalStock: 0,
      lastMovement: "Toko dibuat",
      lastMovementAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      { id: partnerRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gagal menambahkan toko:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Format JSON tidak valid." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Gagal menyimpan toko." },
      { status: 500 }
    );
  }
}
