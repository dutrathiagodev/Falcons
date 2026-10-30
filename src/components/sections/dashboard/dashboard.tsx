import TopBar from "@/components/layout/top-bar";
import Image from "next/image";
import {
  ArrowUp,
  CalendarClock,
  Sparkles,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import {
  getEventTitle,
  formatMatchDate,
  getAverageAge,
  getAverageHeight,
  getFirstName,
  getPositionGroups,
  getRecentGames,
  getResult,
  getSetBalance,
  getTeamOverall,
  getUpcomingGames,
  getWinRate,
  groupPerformanceByPlayer,
  isCompetitiveEvent,
  type EventRecord,
  type PerformanceRecord,
  type PlayerRecord,
} from "@/lib/volleyball";


export default function Dashboard({
  players,
  events,
  performance,
}: {
  players: PlayerRecord[];
  events: EventRecord[];
  performance: PerformanceRecord[];
}) {
  const roster = players;

  const schedule = events;
  const performanceByPlayer = groupPerformanceByPlayer(performance);
  const matches = schedule.filter(isCompetitiveEvent);

  const positionGroups = getPositionGroups(roster);
  const recentGames = getRecentGames(matches, 4);
  const upcomingGames = getUpcomingGames(schedule).slice(0, 3);
  const averageHeight = getAverageHeight(roster);
  const averageAge = getAverageAge(roster);
  const setBalance = getSetBalance(matches);
  const teamOverall = getTeamOverall(roster, performanceByPlayer);
  const availability = roster.filter(
    (player) =>
      !player.status ||
      player.status === "DISPONIVEL" ||
      player.status === "ATIVO",
  ).length;

  return (
    <div className="page-shell">
      <TopBar
        title="Centro de comando da atletica"
        badge="Temporada 2026"
        description="Uma leitura rapida do elenco, da agenda competitiva e do momento tecnico do time para tomar decisoes melhores no dia a dia."
      />

      <section className="dashboard-hero-banner">
        <div className="dashboard-hero-media">
          <Image
            src="/falcons-team-hero.jpg"
            alt="Time Falcons Volei em quadra"
            fill
            priority
            sizes="(max-width: 720px) 100vw, (max-width: 1360px) 92vw, 1200px"
            className="dashboard-hero-image"
          />
          <div className="dashboard-hero-overlay" />
        </div>

        <div className="dashboard-hero-content">
          <span className="page-hero-kicker">Orgulho da Atletica FAP</span>
          <h2>Falcons Volei pronto para dominar a temporada</h2>
          <p>
            Time unido, mentalidade forte e operacao orientada por dados para
            elevar cada treino e cada jogo.
          </p>
          <div className="dashboard-hero-meta">
            <span className="status-badge success">Foco total 2026</span>
            <span className="status-badge neutral">
              Abrir o app = entrar no modo competicao
            </span>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Atletas no elenco</span>
            <Users size={18} className="tone-info" />
          </div>
          <div className="stat-number">{roster.length}</div>
          <div className="stat-trend">
            {availability} disponiveis para treino e jogo
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Aproveitamento</span>
            <Trophy size={18} className="tone-success" />
          </div>
          <div className="stat-number">{getWinRate(matches)}%</div>
          <div className="stat-trend">
            {matches.length} jogos competitivos avaliados
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Saldo de sets</span>
            <ArrowUp size={18} className={setBalance >= 0 ? "tone-success" : "tone-danger"} />
          </div>
          <div className="stat-number">{setBalance >= 0 ? `+${setBalance}` : setBalance}</div>
          <div className="stat-trend">
            Diferenca acumulada entre sets ganhos e perdidos
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Overall da atletica</span>
            <Sparkles size={18} className="tone-warning" />
          </div>
          <div className="stat-number">{teamOverall || "--"}</div>
          <div className="stat-trend">
            Altura media {averageHeight || "--"} cm · idade media {averageAge || "--"} anos
          </div>
        </article>
      </section>

      <section className="content-grid two-columns">
        <div className="panel">
          <h2 className="section-title">
            <ShieldCheck size={18} />
            Distribuicao do elenco
          </h2>
          <p className="section-description">
            Veja como o grupo esta distribuido por funcao para identificar
            carencias no banco e desequilibrios de composicao.
          </p>

          {positionGroups.length === 0 ? (
            <div className="empty-state">
              <h3>Sem atletas cadastrados</h3>
              <p>Cadastre o elenco para destravar a leitura tatica do time.</p>
            </div>
          ) : (
            <div className="metric-bar-list">
              {positionGroups.map((group) => (
                <div key={group.position} className="metric-bar-row">
                  <span className="metric-bar-label">{group.position}</span>
                  <div className="metric-bar-track">
                    <div
                      className="metric-bar-fill"
                      style={{
                        width: `${(group.count / Math.max(roster.length, 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="metric-bar-value">{group.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <h2 className="section-title">
            <CalendarClock size={18} />
            Proximos compromissos
          </h2>
          <p className="section-description">
            Agenda de curto prazo para organizar convocacao, logistica e foco
            semanal.
          </p>

          {upcomingGames.length === 0 ? (
            <div className="notice">
              Nenhum jogo futuro cadastrado. Vale registrar amistosos,
              festivais e partidas-alvo para o time se orientar melhor.
            </div>
          ) : (
            <div className="list-stack">
              {upcomingGames.map((game) => (
                <div key={game.id} className="list-item">
                  <div className="status-badge neutral">Agenda</div>
                  <div className="list-item-meta">
                    <strong>{getEventTitle(game)}</strong>
                    <span>
                      {formatMatchDate(game.data, true)}
                      {game.local ? ` · ${game.local}` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="content-grid two-columns">
        <div className="panel">
          <h2 className="section-title">Momento da temporada</h2>
          <p className="section-description">
            Indicadores interpretados para comissao, capitaes e gestao da
            atletica.
          </p>

          <div className="chip-row">
            <span className="chip">
              Elenco ativo <strong>{availability}</strong>
            </span>
            <span className="chip">
              Eventos registrados <strong>{schedule.length}</strong>
            </span>
            <span className="chip">
              Posicoes mapeadas <strong>{positionGroups.length}</strong>
            </span>
          </div>

          <div className="summary-stack" style={{ marginTop: 18 }}>
            <div className="summary-row">
              <span>Melhor uso do painel</span>
              <strong>acompanhar disponibilidade, agenda e performance</strong>
            </div>
            <div className="summary-row">
              <span>Boa proxima camada de conteudo</span>
              <strong>presenca, carga de treino e observacoes tecnicas</strong>
            </div>
            <div className="summary-row">
              <span>Leitura rapida do elenco</span>
              <strong>
                {averageHeight
                  ? `time com media de ${averageHeight} cm`
                  : "faltam dados fisicos para uma leitura melhor"}
              </strong>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2 className="section-title">Ultimos resultados</h2>
          <p className="section-description">
            Historico recente para entender tendencia competitiva e consistencia
            de desempenho.
          </p>

          {recentGames.length === 0 ? (
            <div className="empty-state">
              <h3>Ainda sem historico</h3>
              <p>Quando os jogos forem entrando, o painel ganha leitura real.</p>
            </div>
          ) : (
            <div className="list-stack">
              {recentGames.map((game) => {
                const result = getResult(game);
                const tone =
                  result === "win"
                    ? "success"
                    : result === "loss"
                      ? "danger"
                      : "warning";

                return (
                  <div key={game.id} className="list-item">
                    <span className={`status-badge ${tone}`}>
                      {result === "win"
                        ? "Vitoria"
                        : result === "loss"
                          ? "Derrota"
                          : "Empate"}
                    </span>
                    <div className="list-item-meta">
                      <strong>
                        {getEventTitle(game)}
                        {game.placar_nos != null && game.placar_eles != null
                          ? ` · ${game.placar_nos} x ${game.placar_eles}`
                          : ""}
                      </strong>
                      <span>
                        {formatMatchDate(game.data)}
                        {game.local ? ` · ${game.local}` : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title">Atletas para observar</h2>
        <p className="section-description">
          Espaço para a comissao destacar nomes de referencia e atletas que
          podem receber mais atencao na organizacao da semana.
        </p>

        {roster.length === 0 ? (
          <div className="notice">Cadastre atletas para preencher esta area.</div>
        ) : (
          <div className="players-grid">
            {roster.slice(0, 4).map((player) => (
              <article key={player.id} className="player-card">
                <div className="player-top">
                  <div className="player-left">
                    <div className="player-photo-placeholder">
                      {getFirstName(player.nome).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="player-info">
                      <div className="player-name">{player.nome}</div>
                      <div className="player-sub">
                        {player.posicao || "Posicao nao definida"}
                        {player.camisa ? ` · Camisa #${player.camisa}` : ""}
                      </div>
                      <div className="player-foot-row">
                        <span className="status-badge neutral">
                          {player.curso || "Curso nao informado"}
                        </span>
                        <span className="status-badge success">
                          {player.status || "DISPONIVEL"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
