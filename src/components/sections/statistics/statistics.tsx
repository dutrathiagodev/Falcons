"use client";

import React, { useMemo, useState } from "react";
import TopBar from "@/components/layout/top-bar";
import OverallCard from "@/components/sections/overall-card/overall-card";
import { apiRequest } from "@/lib/api-client";
import {
  BarChart3,
  ClipboardList,
  Radar,
  Save,
  Sparkles,
} from "lucide-react";
import {
  formatMatchDate,
  getEfficiency,
  getEventTitle,
  getFirstName,
  getPlayerRatings,
  getPositionGroups,
  getTeamOverall,
  getWinRate,
  groupPerformanceByPlayer,
  isCompetitiveEvent,
  sumPerformanceField,
  type EventRecord,
  type PerformanceRecord,
  type PlayerRecord,
} from "@/lib/volleyball";

type PerformanceFormState = {
  passe_a: string;
  passe_b: string;
  passe_c: string;
  toque_bom: string;
  toque_medio: string;
  toque_ruim: string;
  saque_ace: string;
  saque_bom: string;
  saque_erro: string;
  ataque_ponto: string;
  ataque_medio: string;
  ataque_erro: string;
  bloqueio_ponto: string;
  bloqueio_medio: string;
  bloqueio_erro: string;
  nocao_boa: string;
  nocao_media: string;
  nocao_ruim: string;
  pulo_bom: string;
  pulo_medio: string;
  pulo_ruim: string;
  observacoes: string;
};

const EMPTY_FORM: PerformanceFormState = {
  passe_a: "0",
  passe_b: "0",
  passe_c: "0",
  toque_bom: "0",
  toque_medio: "0",
  toque_ruim: "0",
  saque_ace: "0",
  saque_bom: "0",
  saque_erro: "0",
  ataque_ponto: "0",
  ataque_medio: "0",
  ataque_erro: "0",
  bloqueio_ponto: "0",
  bloqueio_medio: "0",
  bloqueio_erro: "0",
  nocao_boa: "0",
  nocao_media: "0",
  nocao_ruim: "0",
  pulo_bom: "0",
  pulo_medio: "0",
  pulo_ruim: "0",
  observacoes: "",
};

const PERFORMANCE_SECTIONS = [
  {
    title: "Passe",
    note: "A soma +1 no rating de passe. B fica neutro. C desconta -3.",
    fields: [
      { key: "passe_a", label: "Passe A" },
      { key: "passe_b", label: "Passe B" },
      { key: "passe_c", label: "Passe C" },
    ],
  },
  {
    title: "Toque",
    note: "Bom +1, medio neutro, ruim -1.",
    fields: [
      { key: "toque_bom", label: "Bom" },
      { key: "toque_medio", label: "Medio" },
      { key: "toque_ruim", label: "Ruim" },
    ],
  },
  {
    title: "Saque",
    note: "Ace e bom ajudam; erro pesa negativamente.",
    fields: [
      { key: "saque_ace", label: "Ace" },
      { key: "saque_bom", label: "Bom" },
      { key: "saque_erro", label: "Erro" },
    ],
  },
  {
    title: "Ataque",
    note: "Ponto +1, medio neutro, erro -1.",
    fields: [
      { key: "ataque_ponto", label: "Ponto" },
      { key: "ataque_medio", label: "Medio" },
      { key: "ataque_erro", label: "Erro" },
    ],
  },
  {
    title: "Bloqueio",
    note: "Ponto +1, medio neutro, erro -1.",
    fields: [
      { key: "bloqueio_ponto", label: "Ponto" },
      { key: "bloqueio_medio", label: "Medio" },
      { key: "bloqueio_erro", label: "Erro" },
    ],
  },
  {
    title: "Nocao",
    note: "Boa +1, media neutro, ruim -1.",
    fields: [
      { key: "nocao_boa", label: "Boa" },
      { key: "nocao_media", label: "Media" },
      { key: "nocao_ruim", label: "Ruim" },
    ],
  },
  {
    title: "Pulo",
    note: "Bom +1, medio neutro, ruim -1.",
    fields: [
      { key: "pulo_bom", label: "Bom" },
      { key: "pulo_medio", label: "Medio" },
      { key: "pulo_ruim", label: "Ruim" },
    ],
  },
] as const;

function normalizeRecordToForm(record?: PerformanceRecord): PerformanceFormState {
  if (!record) return EMPTY_FORM;

  return {
    passe_a: String(record.passe_a ?? 0),
    passe_b: String(record.passe_b ?? 0),
    passe_c: String(record.passe_c ?? 0),
    toque_bom: String(record.toque_bom ?? 0),
    toque_medio: String(record.toque_medio ?? 0),
    toque_ruim: String(record.toque_ruim ?? 0),
    saque_ace: String(record.saque_ace ?? 0),
    saque_bom: String(record.saque_bom ?? 0),
    saque_erro: String(record.saque_erro ?? 0),
    ataque_ponto: String(record.ataque_ponto ?? 0),
    ataque_medio: String(record.ataque_medio ?? 0),
    ataque_erro: String(record.ataque_erro ?? 0),
    bloqueio_ponto: String(record.bloqueio_ponto ?? 0),
    bloqueio_medio: String(record.bloqueio_medio ?? 0),
    bloqueio_erro: String(record.bloqueio_erro ?? 0),
    nocao_boa: String(record.nocao_boa ?? 0),
    nocao_media: String(record.nocao_media ?? 0),
    nocao_ruim: String(record.nocao_ruim ?? 0),
    pulo_bom: String(record.pulo_bom ?? 0),
    pulo_medio: String(record.pulo_medio ?? 0),
    pulo_ruim: String(record.pulo_ruim ?? 0),
    observacoes: record.observacoes || "",
  };
}

export default function StatisticsClient({
  initialEvents,
  initialPerformance,
  players,
}: {
  initialEvents: EventRecord[];
  initialPerformance: PerformanceRecord[];
  players: PlayerRecord[];
}) {
  const [activeTab, setActiveTab] = useState<"team" | "players" | "register">(
    "team",
  );
  const [records, setRecords] = useState<PerformanceRecord[]>(initialPerformance);
  const [selectedEventId, setSelectedEventId] = useState(initialEvents[0]?.id || "");
  const [selectedPlayerId, setSelectedPlayerId] = useState(players[0]?.id || "");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState<PerformanceFormState>(() =>
    normalizeRecordToForm(
      initialPerformance.find(
        (record) =>
          record.evento_id === (initialEvents[0]?.id || "") &&
          record.jogador_id === (players[0]?.id || ""),
      ),
    ),
  );

  const groupedRecords = useMemo(() => groupPerformanceByPlayer(records), [records]);
  const teamOverall = useMemo(() => getTeamOverall(players, groupedRecords), [groupedRecords, players]);
  const positionGroups = getPositionGroups(players);
  const matchEvents = initialEvents.filter(isCompetitiveEvent);
  const selectedEvent = initialEvents.find((event) => event.id === selectedEventId);
  const selectedPlayer = players.find((player) => player.id === selectedPlayerId);
  const currentRecord = records.find(
    (record) =>
      record.evento_id === selectedEventId && record.jogador_id === selectedPlayerId,
  );

  const playerCards = useMemo(
    () =>
      players
        .map((player) => ({
          player,
          ratings: getPlayerRatings(player, groupedRecords[player.id] || []),
        }))
        .sort((a, b) => b.ratings.overall - a.ratings.overall),
    [groupedRecords, players],
  );

  function patchForm<K extends keyof PerformanceFormState>(
    key: K,
    value: PerformanceFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleEventChange(nextEventId: string) {
    setSelectedEventId(nextEventId);
    setForm(
      normalizeRecordToForm(
        records.find(
          (record) =>
            record.evento_id === nextEventId && record.jogador_id === selectedPlayerId,
        ),
      ),
    );
  }

  function handlePlayerChange(nextPlayerId: string) {
    setSelectedPlayerId(nextPlayerId);
    setForm(
      normalizeRecordToForm(
        records.find(
          (record) =>
            record.evento_id === selectedEventId && record.jogador_id === nextPlayerId,
        ),
      ),
    );
  }

  function incrementPass(field: "passe_a" | "passe_b" | "passe_c") {
    patchForm(field, String((parseInt(form[field], 10) || 0) + 1));
  }

  async function savePerformance() {
    if (!selectedEventId || !selectedPlayerId) {
      setFeedback({ type: "error", text: "Selecione evento e atleta." });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const body = {
        evento_id: selectedEventId,
        jogador_id: selectedPlayerId,
        passe_a: parseInt(form.passe_a, 10) || 0,
        passe_b: parseInt(form.passe_b, 10) || 0,
        passe_c: parseInt(form.passe_c, 10) || 0,
        toque_bom: parseInt(form.toque_bom, 10) || 0,
        toque_medio: parseInt(form.toque_medio, 10) || 0,
        toque_ruim: parseInt(form.toque_ruim, 10) || 0,
        saque_ace: parseInt(form.saque_ace, 10) || 0,
        saque_bom: parseInt(form.saque_bom, 10) || 0,
        saque_erro: parseInt(form.saque_erro, 10) || 0,
        ataque_ponto: parseInt(form.ataque_ponto, 10) || 0,
        ataque_medio: parseInt(form.ataque_medio, 10) || 0,
        ataque_erro: parseInt(form.ataque_erro, 10) || 0,
        bloqueio_ponto: parseInt(form.bloqueio_ponto, 10) || 0,
        bloqueio_medio: parseInt(form.bloqueio_medio, 10) || 0,
        bloqueio_erro: parseInt(form.bloqueio_erro, 10) || 0,
        nocao_boa: parseInt(form.nocao_boa, 10) || 0,
        nocao_media: parseInt(form.nocao_media, 10) || 0,
        nocao_ruim: parseInt(form.nocao_ruim, 10) || 0,
        pulo_bom: parseInt(form.pulo_bom, 10) || 0,
        pulo_medio: parseInt(form.pulo_medio, 10) || 0,
        pulo_ruim: parseInt(form.pulo_ruim, 10) || 0,
        observacoes: form.observacoes.trim() || null,
      };

      const saved = await apiRequest<PerformanceRecord>("/api/stats", "POST", body);

      setRecords((current) => {
        const hasCurrent = current.some((record) => record.id === saved.id);
        if (hasCurrent) {
          return current.map((record) => (record.id === saved.id ? saved : record));
        }

        const replacedByKey = current.map((record) =>
          record.evento_id === saved.evento_id && record.jogador_id === saved.jogador_id
            ? saved
            : record,
        );

        const foundKey = replacedByKey.some((record) => record.id === saved.id);
        return foundKey ? replacedByKey : [...replacedByKey, saved];
      });

      setFeedback({ type: "success", text: "Desempenho registrado com sucesso." });
    } catch (error: unknown) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Falha ao salvar desempenho.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-shell">
      <TopBar
        title="Leitura estatistica"
        badge="Performance e overall"
        description="Registre fundamentos por evento, atualize o overall visual dos atletas e acompanhe o desempenho geral da atletica com base na sua planilha."
      />

      <div className="tabs">
        <button
          className={`tab ${activeTab === "team" ? "active" : ""}`}
          onClick={() => setActiveTab("team")}
        >
          Geral
        </button>
        <button
          className={`tab ${activeTab === "players" ? "active" : ""}`}
          onClick={() => setActiveTab("players")}
        >
          Cards
        </button>
        <button
          className={`tab ${activeTab === "register" ? "active" : ""}`}
          onClick={() => setActiveTab("register")}
        >
          Registro
        </button>
      </div>

      {activeTab === "team" ? (
        <>
          <section className="stats-grid">
            <article className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Overall da atletica</span>
                <Sparkles size={18} className="tone-success" />
              </div>
              <div className="stat-number">{teamOverall}</div>
              <div className="stat-trend">Media visual dos overalls individuais</div>
            </article>
            <article className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Eventos analisados</span>
                <ClipboardList size={18} className="tone-info" />
              </div>
              <div className="stat-number">
                {new Set(records.map((record) => record.evento_id)).size}
              </div>
              <div className="stat-trend">Treinos e jogos com desempenho registrado</div>
            </article>
            <article className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Passe A acumulado</span>
                <Radar size={18} className="tone-warning" />
              </div>
              <div className="stat-number">{sumPerformanceField(records, "passe_a")}</div>
              <div className="stat-trend">
                Passe C acumulado: {sumPerformanceField(records, "passe_c")}
              </div>
            </article>
            <article className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Aproveitamento competitivo</span>
                <BarChart3 size={18} className="tone-success" />
              </div>
              <div className="stat-number">{getWinRate(matchEvents)}%</div>
              <div className="stat-trend">
                {matchEvents.length} jogos competitivos no historico
              </div>
            </article>
          </section>

          <section className="content-grid two-columns">
            <div className="panel">
              <h2 className="section-title">Top performances</h2>
              <p className="section-description">
                Ranking geral puxado pelo acumulado de fundamentos por atleta.
              </p>

              <div className="list-stack">
                {playerCards.slice(0, 5).map(({ player, ratings }, index) => (
                  <div key={player.id} className="list-item">
                    <span className="leader-index">{index + 1}</span>
                    <div className="list-item-meta" style={{ flex: 1 }}>
                      <strong>{player.nome}</strong>
                      <span>
                        {player.posicao || "Sem posicao"} · OVR {ratings.overall}
                      </span>
                    </div>
                    <div className="pill-row">
                      <span className="pill">Passe {ratings.passe}</span>
                      <span className="pill">Ataque {ratings.ataque}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h2 className="section-title">Distribuicao do elenco</h2>
              <p className="section-description">
                Base por funcao para cruzar desempenho com composicao do grupo.
              </p>

              <div className="metric-bar-list">
                {positionGroups.map((group) => (
                  <div key={group.position} className="metric-bar-row">
                    <span className="metric-bar-label">{group.position}</span>
                    <div className="metric-bar-track">
                      <div
                        className="metric-bar-fill"
                        style={{
                          width: `${(group.count / Math.max(players.length, 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="metric-bar-value">{group.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : null}

      {activeTab === "players" ? (
        <section className="overall-card-grid">
          {playerCards.map(({ player, ratings }) => (
            <OverallCard
              key={player.id}
              player={player}
              ratings={ratings}
              caption={player.posicao || "Leitura geral do atleta"}
            />
          ))}
        </section>
      ) : null}

      {activeTab === "register" ? (
        <section className="content-grid two-columns">
          <div className="panel">
            <h2 className="section-title">Registro por evento</h2>
            <p className="section-description">
              Estrutura inspirada na planilha: um evento, um atleta, fundamentos e contagens.
            </p>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Evento</label>
                <select
                  className="form-select"
                  value={selectedEventId}
                  onChange={(e) => handleEventChange(e.target.value)}
                >
                  {initialEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {getEventTitle(event)} · {formatMatchDate(event.data)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Atleta</label>
                <select
                  className="form-select"
                  value={selectedPlayerId}
                  onChange={(e) => handlePlayerChange(e.target.value)}
                >
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="notice">
              Passe A soma +1 no rating de passe, Passe B fica neutro e Passe C tira
              -3. Nos outros fundamentos, bom/ponto/boa soma +1, medio fica neutro e
              ruim/erro tira -1.
            </div>

            <div className="pill-row" style={{ marginTop: 14 }}>
              <button className="btn btn-primary btn-sm" onClick={() => incrementPass("passe_a")}>
                Passe A
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => incrementPass("passe_b")}>
                Passe B
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => incrementPass("passe_c")}>
                Passe C
              </button>
            </div>

            <div className="performance-sections">
              {PERFORMANCE_SECTIONS.map((section) => (
                <div key={section.title} className="performance-section-card">
                  <h3>{section.title}</h3>
                  <p>{section.note}</p>
                  <div className="performance-mini-grid">
                    {section.fields.map((field) => (
                      <div key={field.key} className="form-group">
                        <label className="form-label">{field.label}</label>
                        <input
                          className="form-input"
                          type="number"
                          min="0"
                          value={form[field.key as keyof PerformanceFormState]}
                          onChange={(e) =>
                            patchForm(
                              field.key as keyof PerformanceFormState,
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Observacoes</label>
              <textarea
                className="form-input"
                value={form.observacoes}
                onChange={(e) => patchForm("observacoes", e.target.value)}
                placeholder="Notas do treinador sobre leitura de jogo, postura, ajuste ou evolucao."
              />
            </div>

            {feedback ? (
              <div className={`feedback-box ${feedback.type}`} style={{ marginTop: 14 }}>
                {feedback.text}
              </div>
            ) : null}

            <div className="form-actions" style={{ marginTop: 18 }}>
              <button className="btn btn-primary" onClick={savePerformance} disabled={saving}>
                <Save size={16} />
                {saving ? "Salvando..." : "Salvar desempenho"}
              </button>
            </div>
          </div>

          <div className="panel">
            <h2 className="section-title">Resumo do registro atual</h2>
            <p className="section-description">
              O que ja existe salvo para o atleta escolhido nesse evento.
            </p>

            {selectedPlayer ? (
              <OverallCard
                player={selectedPlayer}
                ratings={getPlayerRatings(
                  selectedPlayer,
                  groupedRecords[selectedPlayer.id] || [],
                )}
                compact
                caption={
                  selectedEvent
                    ? `${getFirstName(selectedPlayer.nome)} em ${getEventTitle(selectedEvent)}`
                    : "Registro individual"
                }
              />
            ) : null}

            {currentRecord ? (
              <div className="summary-stack" style={{ marginTop: 18 }}>
                <div className="summary-row">
                  <span>Eficiência de passe</span>
                  <strong>
                    {getEfficiency(
                      parseInt(form.passe_a, 10) || 0,
                      parseInt(form.passe_b, 10) || 0,
                      parseInt(form.passe_c, 10) || 0,
                    )}
                    %
                  </strong>
                </div>
                <div className="summary-row">
                  <span>Eficiência de ataque</span>
                  <strong>
                    {getEfficiency(
                      parseInt(form.ataque_ponto, 10) || 0,
                      parseInt(form.ataque_medio, 10) || 0,
                      parseInt(form.ataque_erro, 10) || 0,
                    )}
                    %
                  </strong>
                </div>
                <div className="summary-row">
                  <span>Eficiência de bloqueio</span>
                  <strong>
                    {getEfficiency(
                      parseInt(form.bloqueio_ponto, 10) || 0,
                      parseInt(form.bloqueio_medio, 10) || 0,
                      parseInt(form.bloqueio_erro, 10) || 0,
                    )}
                    %
                  </strong>
                </div>
              </div>
            ) : (
              <div className="notice" style={{ marginTop: 18 }}>
                Ainda nao existe registro salvo para esta combinacao de atleta e evento.
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
