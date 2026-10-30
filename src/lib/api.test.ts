import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const createClient = vi.fn(async () => ({ auth: { getUser } }));

vi.mock("@/lib/supabase/server", () => ({ createClient }));

const { authorize, hasSameOrigin, isUuid, pickFields, resolveResource, resources } =
  await import("@/lib/api");

function request(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/players", {
    method: "POST",
    headers: { host: "localhost:3000", ...headers },
  });
}

describe("resolveResource", () => {
  it("resolve os recursos conhecidos", () => {
    expect(resolveResource("players")?.table).toBe("jogadores_leilao");
    expect(resolveResource("games")?.table).toBe("jogos");
    expect(resolveResource("stats")?.table).toBe("estatisticas_individuais");
  });

  it("recusa recursos desconhecidos e chaves do prototype", () => {
    expect(resolveResource("users")).toBeNull();
    expect(resolveResource("__proto__")).toBeNull();
    expect(resolveResource("constructor")).toBeNull();
    expect(resolveResource("toString")).toBeNull();
  });
});

describe("allowlist de colunas", () => {
  it("nunca permite gravar id, created_at ou foto de outro dono por mass assignment", () => {
    for (const config of Object.values(resources)) {
      expect(config.fields).not.toContain("id");
      expect(config.fields).not.toContain("created_at");
    }
  });
});

describe("pickFields", () => {
  it("mantem so os campos permitidos", () => {
    const body = { nome: "Ana", id: "x", role: "admin", cpf: "123" };
    expect(pickFields(body, ["nome", "cpf"])).toEqual({ nome: "Ana", cpf: "123" });
  });

  it("ignora campos ausentes", () => {
    expect(pickFields({ nome: "Ana" }, ["nome", "apelido"])).toEqual({ nome: "Ana" });
  });

  it("rejeita corpo que nao e objeto", () => {
    expect(pickFields(null, ["nome"])).toBeNull();
    expect(pickFields("texto", ["nome"])).toBeNull();
    expect(pickFields([{ nome: "Ana" }], ["nome"])).toBeNull();
  });
});

describe("isUuid", () => {
  it("aceita UUID e recusa o resto", () => {
    expect(isUuid("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    expect(isUuid("123")).toBe(false);
    expect(isUuid("1 OR 1=1")).toBe(false);
    expect(isUuid("")).toBe(false);
  });
});

describe("hasSameOrigin", () => {
  it("aceita quando Origin bate com o host", () => {
    expect(hasSameOrigin(request({ origin: "http://localhost:3000" }))).toBe(true);
  });

  it("recusa outro dominio, Origin ausente ou invalido", () => {
    expect(hasSameOrigin(request({ origin: "https://evil.example" }))).toBe(false);
    expect(hasSameOrigin(request())).toBe(false);
    expect(hasSameOrigin(request({ origin: "nao-e-url" }))).toBe(false);
  });
});

describe("authorize", () => {
  beforeEach(() => {
    getUser.mockReset();
    createClient.mockClear();
  });

  it("devolve 403 sem consultar o Supabase quando a origem e invalida", async () => {
    const result = await authorize(request({ origin: "https://evil.example" }));
    expect(result.error?.status).toBe(403);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("devolve 401 quando nao ha sessao", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const result = await authorize(request({ origin: "http://localhost:3000" }));
    expect(result.error?.status).toBe(401);
  });

  it("libera quando origem e sessao sao validas", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const result = await authorize(request({ origin: "http://localhost:3000" }));
    expect(result.error).toBeNull();
    expect(result.user?.id).toBe("u1");
  });
});
