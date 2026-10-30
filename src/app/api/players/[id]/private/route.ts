import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authorize, fail, isUuid } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

/** Personal data (cpf, telefone) is loaded only when one athlete is opened for editing. */
export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!isUuid(id)) return fail("Recurso nao encontrado.", 404);

  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from("jogadores_leilao")
    .select("cpf, telefone")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[api] dados pessoais:", error.message);
    return fail("Nao foi possivel carregar.", 400);
  }
  if (!data) return fail("Recurso nao encontrado.", 404);

  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
