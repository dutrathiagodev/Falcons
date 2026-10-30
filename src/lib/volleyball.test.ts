import { describe, expect, it } from "vitest";
import {
  getAverageHeight,
  getEfficiency,
  getEventTitle,
  getFirstName,
  getInitials,
  getPositionGroups,
  getRecentGames,
  getResult,
  getSetBalance,
  getStatusLabel,
  getStatusTone,
  getWinRate,
  isCompetitiveEvent,
  type EventRecord,
  type PlayerRecord,
} from "@/lib/volleyball";

const game = (overrides: Partial<EventRecord>): EventRecord => ({
  id: "g",
  data: "2026-03-10",
  tipo: "AMISTOSO",
  placar_nos: 0,
  placar_eles: 0,
  ...overrides,
});

const player = (overrides: Partial<PlayerRecord>): PlayerRecord => ({
  id: "p",
  nome: "Atleta",
  ...overrides,
});

describe("nomes", () => {
  it("gera iniciais e primeiro nome", () => {
    expect(getInitials("thiago dutra silva")).toBe("TD");
    expect(getInitials("  ana  ")).toBe("A");
    expect(getFirstName("Ana Souza")).toBe("Ana");
  });
});

describe("status do atleta", () => {
  it("traduz rotulos e tons", () => {
    expect(getStatusLabel(null)).toBe("Disponivel");
    expect(getStatusLabel("LESIONADO")).toBe("Lesionado");
    expect(getStatusLabel("OUTRO")).toBe("OUTRO");
    expect(getStatusTone("LESIONADO")).toBe("danger");
    expect(getStatusTone("TITULAR")).toBe("success");
    expect(getStatusTone(undefined)).toBe("neutral");
  });
});

describe("resultado e aproveitamento", () => {
  it("classifica vitoria, derrota e empate", () => {
    expect(getResult(game({ placar_nos: 3, placar_eles: 1 }))).toBe("win");
    expect(getResult(game({ placar_nos: 0, placar_eles: 3 }))).toBe("loss");
    expect(getResult(game({ placar_nos: 2, placar_eles: 2 }))).toBe("draw");
  });

  it("so conta amistoso e campeonato", () => {
    expect(isCompetitiveEvent(game({ tipo: "CAMPEONATO" }))).toBe(true);
    expect(isCompetitiveEvent(game({ tipo: "TREINO" }))).toBe(false);
  });

  it("calcula aproveitamento e saldo ignorando treinos", () => {
    const events = [
      game({ id: "1", placar_nos: 3, placar_eles: 0 }),
      game({ id: "2", placar_nos: 1, placar_eles: 3 }),
      game({ id: "3", tipo: "TREINO", placar_nos: 3, placar_eles: 0 }),
    ];
    expect(getWinRate(events)).toBe(50);
    expect(getSetBalance(events)).toBe(1);
  });

  it("aproveitamento e 0 sem jogos", () => {
    expect(getWinRate([])).toBe(0);
    expect(getSetBalance([])).toBe(0);
  });
});

describe("titulo do evento", () => {
  it("prioriza titulo, depois adversario", () => {
    expect(getEventTitle(game({ titulo: "  Final  " }))).toBe("Final");
    expect(getEventTitle(game({ adversario: "FAP" }))).toBe("Falcons x FAP");
  });
});

describe("elenco", () => {
  it("agrupa por posicao, do maior para o menor", () => {
    const groups = getPositionGroups([
      player({ id: "1", posicao: "Ponteiro" }),
      player({ id: "2", posicao: "Ponteiro" }),
      player({ id: "3", posicao: "Libero" }),
      player({ id: "4" }),
    ]);
    expect(groups[0]).toEqual({ position: "Ponteiro", count: 2 });
    expect(groups.map((g) => g.position)).toContain("Sem posicao");
  });

  it("calcula altura media e devolve null sem dados", () => {
    expect(getAverageHeight([player({ altura: 180 }), player({ altura: 190 })])).toBe(185);
    expect(getAverageHeight([player({})])).toBeNull();
  });
});

describe("jogos recentes", () => {
  it("ordena do mais novo para o mais antigo e limita", () => {
    const events = [
      game({ id: "a", data: "2026-01-01" }),
      game({ id: "b", data: "2026-03-01" }),
      game({ id: "c", data: "2026-02-01" }),
    ];
    expect(getRecentGames(events, 2).map((e) => e.id)).toEqual(["b", "c"]);
  });
});

describe("getEfficiency", () => {
  it("calcula (positivos - negativos) / total em %", () => {
    expect(getEfficiency(6, 2, 2)).toBe(40);
    expect(getEfficiency(0, 0, 0)).toBe(0);
  });
});
