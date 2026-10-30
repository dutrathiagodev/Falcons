import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const statFields = [
  "evento_id",
  "jogador_id",
  "passe_a",
  "passe_b",
  "passe_c",
  "toque_bom",
  "toque_medio",
  "toque_ruim",
  "saque_ace",
  "saque_bom",
  "saque_erro",
  "ataque_ponto",
  "ataque_medio",
  "ataque_erro",
  "bloqueio_ponto",
  "bloqueio_medio",
  "bloqueio_erro",
  "nocao_boa",
  "nocao_media",
  "nocao_ruim",
  "pulo_bom",
  "pulo_medio",
  "pulo_ruim",
  "observacoes",
] as const;

// Allowlist: only these tables and columns can be written through the API.
export const resources = {
  players: {
    table: "jogadores_leilao",
    fields: [
      "nome",
      "apelido",
      "posicao",
      "camisa",
      "status",
      "data_nascimento",
      "cpf",
      "telefone",
      "curso",
      "peso",
      "altura",
      "ano",
      "observacoes",
      "foto_url",
    ],
  },
  games: {
    table: "jogos",
    fields: [
      "data",
      "data_fim",
      "titulo",
      "tipo",
      "local",
      "adversario",
      "placar_nos",
      "placar_eles",
      "status",
      "observacoes",
    ],
  },
  stats: {
    table: "estatisticas_individuais",
    fields: statFields,
    upsertOn: "evento_id,jogador_id",
  },
} as const;

export type ResourceConfig = (typeof resources)[keyof typeof resources];

export function resolveResource(name: string): ResourceConfig | null {
  return Object.hasOwn(resources, name)
    ? resources[name as keyof typeof resources]
    : null;
}

export function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function pickFields(input: unknown, allowed: readonly string[]) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return null;
  }

  const source = input as Record<string, unknown>;
  const picked: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in source) picked[key] = source[key];
  }
  return picked;
}

export function hasSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Same-origin check (CSRF) + valid Supabase session, for every mutating route. */
export async function authorize(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return { error: fail("Origem invalida.", 403), supabase: null, user: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: fail("Nao autenticado.", 401), supabase: null, user: null };
  }

  return { error: null, supabase, user };
}
