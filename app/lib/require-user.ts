import { NextRequest } from "next/server";
import { getAuth } from "firebase-admin/auth";

/**
 * Verifikasi Firebase ID token yang dikirim client lewat Authorization: Bearer.
 * Gunakan hanya di Route Handler server; jangan percaya uid dari body/request params.
 */
export async function getRequestUser(request: NextRequest): Promise<{ uid: string } | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return null;

  try {
    const decoded = await getAuth().verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}
