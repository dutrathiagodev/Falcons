"use client";

import type { PlayerRatings, PlayerRecord } from "@/lib/volleyball";
import { getEventTypeMeta, getInitials } from "@/lib/volleyball";

const STAT_LABELS: Array<{
  key: keyof Omit<PlayerRatings, "overall" | "trendScore">;
  label: string;
}> = [
  { key: "ataque", label: "ATQ" },
  { key: "passe", label: "PAS" },
  { key: "saque", label: "SAQ" },
  { key: "toque", label: "TOQ" },
  { key: "bloqueio", label: "BLQ" },
  { key: "nocao", label: "NOC" },
  { key: "pulo", label: "PUL" },
];

export default function OverallCard({
  player,
  ratings,
  caption,
  compact = false,
}: {
  player: Pick<PlayerRecord, "nome" | "posicao" | "camisa" | "foto_url">;
  ratings: PlayerRatings;
  caption?: string;
  compact?: boolean;
}) {
  const badgeMeta =
    ratings.overall >= 90
      ? getEventTypeMeta("CAMPEONATO")
      : ratings.overall >= 80
        ? getEventTypeMeta("AMISTOSO")
        : ratings.overall >= 70
          ? getEventTypeMeta("TREINO")
          : getEventTypeMeta("OUTRO");

  return (
    <article className={`overall-card ${compact ? "is-compact" : ""}`}>
      <div className="overall-card-glow" />
      <div className="overall-card-head">
        <div className="overall-rating-block">
          <span className="overall-rating-value">{ratings.overall}</span>
          <span className="overall-rating-label">OVR</span>
        </div>

        <div className="overall-player-meta">
          <span className={`event-pill ${badgeMeta.colorClass}`}>
            {player.posicao || "ATLETA"}
          </span>
          <strong>{player.nome}</strong>
          <small>{player.camisa != null ? `Camisa #${player.camisa}` : "Sem camisa definida"}</small>
        </div>
      </div>

      <div className="overall-portrait">
        {player.foto_url ? (
          <img src={player.foto_url} alt={player.nome} />
        ) : (
          <div className="overall-placeholder">{getInitials(player.nome)}</div>
        )}
      </div>

      <div className="overall-stats-grid">
        {STAT_LABELS.map((stat) => (
          <div key={stat.key} className="overall-stat-row">
            <span>{stat.label}</span>
            <strong>{ratings[stat.key]}</strong>
          </div>
        ))}
      </div>

      <div className="overall-card-footer">
        <span className={ratings.trendScore >= 0 ? "tone-success" : "tone-danger"}>
          {ratings.trendScore >= 0 ? `+${ratings.trendScore}` : ratings.trendScore} forma
        </span>
        <small>{caption || "Leitura acumulada do atleta"}</small>
      </div>
    </article>
  );
}
