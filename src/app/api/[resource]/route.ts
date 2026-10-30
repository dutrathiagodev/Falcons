import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authorize, fail, pickFields, resolveResource } from "@/lib/api";

type Context = { params: Promise<{ resource: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const config = resolveResource((await params).resource);
  if (!config) return fail("Recurso nao encontrado.", 404);

  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const body = pickFields(await request.json().catch(() => null), config.fields);
  if (!body) return fail("Corpo invalido.", 400);

  const table = auth.supabase.from(config.table);
  const query =
    "upsertOn" in config
      ? table.upsert([body], { onConflict: config.upsertOn })
      : table.insert([body]);

  const { data, error } = await query
    .select("returning" in config ? config.returning : "*")
    .single();
  if (error) {
    console.error(`[api] insert ${config.table}:`, error.message);
    return fail("Nao foi possivel salvar. Verifique os dados.", 400);
  }

  return NextResponse.json(data, { status: 201 });
}
