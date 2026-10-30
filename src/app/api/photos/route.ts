import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authorize, fail } from "@/lib/api";

const BUCKET = "fotos-jogadores";
const MAX_BYTES = 2 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: NextRequest) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail("Arquivo nao enviado.", 400);

  const extension = EXTENSIONS[file.type];
  if (!extension) return fail("Use uma imagem JPG, PNG ou WEBP.", 400);
  if (file.size > MAX_BYTES) return fail("A imagem deve ter no maximo 2 MB.", 400);

  const path = `${auth.user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await auth.supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type });

  if (error) {
    console.error("[api] upload foto:", error.message);
    return fail("Nao foi possivel enviar a foto.", 400);
  }

  const { data } = auth.supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
