import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fail, hasSameOrigin } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return fail("Origem invalida.", 403);

  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
