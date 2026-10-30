"use client";

import React, { useMemo, useState } from "react";
import TopBar from "@/components/layout/top-bar";
import { RotateCw, ShieldAlert, Users } from "lucide-react";
import { getFirstName, getInitials } from "@/lib/volleyball";

type Player = {
  id: string;
  nome: string;
  posicao: string | null;
  camisa: number | null;
  foto_url: string | null;
};

const ROTATIONS = [1, 2, 3, 4, 5, 6] as const;
const SLOT_LABELS = ["P1", "P2", "P3", "P4", "P5", "P6"];
const COURT_ORDER = [3, 2, 1, 4, 5, 0];

export default function LineupClient({ players }: { players: Player[] }) {
  const [slots, setSlots] = useState<Record<number, (Player | null)[]>>(
    Object.fromEntries(ROTATIONS.map((rotation) => [rotation, Array(6).fill(null)])),
  );
  const [currentRotation, setCurrentRotation] = useState<(typeof ROTATIONS)[number]>(1);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const currentSlots = slots[currentRotation];
  const usedIds = new Set(currentSlots.filter(Boolean).map((player) => player!.id));
  const bench = players.filter((player) => !usedIds.has(player.id));

  const roleSummary = useMemo(() => {
    const map = new Map<string, number>();
    currentSlots.forEach((player) => {
      if (!player?.posicao) return;
      map.set(player.posicao, (map.get(player.posicao) || 0) + 1);
    });
    return Array.from(map.entries());
  }, [currentSlots]);

  function handleSlotClick(slotIndex: number) {
    const existingPlayer = currentSlots[slotIndex];

    if (existingPlayer) {
      setSlots((current) => ({
        ...current,
        [currentRotation]: current[currentRotation].map((player, index) =>
          index === slotIndex ? null : player,
        ),
      }));
      return;
    }

    if (!selectedPlayer) return;

    setSlots((current) => ({
      ...current,
      [currentRotation]: current[currentRotation].map((player, index) =>
        index === slotIndex ? selectedPlayer : player,
      ),
    }));
    setSelectedPlayer(null);
  }

  function clearLineup() {
    setSlots((current) => ({
      ...current,
      [currentRotation]: Array(6).fill(null),
    }));
    setSelectedPlayer(null);
  }

  return (
    <div className="page-shell">
      <TopBar
        title="Escalacao e rotacoes"
        badge="Tatico"
        description="Monte sextetos, organize a rotacao e tenha uma leitura imediata do equilibrio entre titulares e banco."
      />

      <section className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 className="section-title" style={{ marginBottom: 8 }}>
              <RotateCw size={18} />
              Rotacao atual
            </h2>
            <p className="section-description" style={{ marginBottom: 0 }}>
              Escolha a rotacao e clique no banco para posicionar cada atleta na quadra.
            </p>
          </div>

          <div className="rotation-strip">
            {ROTATIONS.map((rotation) => (
              <button
                key={rotation}
                className={`btn btn-sm rotation-chip ${currentRotation === rotation ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setCurrentRotation(rotation)}
              >
                Rot {rotation}
              </button>
            ))}
            <button className="btn btn-sm btn-danger" onClick={clearLineup}>
              Limpar
            </button>
          </div>
        </div>
      </section>

      <section className="lineup-layout">
        <div className="panel">
          <h2 className="section-title">Quadra</h2>
          <p className="section-description">
            {selectedPlayer
              ? `Selecione uma vaga para colocar ${getFirstName(selectedPlayer.nome)}.`
              : "Clique em um atleta no banco e depois em uma posicao da quadra."}
          </p>

          <div className="court">
            <div className="court-grid">
              {COURT_ORDER.map((slotIndex) => {
                const player = currentSlots[slotIndex];

                return (
                  <button
                    key={slotIndex}
                    className={`court-slot ${selectedPlayer && !player ? "is-highlighted" : ""}`}
                    onClick={() => handleSlotClick(slotIndex)}
                  >
                    <span className="slot-label">{SLOT_LABELS[slotIndex]}</span>
                    {player ? (
                      <div className="court-player-token">
                        {player.foto_url ? (
                          <img
                            src={player.foto_url}
                            alt={player.nome}
                            className="court-player-photo"
                          />
                        ) : (
                          <div className="court-player-placeholder">
                            {player.camisa != null
                              ? `#${player.camisa}\n${getFirstName(player.nome)}`
                              : getInitials(player.nome)}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="summary-stack">
          <div className="lineup-panel">
            <h2 className="section-title">
              <Users size={18} />
              Banco disponivel
            </h2>
            <p className="section-description">
              Selecione um atleta para encaixar na rotacao.
            </p>

            {bench.length === 0 ? (
              <div className="notice">Todos os atletas desta rotacao ja estao em quadra.</div>
            ) : (
              <div className="list-stack">
                {bench.map((player) => (
                  <button
                    key={player.id}
                    className={`bench-player ${selectedPlayer?.id === player.id ? "selected-for-lineup" : ""}`}
                    onClick={() =>
                      setSelectedPlayer((current) =>
                        current?.id === player.id ? null : player,
                      )
                    }
                  >
                    <div className="bench-mini-avatar">
                      {player.foto_url ? (
                        <img src={player.foto_url} alt={player.nome} />
                      ) : (
                        <span>{getInitials(player.nome)}</span>
                      )}
                    </div>
                    <div className="list-item-meta" style={{ textAlign: "left" }}>
                      <strong>{player.nome}</strong>
                      <span>
                        {player.posicao || "Posicao nao definida"}
                        {player.camisa != null ? ` · #${player.camisa}` : ""}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lineup-panel">
            <h2 className="section-title">Leitura da rotacao</h2>
            <p className="section-description">
              Resumo para conferir equilibrio do sexteto antes do jogo.
            </p>

            <div className="summary-stack">
              <div className="summary-row">
                <span>Jogadores em quadra</span>
                <strong>{currentSlots.filter(Boolean).length}/6</strong>
              </div>
              <div className="summary-row">
                <span>Rotacao selecionada</span>
                <strong>{currentRotation}</strong>
              </div>
              <div className="summary-row">
                <span>Posicoes preenchidas</span>
                <strong>{roleSummary.length}</strong>
              </div>
            </div>

            <div className="pill-row" style={{ marginTop: 14 }}>
              {roleSummary.length > 0 ? (
                roleSummary.map(([role, count]) => (
                  <span key={role} className="pill">
                    {role}: {count}
                  </span>
                ))
              ) : (
                <span className="helper-text">
                  Ainda nao ha jogadores suficientes para leitura da composicao.
                </span>
              )}
            </div>
          </div>

          <div className="lineup-panel">
            <h2 className="section-title">
              <ShieldAlert size={18} />
              Checklist rapido
            </h2>
            <div className="summary-stack">
              {currentSlots.map((player, index) => (
                <div key={SLOT_LABELS[index]} className="summary-row">
                  <span>{SLOT_LABELS[index]}</span>
                  <strong>{player ? getFirstName(player.nome) : "Vazio"}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
