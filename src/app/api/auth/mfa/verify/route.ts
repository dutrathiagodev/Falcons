import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fail, hasSameOrigin } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

/** Verifies a 6-digit TOTP code: finishes enrollment or upgrades the session to aal2. */
export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return fail("Origem invalida.", 403);

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.replace(/\s/g, "") : "";
  if (!/^\d{6}$/.test(code)) return fail("Informe o codigo de 6 digitos.", 400);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Nao autenticado.", 401);

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor =
    factors?.all.find((item) => item.id === body?.factorId && item.factor_type === "totp") ??
    factors?.totp[0];
  if (!factor) return fail("Verificacao em duas etapas nao configurada.", 400);

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
  if (error) return fail("Codigo invalido ou expirado.", 401);

  return NextResponse.json({ ok: true });
}
