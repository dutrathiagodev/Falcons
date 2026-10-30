import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export const PHOTO_BUCKET = "fotos-jogadores";
const SIGNED_URL_TTL_SECONDS = 60 * 60;
// Older rows store the full public URL; new rows store only the object path.
const PUBLIC_URL_MARKER = `/storage/v1/object/public/${PHOTO_BUCKET}/`;

/** Object path inside the bucket, or null when the value is not one of our photos. */
export function toPhotoPath(value?: string | null): string | null {
  if (!value) return null;

  const markerIndex = value.indexOf(PUBLIC_URL_MARKER);
  if (markerIndex >= 0) {
    const path = value.slice(markerIndex + PUBLIC_URL_MARKER.length).split("?")[0];
    return decodeURIComponent(path) || null;
  }

  if (/^[a-z]+:/i.test(value)) return null;
  return value;
}

/** Replaces foto_url with a short-lived signed URL (the bucket is private). */
export async function withSignedPhotos<T extends { foto_url?: string | null }>(
  supabase: ServerClient,
  rows: T[],
): Promise<T[]> {
  const paths = [...new Set(rows.map((row) => toPhotoPath(row.foto_url)).filter(Boolean))] as string[];
  if (paths.length === 0) return rows.map((row) => ({ ...row, foto_url: null }));

  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  if (error) console.error("[photos] assinatura:", error.message);

  const signed = new Map(
    (data ?? []).filter((item) => item.path && item.signedUrl).map((item) => [item.path, item.signedUrl]),
  );

  return rows.map((row) => {
    const path = toPhotoPath(row.foto_url);
    return { ...row, foto_url: path ? (signed.get(path) ?? null) : null };
  });
}
