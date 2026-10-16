import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/firebase-admin";
import { getRequestUser } from "@/app/lib/require-user";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });

  try {
    const { id } = await context.params;
    if (!id || id.length > 150) return NextResponse.json({ error: "ID toko tidak valid." }, { status: 400 });

    const partnerRef = db.collection("partners").doc(id);
    const partner = await partnerRef.get();
    if (!partner.exists || partner.data()?.ownerId !== user.uid) {
      return NextResponse.json({ error: "Toko tidak ditemukan." }, { status: 404 });
    }

    const snapshot = await db.collection("stockMovements")
      .where("partnerId", "==", id)
      .where("ownerId", "==", user.uid)
      .get();

    const history = snapshot.docs.map((item) => {
      const data = item.data();
      const timestamp = data.createdAt;
      return {
        id: item.id,
        partnerId: String(data.partnerId ?? id),
        storeName: String(data.storeName ?? ""),
        type: data.type === "sold" ? "sold" : "add",
        amount: Number(data.amount ?? 0),
        note: String(data.note ?? ""),
        stockBefore: Number(data.stockBefore ?? 0),
        stockAfter: Number(data.stockAfter ?? 0),
        createdAt: timestamp && typeof timestamp.toDate === "function"
          ? timestamp.toDate().toISOString()
          : typeof timestamp === "string" ? timestamp : "",
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ history }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Gagal mengambil history toko:", error);
    return NextResponse.json({ error: "Gagal mengambil history transaksi." }, { status: 500 });
  }
}
