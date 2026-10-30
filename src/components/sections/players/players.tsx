"use client";

import React, { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import TopBar from "@/components/layout/top-bar";
import {
  BadgePlus,
  Pencil,
  Search,
  Trash2,
  UserRoundPen,
  Users,
  Volleyball,
} from "lucide-react";
import {
  calculateAge,
  getPlayerHeightLabel,
  getPlayerWeightLabel,
  getPlayerRatings,
  getPositionGroups,
  getStatusLabel,
  getStatusTone,
  groupPerformanceByPlayer,
  type PerformanceRecord,
} from "@/lib/volleyball";

type Player = {
  id: string;
  nome: string;
  apelido?: string | null;
  posicao?: string | null;
  camisa?: number | null;
  foto_url?: string | null;
  status?: string | null;
  data_nascimento?: string | null;
  cpf?: string | null;
  telefone?: string | null;
  curso?: string | null;
  peso?: number | null;
  altura?: number | null;
  ano?: number | null;
  observacoes?: string | null;
};

type PlayerFormState = {
  id?: string;
  fotoUrl: string | null;
  fotoFile: File | null;
  nome: string;
  apelido: string;
  posicao: string;
  camisa: string;
  status: string;
  dataNascimento: string;
  cpf: string;
  telefone: string;
  curso: string;
  peso: string;
  altura: string;
  ano: string;
  observacoes: string;
};

const EMPTY_FORM: PlayerFormState = {
  fotoUrl: null,
  fotoFile: null,
  nome: "",
  apelido: "",
  posicao: "",
  camisa: "",
  status: "DISPONIVEL",
  dataNascimento: "",
  cpf: "",
  telefone: "",
  curso: "",
  peso: "",
  altura: "",
  ano: "",
  observacoes: "",
};

export default function PlayersClient({
  initialPlayers,
  initialPerformance,
}: {
  initialPlayers: Player[];
  initialPerformance: PerformanceRecord[];
}) {
  const supabase = createClient();
  const [players, setPlayers] = useState(initialPlayers);
  const [performanceRecords] = useState(initialPerformance);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [form, setForm] = useState<PlayerFormState>(EMPTY_FORM);

  const performanceByPlayer = useMemo(
    () => groupPerformanceByPlayer(performanceRecords),
    [performanceRecords],
  );
  const positionGroups = useMemo(() => getPositionGroups(players), [players]);

  const filteredPlayers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return players.filter((player) => {
      const matchesSearch =
        !term ||
        player.nome.toLowerCase().includes(term) ||
        (player.apelido || "").toLowerCase().includes(term) ||
        (player.curso || "").toLowerCase().includes(term);
      const matchesPosition =
        positionFilter === "all" || (player.posicao || "") === positionFilter;

      return matchesSearch && matchesPosition;
    });
  }, [players, positionFilter, search]);

  const availableCount = players.filter(
    (player) => !player.status || player.status === "DISPONIVEL" || player.status === "ATIVO",
  ).length;

  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : "Erro inesperado.";

  function patchForm<K extends keyof PlayerFormState>(
    key: K,
    value: PlayerFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreateModal() {
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  }

  function openEditModal(player: Player) {
    setForm({
      id: player.id,
      fotoUrl: player.foto_url || null,
      fotoFile: null,
      nome: player.nome || "",
      apelido: player.apelido || "",
      posicao: player.posicao || "",
      camisa: player.camisa != null ? String(player.camisa) : "",
      status: player.status || "DISPONIVEL",
      dataNascimento: player.data_nascimento || "",
      cpf: player.cpf || "",
      telefone: player.telefone || "",
      curso: player.curso || "",
      peso: player.peso != null ? String(player.peso) : "",
      altura: player.altura != null ? String(player.altura) : "",
      ano: player.ano != null ? String(player.ano) : "",
      observacoes: player.observacoes || "",
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setForm(EMPTY_FORM);
  }

  function handleMaskCPF(value: string) {
    let next = value.replace(/\D/g, "");
    if (next.length > 11) next = next.slice(0, 11);
    next = next.replace(/(\d{3})(\d)/, "$1.$2");
    next = next.replace(/(\d{3})(\d)/, "$1.$2");
    next = next.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    patchForm("cpf", next);
  }

  function handleMaskPhone(value: string) {
    let next = value.replace(/\D/g, "");
    if (next.length > 11) next = next.slice(0, 11);
    next = next.replace(/^(\d{2})(\d)/g, "($1) $2");
    next = next.replace(/(\d)(\d{4})$/, "$1-$2");
    patchForm("telefone", next);
  }

  function handlePhotoPreview(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files?.[0]) return;
    const file = event.target.files[0];
    patchForm("fotoFile", file);

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      if (loadEvent.target?.result) {
        patchForm("fotoUrl", loadEvent.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }

  async function uploadPhotoIfNeeded() {
    if (!form.fotoFile) return form.fotoUrl;

    await supabase.storage
      .createBucket("fotos-jogadores", { public: true })
      .catch(() => {});

    const extension = form.fotoFile.name.split(".").pop();
    const slug = `${form.nome.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("fotos-jogadores")
      .upload(slug, form.fotoFile, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("fotos-jogadores").getPublicUrl(slug);
    return data.publicUrl;
  }

  async function savePlayer() {
    if (!form.nome.trim()) {
      alert("Informe o nome do atleta.");
      return;
    }

    setSaving(true);

    try {
      const finalFotoUrl = await uploadPhotoIfNeeded();
      const body = {
        nome: form.nome.trim(),
        apelido: form.apelido.trim() || null,
        posicao: form.posicao || null,
        camisa: form.camisa ? parseInt(form.camisa, 10) : null,
        status: form.status || "DISPONIVEL",
        data_nascimento: form.dataNascimento || null,
        cpf: form.cpf || null,
        telefone: form.telefone || null,
        curso: form.curso || null,
        peso: form.peso ? parseFloat(form.peso) : null,
        altura: form.altura ? parseFloat(form.altura) : null,
        ano: form.ano ? parseInt(form.ano, 10) : null,
        observacoes: form.observacoes.trim() || null,
        foto_url: finalFotoUrl || null,
      };

      if (form.id) {
        const { data, error } = await supabase
          .from("jogadores_leilao")
          .update(body)
          .eq("id", form.id)
          .select();

        if (error) throw error;

        if (data?.[0]) {
          setPlayers((current) =>
            current.map((player) => (player.id === form.id ? data[0] : player)),
          );
        }
      } else {
        const { data, error } = await supabase
          .from("jogadores_leilao")
          .insert([body])
          .select();

        if (error) throw error;

        if (data?.[0]) {
          setPlayers((current) => [...current, data[0]]);
        }
      }

      closeModal();
    } catch (error: unknown) {
      alert(`Erro ao salvar atleta: ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  }

  async function deletePlayer(id: string, playerName: string) {
    if (!confirm(`Deseja remover ${playerName} do elenco?`)) return;

    const { error } = await supabase.from("jogadores_leilao").delete().eq("id", id);
    if (error) {
      alert(`Erro ao excluir: ${error.message}`);
      return;
    }

    setPlayers((current) => current.filter((player) => player.id !== id));
  }

  return (
    <div className="page-shell">
      <TopBar
        title="Gestao do elenco"
        badge="Cadastro e desenvolvimento"
        description="Edite os dados dos atletas, acompanhe o overall individual e mantenha o elenco pronto para calendario, treino e competicao."
        actionLabel="Novo atleta"
        actionIcon={<BadgePlus size={16} />}
        onAction={openCreateModal}
      />

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Atletas cadastrados</span>
            <Users size={18} className="tone-info" />
          </div>
          <div className="stat-number">{players.length}</div>
          <div className="stat-trend">{filteredPlayers.length} exibidos nos filtros</div>
        </article>

        <article className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Disponiveis</span>
            <Volleyball size={18} className="tone-success" />
          </div>
          <div className="stat-number">{availableCount}</div>
          <div className="stat-trend">Prontos para treino, amistoso e campeonato</div>
        </article>

        <article className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Posicoes mapeadas</span>
            <UserRoundPen size={18} className="tone-warning" />
          </div>
          <div className="stat-number">{positionGroups.length}</div>
          <div className="stat-trend">
            {positionGroups[0]
              ? `${positionGroups[0].position} lidera a composicao`
              : "Defina as posicoes para a leitura tecnica"}
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Camisas definidas</span>
            <Search size={18} className="tone-info" />
          </div>
          <div className="stat-number">
            {players.filter((player) => player.camisa != null).length}
          </div>
          <div className="stat-trend">Ajuda na identificacao rapida em quadra</div>
        </article>
      </section>

      <section className="filters-card">
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">Busca</label>
            <input
              className="input-field"
              placeholder="Nome, apelido ou curso"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Posicao</label>
            <select
              className="input-field"
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
            >
              <option value="all">Todas</option>
              {positionGroups.map((group) => (
                <option key={group.position} value={group.position}>
                  {group.position}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Resumo rapido</label>
            <div className="pill-row">
              {positionGroups.slice(0, 2).map((group) => (
                <span key={group.position} className="pill">
                  {group.position}: {group.count}
                </span>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Leitura</label>
            <div className="helper-text">
              Clique em editar para atualizar dados do atleta e manter o elenco vivo.
            </div>
          </div>
        </div>
      </section>

      <section className="players-grid">
        {filteredPlayers.length === 0 ? (
          <div className="panel empty-state" style={{ gridColumn: "1 / -1" }}>
            <h3>Nenhum atleta encontrado</h3>
            <p>Ajuste os filtros ou adicione o primeiro cadastro do elenco.</p>
          </div>
        ) : (
          filteredPlayers.map((player) => {
            const tone = getStatusTone(player.status);
            const age = calculateAge(player.data_nascimento);
            const ratings = getPlayerRatings(
              player,
              performanceByPlayer[player.id] || [],
            );

            return (
              <article key={player.id} className="player-card">
                <div className="player-top">
                  <div className="player-left">
                    <div className="player-photo">
                      {player.foto_url ? (
                        <img src={player.foto_url} alt={player.nome} />
                      ) : (
                        <div className="player-photo-placeholder">
                          {player.nome
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="player-info">
                      <div className="player-name">{player.nome}</div>
                      <div className="player-sub">
                        {player.apelido ? `${player.apelido} · ` : ""}
                        {player.posicao || "Posicao nao informada"}
                        {player.camisa != null ? ` · #${player.camisa}` : ""}
                      </div>
                      <div className="player-foot-row">
                        <span className={`status-badge ${tone}`}>
                          {getStatusLabel(player.status)}
                        </span>
                        <span className="status-badge neutral">
                          {player.curso || "Curso nao informado"}
                        </span>
                        <span className="status-badge neutral">
                          Ano {player.ano || "--"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="player-right">
                    <div className="player-overall-pill">
                      <span>OVR</span>
                      <strong>{ratings.overall}</strong>
                    </div>
                    <div className="player-actions-inline">
                      <button
                        className="btn-icon"
                        onClick={() => openEditModal(player)}
                        title="Editar atleta"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => deletePlayer(player.id, player.nome)}
                        title="Remover atleta"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="player-meta-grid">
                  <div className="mini-stat">
                    <span>Idade</span>
                    <strong>{age ? `${age} anos` : "--"}</strong>
                  </div>
                  <div className="mini-stat">
                    <span>Altura</span>
                    <strong>{getPlayerHeightLabel(player.altura)}</strong>
                  </div>
                  <div className="mini-stat">
                    <span>Peso</span>
                    <strong>{getPlayerWeightLabel(player.peso)}</strong>
                  </div>
                </div>

                <div className="player-rating-strip">
                  <span>Passe {ratings.passe}</span>
                  <span>Ataque {ratings.ataque}</span>
                  <span>Bloqueio {ratings.bloqueio}</span>
                  <span>Saque {ratings.saque}</span>
                </div>
              </article>
            );
          })
        )}
      </section>

      <div
        className={`modal-overlay ${isModalOpen ? "open" : ""}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}
      >
        <div className="modal">
          <div className="modal-title">
            <span>{form.id ? "Editar atleta" : "Novo atleta"}</span>
            <button className="modal-close" onClick={closeModal}>
              x
            </button>
          </div>

          <div className="photo-preview-panel">
            <div className="photo-preview-large">
              {form.fotoUrl ? (
                <img src={form.fotoUrl} alt="Preview do atleta" />
              ) : (
                <div className="player-photo-placeholder">
                  {(form.nome || "FA")
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div className="form-group">
                <label className="form-label">Foto</label>
                <label className="btn btn-secondary" style={{ width: "fit-content" }}>
                  Escolher imagem
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handlePhotoPreview}
                  />
                </label>
              </div>
              <div className="helper-text">
                Atualize foto, status e dados de contato sem perder o historico do atleta.
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nome completo</label>
              <input
                className="form-input"
                value={form.nome}
                onChange={(e) => patchForm("nome", e.target.value)}
                placeholder="Nome do atleta"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Apelido</label>
              <input
                className="form-input"
                value={form.apelido}
                onChange={(e) => patchForm("apelido", e.target.value)}
                placeholder="Como o time chama"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Posicao</label>
              <select
                className="form-select"
                value={form.posicao}
                onChange={(e) => patchForm("posicao", e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="Levantador">Levantador</option>
                <option value="Oposto">Oposto</option>
                <option value="Central">Central</option>
                <option value="Ponteiro">Ponteiro</option>
                <option value="Libero">Libero</option>
                <option value="Ponta/Oposto">Ponta/Oposto</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Camisa</label>
              <input
                className="form-input"
                type="number"
                min="0"
                max="99"
                value={form.camisa}
                onChange={(e) => patchForm("camisa", e.target.value)}
                placeholder="Numero"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={form.status}
                onChange={(e) => patchForm("status", e.target.value)}
              >
                <option value="DISPONIVEL">Disponivel</option>
                <option value="ATIVO">Ativo</option>
                <option value="TITULAR">Titular</option>
                <option value="LESIONADO">Lesionado</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Nascimento</label>
              <input
                className="form-input"
                type="date"
                value={form.dataNascimento}
                onChange={(e) => patchForm("dataNascimento", e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">CPF</label>
              <input
                className="form-input"
                value={form.cpf}
                onChange={(e) => handleMaskCPF(e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input
                className="form-input"
                value={form.telefone}
                onChange={(e) => handleMaskPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Curso</label>
              <input
                className="form-input"
                value={form.curso}
                onChange={(e) => patchForm("curso", e.target.value)}
                placeholder="Curso do atleta"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Peso</label>
              <input
                className="form-input"
                type="number"
                step="0.1"
                value={form.peso}
                onChange={(e) => patchForm("peso", e.target.value)}
                placeholder="kg"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Altura</label>
              <input
                className="form-input"
                type="number"
                value={form.altura}
                onChange={(e) => patchForm("altura", e.target.value)}
                placeholder="cm"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ano</label>
              <input
                className="form-input"
                type="number"
                min="1"
                max="10"
                value={form.ano}
                onChange={(e) => patchForm("ano", e.target.value)}
                placeholder="Ex.: 1, 2, 3"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Observacoes</label>
              <input
                className="form-input"
                value={form.observacoes}
                onChange={(e) => patchForm("observacoes", e.target.value)}
                placeholder="Notas do atleta"
              />
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: 20 }}>
            <button className="btn btn-secondary" onClick={closeModal} disabled={saving}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={savePlayer} disabled={saving}>
              {saving ? "Salvando..." : form.id ? "Salvar alteracoes" : "Salvar atleta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
