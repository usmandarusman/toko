
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(
  _request: Request,
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

    const partnerRef = db.collection("partners").doc(id);
    const snapshot = await partnerRef.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        { error: "Toko tidak ditemukan." },
        { status: 404 }
      );
    }

    await partnerRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gagal menghapus toko:", error);

    return NextResponse.json(
      { error: "Gagal menghapus toko." },
      { status: 500 }
    );
  }
}
