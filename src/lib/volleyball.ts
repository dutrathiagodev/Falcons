export type PlayerRecord = {
  id: string;
  nome: string;
  apelido?: string | null;
  posicao?: string | null;
  camisa?: number | null;
  foto_url?: string | null;
  status?: string | null;
  data_nascimento?: string | null;
  curso?: string | null;
  altura?: number | null;
  peso?: number | null;
  ano?: number | null;
  observacoes?: string | null;
};

export type EventRecord = {
  id: string;
  data: string;
  data_fim?: string | null;
  titulo?: string | null;
  tipo?: string | null;
  status?: string | null;
  local?: string | null;
  adversario?: string | null;
  placar_nos?: number | null;
  placar_eles?: number | null;
  observacoes?: string | null;
};

export type PerformanceRecord = {
  id: string;
  evento_id: string;
  jogador_id: string;
  passe_a?: number | null;
  passe_b?: number | null;
  passe_c?: number | null;
  toque_bom?: number | null;
  toque_medio?: number | null;
  toque_ruim?: number | null;
  saque_ace?: number | null;
  saque_bom?: number | null;
  saque_erro?: number | null;
  ataque_ponto?: number | null;
  ataque_medio?: number | null;
  ataque_erro?: number | null;
  bloqueio_ponto?: number | null;
  bloqueio_medio?: number | null;
  bloqueio_erro?: number | null;
  nocao_boa?: number | null;
  nocao_media?: number | null;
  nocao_ruim?: number | null;
  pulo_bom?: number | null;
  pulo_medio?: number | null;
  pulo_ruim?: number | null;
  observacoes?: string | null;
};

export type PlayerRatings = {
  passe: number;
  toque: number;
  saque: number;
  ataque: number;
  bloqueio: number;
  nocao: number;
  pulo: number;
  overall: number;
  trendScore: number;
};

type PositionBaseRatings = Omit<PlayerRatings, "overall" | "trendScore">;

const POSITION_BASE_MAP: Record<string, PositionBaseRatings> = {
  LEVANTADOR: {
    passe: 74,
    toque: 84,
    saque: 68,
    ataque: 67,
    bloqueio: 62,
    nocao: 77,
    pulo: 69,
  },
  LIBERO: {
    passe: 86,
    toque: 72,
    saque: 60,
    ataque: 48,
    bloqueio: 45,
    nocao: 82,
    pulo: 60,
  },
  CENTRAL: {
    passe: 58,
    toque: 63,
    saque: 66,
    ataque: 78,
    bloqueio: 85,
    nocao: 72,
    pulo: 84,
  },
  OPOSTO: {
    passe: 60,
    toque: 62,
    saque: 72,
    ataque: 87,
    bloqueio: 75,
    nocao: 68,
    pulo: 82,
  },
  PONTEIRO: {
    passe: 74,
    toque: 69,
    saque: 74,
    ataque: 80,
    bloqueio: 70,
    nocao: 73,
    pulo: 79,
  },
  "PONTA/OPOSTO": {
    passe: 70,
    toque: 66,
    saque: 74,
    ataque: 83,
    bloqueio: 71,
    nocao: 70,
    pulo: 80,
  },
  DEFAULT: {
    passe: 70,
    toque: 70,
    saque: 70,
    ataque: 70,
    bloqueio: 70,
    nocao: 70,
    pulo: 70,
  },
};

const EVENT_TYPE_META: Record<
  string,
  { label: string; colorClass: string; shortLabel: string }
> = {
  CAMPEONATO: {
    label: "Campeonato",
    colorClass: "event-type-championship",
    shortLabel: "Camp",
  },
  AMISTOSO: {
    label: "Amistoso",
    colorClass: "event-type-friendly",
    shortLabel: "Amist",
  },
  TREINO: {
    label: "Treino",
    colorClass: "event-type-training",
    shortLabel: "Treino",
  },
  REUNIAO: {
    label: "Reuniao",
    colorClass: "event-type-meeting",
    shortLabel: "Reun",
  },
  OUTRO: {
    label: "Outro",
    colorClass: "event-type-other",
    shortLabel: "Outro",
  },
};

function asNumber(value?: number | null) {
  return value ?? 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max);
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getFirstName(name: string) {
  return name.trim().split(" ")[0] || name;
}

export function getStatusLabel(status?: string | null) {
  if (!status) return "Disponivel";

  const labels: Record<string, string> = {
    DISPONIVEL: "Disponivel",
    LESIONADO: "Lesionado",
    INATIVO: "Inativo",
    TITULAR: "Titular",
    OBSERVACAO: "Observacao",
    ATIVO: "Ativo",
  };

  return labels[status] || status;
}

export function getStatusTone(status?: string | null) {
  switch (status) {
    case "LESIONADO":
      return "danger";
    case "INATIVO":
      return "muted";
    case "TITULAR":
    case "ATIVO":
      return "success";
    default:
      return "neutral";
  }
}

export function formatMatchDate(dateStr: string, includeWeekday = false) {
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeWeekday ? { weekday: "short" as const } : {}),
  });
}

export function formatMonthTitle(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

export function formatDayNumber(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit" });
}

export function dateToIso(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateAge(birthDate?: string | null) {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T12:00:00`);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthday =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() >= birth.getDate());

  if (!hasHadBirthday) age -= 1;
  return age;
}

export function getPlayerHeightLabel(height?: number | null) {
  if (!height) return "--";
  return `${height} cm`;
}

export function getPlayerWeightLabel(weight?: number | null) {
  if (!weight) return "--";
  return `${weight} kg`;
}

export function getEventTypeLabel(type?: string | null) {
  if (!type) return EVENT_TYPE_META.OUTRO.label;
  return EVENT_TYPE_META[type]?.label || type;
}

export function getEventTypeMeta(type?: string | null) {
  if (!type) return EVENT_TYPE_META.OUTRO;
  return EVENT_TYPE_META[type] || EVENT_TYPE_META.OUTRO;
}

export function getEventTitle(event: EventRecord) {
  if (event.titulo?.trim()) return event.titulo.trim();
  if (event.adversario?.trim()) return `Falcons x ${event.adversario.trim()}`;
  return getEventTypeLabel(event.tipo);
}

export function getResult(game: EventRecord) {
  if (asNumber(game.placar_nos) > asNumber(game.placar_eles)) return "win";
  if (asNumber(game.placar_nos) < asNumber(game.placar_eles)) return "loss";
  return "draw";
}

export function isCompetitiveEvent(event: EventRecord) {
  return event.tipo === "CAMPEONATO" || event.tipo === "AMISTOSO";
}

export function getWinRate(events: EventRecord[]) {
  const games = events.filter(isCompetitiveEvent);
  if (!games.length) return 0;
  const wins = games.filter((game) => getResult(game) === "win").length;
  return Math.round((wins / games.length) * 100);
}

export function getSetBalance(events: EventRecord[]) {
  return events
    .filter(isCompetitiveEvent)
    .reduce(
      (acc, event) => acc + (asNumber(event.placar_nos) - asNumber(event.placar_eles)),
      0,
    );
}

export function getPositionGroups(players: PlayerRecord[]) {
  const counts = new Map<string, number>();

  players.forEach((player) => {
    const position = player.posicao?.trim() || "Sem posicao";
    counts.set(position, (counts.get(position) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([position, count]) => ({ position, count }))
    .sort((a, b) => b.count - a.count);
}

export function getAverageHeight(players: PlayerRecord[]) {
  const heights = players
    .map((player) => player.altura)
    .filter((value): value is number => typeof value === "number");

  if (!heights.length) return null;
  return Math.round(heights.reduce((sum, value) => sum + value, 0) / heights.length);
}

export function getAverageAge(players: PlayerRecord[]) {
  const ages = players
    .map((player) => calculateAge(player.data_nascimento))
    .filter((value): value is number => typeof value === "number");

  if (!ages.length) return null;
  return Math.round(ages.reduce((sum, value) => sum + value, 0) / ages.length);
}

export function getUpcomingGames(events: EventRecord[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return events
    .filter((event) => new Date(`${event.data}T12:00:00`).getTime() >= today.getTime())
    .sort(
      (a, b) =>
        new Date(`${a.data}T12:00:00`).getTime() -
        new Date(`${b.data}T12:00:00`).getTime(),
    );
}

export function getRecentGames(events: EventRecord[], count = 5) {
  return [...events]
    .sort(
      (a, b) =>
        new Date(`${b.data}T12:00:00`).getTime() -
        new Date(`${a.data}T12:00:00`).getTime(),
    )
    .slice(0, count);
}

export function getMonthMatrix(baseDate: Date) {
  const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const weekday = (monthStart.getDay() + 6) % 7;
  const startDate = new Date(monthStart);
  startDate.setDate(monthStart.getDate() - weekday);

  return Array.from({ length: 6 }).map((_, weekIndex) =>
    Array.from({ length: 7 }).map((__, dayIndex) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + weekIndex * 7 + dayIndex);
      return date;
    }),
  );
}

export function isSameDay(a: Date | string, b: Date | string) {
  const aDate = typeof a === "string" ? new Date(`${a}T12:00:00`) : a;
  const bDate = typeof b === "string" ? new Date(`${b}T12:00:00`) : b;
  return dateToIso(aDate) === dateToIso(bDate);
}

export function eventOccursOnDate(event: EventRecord, date: Date) {
  const start = new Date(`${event.data}T12:00:00`);
  const end = new Date(`${event.data_fim || event.data}T12:00:00`);
  const cursor = new Date(date);
  cursor.setHours(12, 0, 0, 0);
  return cursor.getTime() >= start.getTime() && cursor.getTime() <= end.getTime();
}

export function getEventsForDate(events: EventRecord[], date: Date) {
  return events.filter((event) => eventOccursOnDate(event, date));
}

function getPositionBaseRatings(position?: string | null): PositionBaseRatings {
  if (!position) return POSITION_BASE_MAP.DEFAULT;
  const normalized = position.trim().toUpperCase();
  return POSITION_BASE_MAP[normalized] || POSITION_BASE_MAP.DEFAULT;
}

export function aggregatePerformance(records: PerformanceRecord[]) {
  return records.reduce<Required<PerformanceRecord>>(
    (acc, record) => ({
      ...acc,
      id: acc.id,
      evento_id: acc.evento_id,
      jogador_id: acc.jogador_id,
      passe_a: asNumber(acc.passe_a) + asNumber(record.passe_a),
      passe_b: asNumber(acc.passe_b) + asNumber(record.passe_b),
      passe_c: asNumber(acc.passe_c) + asNumber(record.passe_c),
      toque_bom: asNumber(acc.toque_bom) + asNumber(record.toque_bom),
      toque_medio: asNumber(acc.toque_medio) + asNumber(record.toque_medio),
      toque_ruim: asNumber(acc.toque_ruim) + asNumber(record.toque_ruim),
      saque_ace: asNumber(acc.saque_ace) + asNumber(record.saque_ace),
      saque_bom: asNumber(acc.saque_bom) + asNumber(record.saque_bom),
      saque_erro: asNumber(acc.saque_erro) + asNumber(record.saque_erro),
      ataque_ponto: asNumber(acc.ataque_ponto) + asNumber(record.ataque_ponto),
      ataque_medio: asNumber(acc.ataque_medio) + asNumber(record.ataque_medio),
      ataque_erro: asNumber(acc.ataque_erro) + asNumber(record.ataque_erro),
      bloqueio_ponto:
        asNumber(acc.bloqueio_ponto) + asNumber(record.bloqueio_ponto),
      bloqueio_medio:
        asNumber(acc.bloqueio_medio) + asNumber(record.bloqueio_medio),
      bloqueio_erro:
        asNumber(acc.bloqueio_erro) + asNumber(record.bloqueio_erro),
      nocao_boa: asNumber(acc.nocao_boa) + asNumber(record.nocao_boa),
      nocao_media: asNumber(acc.nocao_media) + asNumber(record.nocao_media),
      nocao_ruim: asNumber(acc.nocao_ruim) + asNumber(record.nocao_ruim),
      pulo_bom: asNumber(acc.pulo_bom) + asNumber(record.pulo_bom),
      pulo_medio: asNumber(acc.pulo_medio) + asNumber(record.pulo_medio),
      pulo_ruim: asNumber(acc.pulo_ruim) + asNumber(record.pulo_ruim),
      observacoes: acc.observacoes || record.observacoes || null,
    }),
    {
      id: "",
      evento_id: "",
      jogador_id: "",
      passe_a: 0,
      passe_b: 0,
      passe_c: 0,
      toque_bom: 0,
      toque_medio: 0,
      toque_ruim: 0,
      saque_ace: 0,
      saque_bom: 0,
      saque_erro: 0,
      ataque_ponto: 0,
      ataque_medio: 0,
      ataque_erro: 0,
      bloqueio_ponto: 0,
      bloqueio_medio: 0,
      bloqueio_erro: 0,
      nocao_boa: 0,
      nocao_media: 0,
      nocao_ruim: 0,
      pulo_bom: 0,
      pulo_medio: 0,
      pulo_ruim: 0,
      observacoes: null,
    },
  );
}

export function getEfficiency(positive: number, neutral: number, negative: number) {
  const total = positive + neutral + negative;
  if (!total) return 0;
  return Math.round(((positive - negative) / total) * 100);
}

export function getPassScore(record: PerformanceRecord | Required<PerformanceRecord>) {
  return asNumber(record.passe_a) - asNumber(record.passe_c) * 3;
}

export function getNeutralScore(
  positive: number,
  neutral: number,
  negative: number,
) {
  return positive - negative;
}

export function getPlayerRatings(
  player: Pick<PlayerRecord, "posicao">,
  records: PerformanceRecord[],
): PlayerRatings {
  const totals = aggregatePerformance(records);
  const base = getPositionBaseRatings(player.posicao);

  const passe = clamp(base.passe + getPassScore(totals), 40, 99);
  const toque = clamp(
    base.toque +
      getNeutralScore(
        asNumber(totals.toque_bom),
        asNumber(totals.toque_medio),
        asNumber(totals.toque_ruim),
      ),
    40,
    99,
  );
  const saque = clamp(
    base.saque +
      getNeutralScore(
        asNumber(totals.saque_ace) + asNumber(totals.saque_bom),
        0,
        asNumber(totals.saque_erro),
      ),
    40,
    99,
  );
  const ataque = clamp(
    base.ataque +
      getNeutralScore(
        asNumber(totals.ataque_ponto),
        asNumber(totals.ataque_medio),
        asNumber(totals.ataque_erro),
      ),
    40,
    99,
  );
  const bloqueio = clamp(
    base.bloqueio +
      getNeutralScore(
        asNumber(totals.bloqueio_ponto),
        asNumber(totals.bloqueio_medio),
        asNumber(totals.bloqueio_erro),
      ),
    40,
    99,
  );
  const nocao = clamp(
    base.nocao +
      getNeutralScore(
        asNumber(totals.nocao_boa),
        asNumber(totals.nocao_media),
        asNumber(totals.nocao_ruim),
      ),
    40,
    99,
  );
  const pulo = clamp(
    base.pulo +
      getNeutralScore(
        asNumber(totals.pulo_bom),
        asNumber(totals.pulo_medio),
        asNumber(totals.pulo_ruim),
      ),
    40,
    99,
  );

  const overall = clamp(
    (passe + toque + saque + ataque + bloqueio + nocao + pulo) / 7,
    40,
    99,
  );

  return {
    passe,
    toque,
    saque,
    ataque,
    bloqueio,
    nocao,
    pulo,
    overall,
    trendScore:
      getPassScore(totals) +
      getNeutralScore(
        asNumber(totals.toque_bom),
        asNumber(totals.toque_medio),
        asNumber(totals.toque_ruim),
      ) +
      getNeutralScore(
        asNumber(totals.saque_ace) + asNumber(totals.saque_bom),
        0,
        asNumber(totals.saque_erro),
      ) +
      getNeutralScore(
        asNumber(totals.ataque_ponto),
        asNumber(totals.ataque_medio),
        asNumber(totals.ataque_erro),
      ) +
      getNeutralScore(
        asNumber(totals.bloqueio_ponto),
        asNumber(totals.bloqueio_medio),
        asNumber(totals.bloqueio_erro),
      ) +
      getNeutralScore(
        asNumber(totals.nocao_boa),
        asNumber(totals.nocao_media),
        asNumber(totals.nocao_ruim),
      ) +
      getNeutralScore(
        asNumber(totals.pulo_bom),
        asNumber(totals.pulo_medio),
        asNumber(totals.pulo_ruim),
      ),
  };
}

export function groupPerformanceByPlayer(records: PerformanceRecord[]) {
  return records.reduce<Record<string, PerformanceRecord[]>>((acc, record) => {
    if (!acc[record.jogador_id]) acc[record.jogador_id] = [];
    acc[record.jogador_id].push(record);
    return acc;
  }, {});
}

export function getTeamOverall(
  players: PlayerRecord[],
  groupedRecords: Record<string, PerformanceRecord[]>,
) {
  if (!players.length) return 0;
  const total = players.reduce((sum, player) => {
    const ratings = getPlayerRatings(player, groupedRecords[player.id] || []);
    return sum + ratings.overall;
  }, 0);

  return Math.round(total / players.length);
}

export function sumPerformanceField(
  records: PerformanceRecord[],
  field: keyof PerformanceRecord,
) {
  return records.reduce((sum, record) => sum + asNumber(record[field] as number), 0);
}
