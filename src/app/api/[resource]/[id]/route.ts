import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  authorize,
  fail,
  isUuid,
  pickFields,
  resolveResource,
} from "@/lib/api";

type Context = { params: Promise<{ resource: string; id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { resource, id } = await params;
  const config = resolveResource(resource);
  if (!config || !isUuid(id)) return fail("Recurso nao encontrado.", 404);

  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const body = pickFields(await request.json().catch(() => null), config.fields);
  if (!body || Object.keys(body).length === 0) return fail("Corpo invalido.", 400);

  const { data, error } = await auth.supabase
    .from(config.table)
    .update(body)
    .eq("id", id)
    .select("returning" in config ? config.returning : "*")
    .single();

  if (error) {
    console.error(`[api] update ${config.table}:`, error.message);
    return fail("Nao foi possivel atualizar. Verifique os dados.", 400);
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { resource, id } = await params;
  const config = resolveResource(resource);
  if (!config || !isUuid(id)) return fail("Recurso nao encontrado.", 404);

  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const { error } = await auth.supabase.from(config.table).delete().eq("id", id);
  if (error) {
    console.error(`[api] delete ${config.table}:`, error.message);
    return fail("Nao foi possivel excluir.", 400);
  }

  return new NextResponse(null, { status: 204 });
}
