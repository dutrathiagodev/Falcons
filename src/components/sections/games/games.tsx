"use client";

import React, { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import TopBar from "@/components/layout/top-bar";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  List,
  MapPin,
  Plus,
  SquarePen,
  Trophy,
} from "lucide-react";
import {
  dateToIso,
  eventOccursOnDate,
  formatDayNumber,
  formatMatchDate,
  formatMonthTitle,
  getEventTitle,
  getEventTypeLabel,
  getEventTypeMeta,
  getMonthMatrix,
  getUpcomingGames,
  getWinRate,
  isCompetitiveEvent,
  type EventRecord,
} from "@/lib/volleyball";

type EventFormState = {
  id?: string;
  titulo: string;
  tipo: string;
  data: string;
  dataFim: string;
  local: string;
  adversario: string;
  placarNos: string;
  placarEles: string;
  status: string;
  observacoes: string;
};

const EVENT_TYPES = ["CAMPEONATO", "AMISTOSO", "TREINO", "REUNIAO", "OUTRO"];
const EVENT_STATUSES = ["AGENDADO", "CONCLUIDO", "CANCELADO"];

const createEmptyEventForm = (selectedDate: string): EventFormState => ({
  titulo: "",
  tipo: "TREINO",
  data: selectedDate,
  dataFim: selectedDate,
  local: "",
  adversario: "",
  placarNos: "",
  placarEles: "",
  status: "AGENDADO",
  observacoes: "",
});

export default function GamesClient({
  initialEvents,
}: {
  initialEvents: EventRecord[];
}) {
  const supabase = createClient();
  const [events, setEvents] = useState<EventRecord[]>(initialEvents);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const base = new Date();
    base.setDate(1);
    return base;
  });
  const [selectedDate, setSelectedDate] = useState(dateToIso(new Date()));
  const [viewMode, setViewMode] = useState<"month" | "list">("month");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState<EventFormState>(createEmptyEventForm(dateToIso(new Date())));

  const monthGrid = useMemo(() => getMonthMatrix(currentMonth), [currentMonth]);
  const filteredEvents = useMemo(
    () =>
      typeFilter === "ALL"
        ? events
        : events.filter((event) => (event.tipo || "OUTRO") === typeFilter),
    [events, typeFilter],
  );
  const eventsForSelectedDate = useMemo(
    () =>
      filteredEvents.filter((event) =>
        eventOccursOnDate(event, new Date(`${selectedDate}T12:00:00`)),
      ),
    [filteredEvents, selectedDate],
  );
  const upcomingEvents = useMemo(() => getUpcomingGames(filteredEvents).slice(0, 5), [filteredEvents]);
  const matchEvents = filteredEvents.filter(isCompetitiveEvent);

  function patchForm<K extends keyof EventFormState>(key: K, value: EventFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreateModal() {
    setForm(createEmptyEventForm(selectedDate));
    setIsModalOpen(true);
  }

  function openEditModal(event: EventRecord) {
    setForm({
      id: event.id,
      titulo: event.titulo || "",
      tipo: event.tipo || "OUTRO",
      data: event.data,
      dataFim: event.data_fim || event.data,
      local: event.local || "",
      adversario: event.adversario || "",
      placarNos: event.placar_nos != null ? String(event.placar_nos) : "",
      placarEles: event.placar_eles != null ? String(event.placar_eles) : "",
      status: event.status || "AGENDADO",
      observacoes: event.observacoes || "",
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setForm(createEmptyEventForm(selectedDate));
  }

  async function saveEvent() {
    if (!form.titulo.trim() && !form.adversario.trim()) {
      setFeedback({ type: "error", text: "Informe um titulo ou adversario." });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const body = {
        data: form.data,
        data_fim: form.dataFim || form.data,
        titulo: form.titulo.trim() || null,
        tipo: form.tipo,
        local: form.local.trim() || null,
        adversario: form.adversario.trim() || null,
        placar_nos: form.placarNos ? parseInt(form.placarNos, 10) : null,
        placar_eles: form.placarEles ? parseInt(form.placarEles, 10) : null,
        status: form.status,
        observacoes: form.observacoes.trim() || null,
      };

      if (form.id) {
        const { data, error } = await supabase
          .from("jogos")
          .update(body)
          .eq("id", form.id)
          .select();
        if (error) throw error;
        if (data?.[0]) {
          setEvents((current) =>
            current.map((event) => (event.id === form.id ? data[0] : event)),
          );
        }
      } else {
        const { data, error } = await supabase.from("jogos").insert([body]).select();
        if (error) throw error;
        if (data?.[0]) {
          setEvents((current) => [data[0], ...current]);
        }
      }

      setFeedback({ type: "success", text: "Evento salvo com sucesso." });
      closeModal();
    } catch (error: unknown) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Falha ao salvar evento.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(id: string) {
    if (!confirm("Remover este evento do calendario?")) return;

    const { error } = await supabase.from("jogos").delete().eq("id", id);
    if (error) {
      setFeedback({ type: "error", text: error.message });
      return;
    }

    setEvents((current) => current.filter((event) => event.id !== id));
  }

  return (
    <div className="page-shell">
      <TopBar
        title="Calendario esportivo"
        badge="Agenda do time"
        description="Agende campeonatos, amistosos, treinos e reunioes em um calendario mensal, com leitura visual do que esta vindo pela frente."
        actionLabel="Criar evento"
        actionIcon={<CalendarPlus size={16} />}
        onAction={openCreateModal}
      />

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Eventos cadastrados</span>
            <CalendarPlus size={18} className="tone-info" />
          </div>
          <div className="stat-number">{events.length}</div>
          <div className="stat-trend">Treinos, jogos e compromissos do semestre</div>
        </article>
        <article className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Competitivos</span>
            <Trophy size={18} className="tone-success" />
          </div>
          <div className="stat-number">{matchEvents.length}</div>
          <div className="stat-trend">{getWinRate(filteredEvents)}% de aproveitamento</div>
        </article>
        <article className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Treinos na agenda</span>
            <MapPin size={18} className="tone-warning" />
          </div>
          <div className="stat-number">
            {events.filter((event) => event.tipo === "TREINO").length}
          </div>
          <div className="stat-trend">Base para organizar presenca e carga semanal</div>
        </article>
        <article className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Proximos eventos</span>
            <List size={18} className="tone-info" />
          </div>
          <div className="stat-number">{upcomingEvents.length}</div>
          <div className="stat-trend">Acompanhamento de curto prazo</div>
        </article>
      </section>

      <section className="calendar-layout">
        <aside className="panel calendar-side-panel">
          <h2 className="section-title">Filtros</h2>
          <p className="section-description">
            Escolha o que quer destacar no calendario mensal.
          </p>

          <div className="filter-group">
            <label className="filter-label">Tipo de evento</label>
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">Todos</option>
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {getEventTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Visualizacao</label>
            <div className="calendar-view-switch">
              <button
                className={`btn btn-sm ${viewMode === "month" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setViewMode("month")}
              >
                Grade
              </button>
              <button
                className={`btn btn-sm ${viewMode === "list" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setViewMode("list")}
              >
                Lista
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Legenda</label>
            <div className="list-stack">
              {EVENT_TYPES.map((type) => {
                const meta = getEventTypeMeta(type);
                return (
                  <div key={type} className="legend-row">
                    <span className={`event-pill ${meta.colorClass}`}>{meta.shortLabel}</span>
                    <span>{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="panel">
          <div className="calendar-toolbar">
            <div>
              <h2 className="section-title" style={{ marginBottom: 6 }}>
                {formatMonthTitle(currentMonth)}
              </h2>
              <p className="section-description" style={{ marginBottom: 0 }}>
                Clique em um dia para ver os eventos e editar a agenda.
              </p>
            </div>

            <div className="calendar-toolbar-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
                  )
                }
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const now = new Date();
                  now.setDate(1);
                  setCurrentMonth(now);
                  setSelectedDate(dateToIso(new Date()));
                }}
              >
                Hoje
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
                  )
                }
              >
                <ChevronRight size={16} />
              </button>
              <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                <Plus size={16} />
                Novo
              </button>
            </div>
          </div>

          {viewMode === "month" ? (
            <div className="calendar-month-grid">
              <div className="calendar-weekdays">
                {["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="calendar-grid">
                {monthGrid.flat().map((date) => {
                  const iso = dateToIso(date);
                  const dayEvents = filteredEvents.filter((event) => eventOccursOnDate(event, date));
                  const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                  const isToday = iso === dateToIso(new Date());

                  return (
                    <button
                      key={iso}
                      className={`calendar-day ${isCurrentMonth ? "" : "is-outside"} ${selectedDate === iso ? "is-selected" : ""}`}
                      onClick={() => setSelectedDate(iso)}
                    >
                      <div className="calendar-day-head">
                        <span className={`calendar-day-number ${isToday ? "is-today" : ""}`}>
                          {formatDayNumber(date)}
                        </span>
                      </div>

                      <div className="calendar-day-events">
                        {dayEvents.slice(0, 3).map((event) => {
                          const meta = getEventTypeMeta(event.tipo);
                          return (
                            <span key={event.id} className={`event-chip ${meta.colorClass}`}>
                              {getEventTitle(event)}
                            </span>
                          );
                        })}
                        {dayEvents.length > 3 ? (
                          <span className="calendar-more-events">+{dayEvents.length - 3} mais</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="list-stack">
              {filteredEvents.length === 0 ? (
                <div className="empty-state">
                  <h3>Sem eventos neste filtro</h3>
                  <p>Crie um treino, amistoso ou campeonato para alimentar a agenda.</p>
                </div>
              ) : (
                filteredEvents.map((event) => {
                  const meta = getEventTypeMeta(event.tipo);
                  return (
                    <button
                      key={event.id}
                      className="calendar-list-item"
                      onClick={() => openEditModal(event)}
                    >
                      <div className="list-item-meta">
                        <div className="pill-row">
                          <span className={`event-pill ${meta.colorClass}`}>{meta.label}</span>
                          <span className="status-badge neutral">
                            {event.status || "AGENDADO"}
                          </span>
                        </div>
                        <strong>{getEventTitle(event)}</strong>
                        <span>
                          {formatMatchDate(event.data, true)}
                          {event.local ? ` · ${event.local}` : ""}
                        </span>
                      </div>
                      <SquarePen size={16} />
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        <aside className="panel calendar-side-panel">
          <h2 className="section-title">Agenda do dia</h2>
          <p className="section-description">
            {formatMatchDate(selectedDate, true)} com os eventos selecionados.
          </p>

          {eventsForSelectedDate.length === 0 ? (
            <div className="notice">
              Nenhum compromisso nesta data. Use o botao de novo evento para agendar.
            </div>
          ) : (
            <div className="list-stack">
              {eventsForSelectedDate.map((event) => {
                const meta = getEventTypeMeta(event.tipo);
                return (
                  <div key={event.id} className="list-item">
                    <div className="list-item-meta" style={{ flex: 1 }}>
                      <div className="pill-row">
                        <span className={`event-pill ${meta.colorClass}`}>{meta.label}</span>
                        <span className="status-badge neutral">
                          {event.status || "AGENDADO"}
                        </span>
                      </div>
                      <strong>{getEventTitle(event)}</strong>
                      <span>
                        {event.local ? `${event.local}` : "Local ainda nao informado"}
                      </span>
                      {event.observacoes ? <span>{event.observacoes}</span> : null}
                    </div>

                    <div className="player-actions-inline">
                      <button className="btn-icon" onClick={() => openEditModal(event)}>
                        <SquarePen size={16} />
                      </button>
                      <button className="btn-icon" onClick={() => deleteEvent(event.id)}>
                        x
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {feedback ? (
            <div className={`feedback-box ${feedback.type}`} style={{ marginTop: 18 }}>
              {feedback.text}
            </div>
          ) : null}
        </aside>
      </section>

      <div
        className={`modal-overlay ${isModalOpen ? "open" : ""}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}
      >
        <div className="modal">
          <div className="modal-title">
            <span>{form.id ? "Editar evento" : "Novo evento"}</span>
            <button className="modal-close" onClick={closeModal}>
              x
            </button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Titulo</label>
              <input
                className="form-input"
                value={form.titulo}
                onChange={(e) => patchForm("titulo", e.target.value)}
                placeholder="Ex.: Treino de saque, JASC, amistoso regional"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select
                className="form-select"
                value={form.tipo}
                onChange={(e) => patchForm("tipo", e.target.value)}
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {getEventTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Data inicial</label>
              <input
                type="date"
                className="form-input"
                value={form.data}
                onChange={(e) => patchForm("data", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Data final</label>
              <input
                type="date"
                className="form-input"
                value={form.dataFim}
                onChange={(e) => patchForm("dataFim", e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Local</label>
              <input
                className="form-input"
                value={form.local}
                onChange={(e) => patchForm("local", e.target.value)}
                placeholder="Ginasio, quadra ou cidade"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={form.status}
                onChange={(e) => patchForm("status", e.target.value)}
              >
                {EVENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Adversario</label>
              <input
                className="form-input"
                value={form.adversario}
                onChange={(e) => patchForm("adversario", e.target.value)}
                placeholder="Se houver confronto"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Placar</label>
              <div className="form-row">
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={form.placarNos}
                  onChange={(e) => patchForm("placarNos", e.target.value)}
                  placeholder="Falcons"
                />
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={form.placarEles}
                  onChange={(e) => patchForm("placarEles", e.target.value)}
                  placeholder="Adversario"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Observacoes</label>
            <textarea
              className="form-input"
              value={form.observacoes}
              onChange={(e) => patchForm("observacoes", e.target.value)}
              placeholder="Informacoes de logistica, foco tecnico, observacoes do compromisso."
            />
          </div>

          <div className="form-actions" style={{ marginTop: 20 }}>
            <button className="btn btn-secondary" onClick={closeModal} disabled={saving}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={saveEvent} disabled={saving}>
              {saving ? "Salvando..." : form.id ? "Salvar alteracoes" : "Salvar evento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
