import { describe, expect, it, vi } from "vitest";
import { toPhotoPath, withSignedPhotos } from "@/lib/photos";

describe("toPhotoPath", () => {
  it("extrai o caminho de uma URL publica antiga", () => {
    expect(
      toPhotoPath("https://abc.supabase.co/storage/v1/object/public/fotos-jogadores/u1/foto%201.jpg"),
    ).toBe("u1/foto 1.jpg");
  });

  it("mantem caminhos novos e recusa URLs de outros lugares", () => {
    expect(toPhotoPath("u1/abc.webp")).toBe("u1/abc.webp");
    expect(toPhotoPath("https://evil.example/foto.jpg")).toBeNull();
    expect(toPhotoPath("data:image/png;base64,AAA")).toBeNull();
    expect(toPhotoPath(null)).toBeNull();
  });
});

describe("withSignedPhotos", () => {
  it("troca o caminho pela URL assinada e zera o que nao e foto nossa", async () => {
    const createSignedUrls = vi.fn(async (paths: string[]) => ({
      data: paths.map((path) => ({ path, signedUrl: `https://signed/${path}` })),
      error: null,
    }));
    const supabase = { storage: { from: () => ({ createSignedUrls }) } };

    const rows = await withSignedPhotos(supabase as never, [
      { id: "1", foto_url: "u1/a.webp" },
      { id: "2", foto_url: "https://evil.example/x.jpg" },
      { id: "3", foto_url: null },
    ]);

    expect(createSignedUrls).toHaveBeenCalledWith(["u1/a.webp"], 3600);
    expect(rows.map((row) => row.foto_url)).toEqual(["https://signed/u1/a.webp", null, null]);
  });
});
