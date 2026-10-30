import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authorize, fail } from "@/lib/api";

/** Starts TOTP enrollment and returns the QR code for an authenticator app. */
export async function POST(request: NextRequest) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  // Drop half-finished attempts so a new QR code can always be generated.
  const { data: factors } = await auth.supabase.auth.mfa.listFactors();
  for (const factor of factors?.all ?? []) {
    if (factor.status === "unverified") {
      await auth.supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }
  if ((factors?.totp ?? []).length > 0) return fail("Verificacao em duas etapas ja esta ativa.", 409);

  const { data, error } = await auth.supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Falcons",
  });

  if (error) {
    console.error("[api] mfa enroll:", error.message);
    return fail("Nao foi possivel iniciar a verificacao.", 400);
  }

  return NextResponse.json(
    { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret },
    { headers: { "Cache-Control": "no-store" } },
  );
}
