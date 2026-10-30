import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fail, hasSameOrigin, needsSecondFactor } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return fail("Origem invalida.", 403);

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) return fail("Informe e-mail e senha.", 400);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return fail("E-mail ou senha invalidos.", 401);

  return NextResponse.json({ ok: true, mfaRequired: await needsSecondFactor(supabase) });
}
