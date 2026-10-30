# Plano — Gestor de Times Multi-esporte

| | |
|---|---|
| Status | **draft** (aguardando validação do Thiago) |
| Data | 2026-10-30 |
| Autoridade | Este arquivo é o índice de decisões e execução. Os HTML abaixo detalham fluxos e contratos. |
| Base verificada | branch `develop` (commit `a60cf73`), PR 009 (performance) ainda aberto |

## Índice de artefatos

| Artefato | Para que serve | Status | Fonte da verdade de |
|---|---|---|---|
| [2026-10-30-gestor-multi-esporte.md](2026-10-30-gestor-multi-esporte.md) | Decisões, fases, riscos, testes | draft | plano e execução |
| [2026-10-30-gestor-multi-esporte-flow.html](2026-10-30-gestor-multi-esporte-flow.html) | Jornadas, regras de negócio, permissões, cenários | draft | fluxos e regras |
| [2026-10-30-gestor-multi-esporte-scheme.html](2026-10-30-gestor-multi-esporte-scheme.html) | Tabelas, RLS, RPCs, rotas da API, módulos de esporte | draft | contrato técnico |
| Mockups de UI (um por tela) | Novo layout, design e animações | **ainda não criados** | visual (gate antes da Fase 5) |

Abra os `.html` direto no navegador (duplo clique). Não precisam de servidor.

---

## 1. Objetivo e fora de escopo

**Objetivo.** Transformar o Falcons (hoje: painel de vôlei de um único time) em um **gestor de times multi-esporte**:

- uma **organização** (ex.: Atlética FAP) tem vários **times**;
- cada time tem **um esporte** (vôlei, futsal, futebol de campo, fut7/society, basquete, handebol e outros);
- o esporte muda a funcionalidade: posições, tamanho do elenco em quadra/campo, escalação (rotação × formação), estatísticas, placar e cálculo de overall;
- o resto (login, elenco, agenda, presença, permissões, segurança) é comum a todos.

**Requisitos não funcionais (do Thiago):** 100% seguro (sem vazamento de dados), sem gerar gastos, rápido e fluido, banco "redondinho", código limpo, arquitetura pensada como software profissional.

**Fora de escopo agora:**
- pagamentos/mensalidade e notificações push (fase futura, listadas em §12);
- app mobile nativo (o site é responsivo e pode virar PWA);
- scout ao vivo lance a lance (decidido: estatística agregada por jogo — ver D6);
- campeonatos/tabelas entre times de organizações diferentes.

## 2. Estado atual verificado

| Área | Hoje | Onde |
|---|---|---|
| Stack | Next.js 16 App Router, React 19, TS, Tailwind 4, Supabase, Vitest, GitHub Actions, Vercel | `package.json`, `.github/workflows/ci.yml` |
| Telas | dashboard, players, lineup, statistics, games, login | `src/app/*/page.tsx`, `src/components/sections/*` |
| Regras de esporte | só vôlei, tudo em um arquivo | `src/lib/volleyball.ts` (posições, overall por fundamento, tipos de evento) |
| API | genérica com allowlist: `/api/[resource]`, `/api/[resource]/[id]`, `/api/photos`, `/api/auth/*` | `src/app/api`, `src/lib/api.ts` |
| Sessão | `src/proxy.ts` + `src/lib/supabase/middleware.ts` (PR 009 troca para `getClaims`) | |
| Banco | 3 tabelas sem conceito de time/esporte: `jogadores_leilao`, `jogos`, `estatisticas_individuais` (uma coluna por fundamento de vôlei: `passe_a`, `saque_ace`…) | `supabase/migrations/*` |
| RLS | qualquer usuário autenticado lê/escreve tudo (`FOR ALL TO authenticated`) | `20261030120000_lock_down_rls.sql` |
| Fotos | bucket **público** `fotos-jogadores` | idem |
| Infra | Vercel (função em `iad1`; PR 009 muda para `gru1`), Supabase em `sa-east-1` | `vercel.json` |

**Limitações que este plano resolve:** não existe time nem esporte; estatística em colunas fixas não serve para outros esportes; qualquer usuário logado vê dados de todos (inclusive CPF); fotos de atletas (possivelmente menores) ficam públicas por URL; o nome `jogadores_leilao` é herança de outro projeto.

## 3. Decisões

Decisões marcadas **(confirmar)** são padrões propostos; mudam o desenho se a resposta for diferente.

| ID | Decisão | Alternativa rejeitada e por quê |
|---|---|---|
| D1 | **Hierarquia:** Organização → Times → (Elenco, Agenda, Jogos). Esquema já multi-organização; a UI começa com uma organização só. **(confirmar)** | Só times soltos: impede dar acesso por clube e vender depois. |
| D2 | **Atleta pertence à organização** e entra em vários times via `team_members` (ex.: mesma pessoa no vôlei e no futsal). **(confirmar)** | Atleta por time: duplica cadastro e dados pessoais. |
| D3 | **Dados sensíveis separados** em `athlete_private` (CPF, telefone, nascimento, responsável). Só admin da organização lê. Recomendação: **não coletar CPF** se não houver uso real. **(confirmar)** | Tudo na mesma tabela: qualquer leitura de elenco vazaria CPF. |
| D4 | **Esporte = módulo de código** (`src/sports/<esporte>`) que declara posições, formações, placar, estatísticas e overall. O banco tem as tabelas de referência (`sports`, `sport_positions`, `stat_definitions`) **geradas a partir do código** por script; um teste garante que estão sincronizadas. | Configuração só no banco (JSON): sem tipagem, sem testes, regras de validação ficariam espalhadas. Só no código: o banco não conseguiria validar com FK. |
| D5 | **Estatística em linhas** (`match_stats`: jogo, atleta, chave da estatística, valor) com FK para `stat_definitions`. | Uma coluna por fundamento (atual): exige migration por esporte e deixa colunas vazias. JSONB livre: sem integridade nem índice. |
| D6 | **Estatística agregada por jogo** (contagem por atleta), não lance a lance. Tabela de eventos ao vivo fica para fase futura. **(confirmar)** | Lance a lance agora: muito mais escrita, UI complexa, sem necessidade comprovada. |
| D7 | **Papéis:** organização (`owner`, `admin`) e time (`coach`, `scout`, `viewer`). Atleta com login fica para fase futura. **(confirmar)** | Todos iguais (atual): sem controle de quem vê dado pessoal. |
| D8 | **RLS é a barreira real.** Funções `private.can_read_team()` / `can_write_team()` / `has_org_role()` (`SECURITY DEFINER`, `search_path` vazio) usadas em todas as policies. A API valida regras de esporte e formato; o banco garante quem pode o quê. | Autorização só na API: um bug na API vazaria dados. |
| D9 | **Leitura no servidor (RSC) com a sessão do usuário; escrita pela API** (`/api/...`), como hoje. Escritas compostas (escalação, estatísticas, placar) passam por **RPC transacional** no Postgres. | Cliente falando direto com o Supabase: amplia superfície de ataque. |
| D10 | **Rotas por time:** `/t/[teamSlug]/...`. Seletor de time na entrada e troca rápida na sidebar. O componente de quadra/campo do esporte é carregado sob demanda (`next/dynamic`). | Query string `?team=`: URL frágil, cache pior. |
| D11 | **Fotos em bucket privado** com caminho `org/{orgId}/athletes/{athleteId}.webp`, redimensionadas no navegador para 512 px WebP antes do upload, servidas por URL assinada gerada no servidor. | Bucket público (atual): link vaza foto de menor. Otimização de imagem da Vercel: consome cota do plano grátis. |
| D12 | **Custo zero:** Vercel Hobby + Supabase Free, região `gru1` + `sa-east-1`, sem serviços pagos. Keep-alive diário via GitHub Actions para o Supabase grátis não pausar. | Serviços pagos (Redis, filas, CDN de imagem): desnecessários no volume atual. |
| D13 | **Migração expand → backfill → contract:** tabelas novas convivem com as antigas, dados do Falcons são copiados para o time "Falcons Vôlei", app troca, tabelas antigas são removidas depois de um período de verificação. | Migração destrutiva de uma vez: sem rollback. |
| D14 | **Nomes em inglês no banco e no código** (`athletes`, `teams`, `events`), textos da UI em português. | Misturar (`jogadores_leilao`): confuso e herdado de outro projeto. |

## 4. Esportes suportados (módulos)

Detalhes completos (posições, formações, estatísticas, regras de placar) no [scheme HTML §C](2026-10-30-gestor-multi-esporte-scheme.html).

| Esporte | Família | Em jogo | Escalação | Placar | Estatísticas principais |
|---|---|---|---|---|---|
| Vôlei | volleyball | 6 + líbero | rotação P1–P6 + líbero | sets (melhor de 3 ou 5; 25/15 pts, 2 de vantagem) | passe A/B/C, saque, ataque, bloqueio, levantamento, defesa |
| Futsal | football | 5 | formações 2-2, 3-1, 4-0 | gols, 2 tempos | gols, assistências, finalizações, desarmes, faltas, cartões, defesas, gols sofridos |
| Fut7 / Society | football | 7 | 2-3-1, 3-2-1, 2-2-2 | gols, 2 tempos | igual futsal + minutos jogados |
| Futebol de campo | football | 11 | 4-4-2, 4-3-3, 3-5-2, 4-2-3-1 | gols, 2 tempos | igual + passes certos, impedimentos |
| Basquete | basketball | 5 | PG, SG, SF, PF, C | pontos por quarto (+ prorrogação) | 2pt/3pt/LL (acertos e tentativas), rebotes of./def., assistências, roubos, tocos, erros, faltas |
| Handebol | handball | 7 | goleiro + 6 | gols, 2 tempos | gols, arremessos, assistências, defesas, exclusões 2 min, cartões |
| Outro | generic | configurável | lista simples | pontos | contadores criados pelo admin (fase futura) |

Futsal, society e campo compartilham a família `football` (mesmo código, configuração diferente). Adicionar um esporte = criar um módulo + rodar o script de seed + migration gerada.

## 5. Fluxos de negócio (resumo)

Fluxo completo com decisões, falhas e permissões no [flow HTML](2026-10-30-gestor-multi-esporte-flow.html).

| # | Fluxo | Quem | Resultado |
|---|---|---|---|
| F1 | Login → escolher time (ou ir direto ao último time) | todos | sessão + time ativo |
| F2 | Criar time e escolher esporte | owner/admin | time com módulo do esporte |
| F3 | Cadastrar atleta na organização e vincular a times (posição do esporte, camisa) | admin, coach | atleta + vínculo |
| F4 | Agendar evento (jogo, treino, reunião) | coach | evento na agenda |
| F5 | Confirmar presença | coach (atleta no futuro) | presença por evento |
| F6 | Montar escalação conforme o esporte | coach | escalação salva atomicamente |
| F7 | Registrar placar e estatísticas do jogo | coach, scout | resultado + estatísticas validadas pelo esporte |
| F8 | Ver dashboard e estatísticas do time | todos do time | agregados por RPC |
| F9 | Convidar membro da comissão | owner/admin | convite com token, expira em 7 dias |
| F10 | Excluir atleta / pedido LGPD | admin | dados e fotos apagados, evento de auditoria |
| F11 | Trocar esporte de um time | admin | só se o time não tiver jogos/estatísticas; senão 409 |

## 6. Dados e API (resumo)

Contrato completo (colunas, constraints, índices, policies, RPCs, requests/responses, erros) no [scheme HTML](2026-10-30-gestor-multi-esporte-scheme.html).

**Tabelas novas:** `organizations`, `org_memberships`, `teams`, `team_staff`, `sports`, `sport_positions`, `stat_definitions`, `athletes`, `athlete_private`, `team_members`, `events`, `match_results`, `lineups`, `lineup_slots`, `match_stats`, `event_attendance`, `invitations`, `audit_events`.

**Removidas no fim (contract):** `jogadores_leilao`, `jogos`, `estatisticas_individuais`.

**RPCs:** `team_dashboard(team_id)`, `athlete_season_stats(team_id, athlete_id)`, `save_lineup(...)`, `save_match_stats(...)`, `save_match_result(...)`, `accept_invitation(token)`.

**API (Next.js Route Handlers):** rotas por recurso com escopo de time — `/api/teams`, `/api/teams/:teamId/members`, `/api/teams/:teamId/events`, `/api/events/:id/{result,lineup,stats,attendance}`, `/api/athletes`, `/api/athletes/:id/private`, `/api/photos`, `/api/invitations`, `/api/auth/*`. A API genérica atual (`/api/[resource]`) é substituída.

**Erros padronizados:** 400 validação · 401 sem sessão · 403 origem inválida · 404 não existe **ou sem permissão** (não revela que o recurso existe) · 409 conflito (camisa repetida, troca de esporte com dados) · 422 regra do esporte (ex.: set de vôlei 25×24).

## 7. Site e telas

```text
/login
/                       → último time usado (cookie) ou /times
/times                  seletor: cards com nome, esporte, próximo evento
/t/[time]               dashboard do time (muda por esporte)
/t/[time]/elenco        atletas do time, posição e camisa
/t/[time]/agenda        calendário: jogos, treinos, reuniões
/t/[time]/jogos/[id]    abas: resumo · escalação · estatísticas · presença
/t/[time]/estatisticas  rankings e evolução por atleta
/t/[time]/ajustes       nome, categoria, comissão do time
/org/atletas            cadastro geral de atletas (dados pessoais só para admin)
/org/times              criar/arquivar times e escolher esporte
/org/equipe             comissão e convites
```

O que muda por esporte: ícone e cor do time, campo/quadra da escalação, lista de posições, formulário de estatísticas, cards do dashboard (ex.: "saldo de sets" no vôlei, "saldo de gols" no futebol, "pontos por jogo" no basquete) e fórmula do overall.

**Gate de UI:** o Thiago quer novo layout, design e animações. Antes da Fase 5, criar **um mockup HTML por tela** (seletor de time, dashboard, elenco, jogo, escalação de cada família de esporte) e aprovar. A UI de produção não é feita a partir de mockup não aprovado.

## 8. Segurança e proteção de dados

- **RLS por participação:** usuário só enxerga organizações e times onde é membro; `athlete_private` só para `owner`/`admin`.
- **404 em vez de 403** para recurso de outro time (evita descobrir IDs).
- **Funções de permissão** em schema `private` (não exposto pela API do Supabase), `SECURITY DEFINER`, `set search_path = ''`, chamadas como `(select private.can_read_team(team_id))` para cache por consulta.
- **Escrita só pela API**, com Origin, sessão (`getUser()` nas escritas), allowlist de campos, validação de esporte, RPC transacional.
- **Fotos privadas** com URL assinada de curta duração; consentimento do responsável para menores (`athlete_private.guardian_consent_at`).
- **Auditoria** (`audit_events`) de criação/edição/exclusão de atleta, dados pessoais, vínculos, papéis e convites — sem dados pessoais no payload.
- **LGPD:** minimização (CPF opcional/recomendado não coletar), exclusão real (atleta + privado + foto), exportação dos dados do atleta sob pedido (fase futura).
- **Convites:** token aleatório de 32 bytes, guardado só o hash, expira em 7 dias, uso único.
- **Supabase Auth:** cadastro público desligado; entrada por convite. Limite de tentativas é o do Supabase.
- **Headers e CSP** mantidos no `src/proxy.ts`.
- Checklist de PR em `docs/architecture/feature.security.md` passa a incluir "policy nova usa `private.can_*`".

## 9. Performance e custo zero

| Medida | Efeito |
|---|---|
| Vercel `gru1` + Supabase `sa-east-1` (PR 009) | cada consulta ao banco fica em São Paulo |
| `getClaims()` no proxy (PR 009) | sem ida ao Auth a cada navegação |
| **Uma RPC por tela** (`team_dashboard` devolve tudo agregado) | 1 ida ao banco em vez de 3–4; o navegador não recebe linhas cruas |
| Índices nos acessos reais (time+data, jogo, atleta) | consultas em milissegundos mesmo com anos de dados |
| `loading.tsx` + streaming com `Suspense` por bloco | conteúdo aparece em partes, sem tela branca |
| Componente de quadra/campo via `next/dynamic` | quem usa só vôlei não baixa código de basquete |
| Fotos 512 px WebP redimensionadas no navegador | sem custo de otimização de imagem e upload leve |
| Sem dependências pesadas novas (gráficos em SVG/CSS) | bundle pequeno |
| Keep-alive diário (GitHub Actions, grátis) | Supabase Free não pausa por inatividade |

Limites do plano grátis a acompanhar: Supabase Free (500 MB de banco, 1 GB de storage, 50 mil usuários ativos/mês) e Vercel Hobby (uso não comercial). Se o projeto for vendido para outros clubes (D1), o plano Hobby da Vercel não permite uso comercial — decisão de custo a revisitar.

## 10. Fases de implementação

Cada fase termina com lint, testes e build verdes e vira **um PR numerado** contra `develop`.

| Fase | Objetivo | Principais arquivos | Pronto quando |
|---|---|---|---|
| F0 | Validar estes documentos | `docs/backlog/*` | Thiago marca `approved` ou pede mudanças |
| F1 | **Fundação do banco**: organizações, times, papéis, funções `private.*`, RLS, tabelas de esporte | `supabase/migrations/*_foundation.sql` | testes de RLS (positivos e negativos) passam no Supabase local |
| F2 | **Registro de esportes** em código: `SportDefinition`, módulo vôlei extraído de `src/lib/volleyball.ts`, script de seed, teste de sincronização | `src/sports/**`, `scripts/generate-sport-seed.ts` | testes do módulo vôlei reproduzem os números atuais |
| F3 | **Migração de dados** do Falcons: atletas, jogos, estatísticas (unpivot das colunas) | `supabase/migrations/*_backfill_falcons.sql` | queries de conferência batem (contagens e somas por atleta) |
| F4 | **API v2** por time + RPCs transacionais + validação por esporte | `src/app/api/**`, `src/lib/api.ts` | testes de contrato (400/401/404/409/422) passam |
| F5 | **Mockups aprovados** → seletor de time, rotas `/t/[time]`, sidebar com troca de time, vôlei com paridade total | `src/app/t/**`, `src/components/**` | o Falcons funciona igual ao de hoje, só que dentro de um time |
| F6 | **Família futebol**: futsal, fut7/society, campo (formações, campo SVG, estatísticas) | `src/sports/football/**` | criar time de futsal, escalar, registrar jogo e ver dashboard |
| F7 | **Basquete e handebol** | `src/sports/basketball/**`, `src/sports/handball/**` | idem |
| F8 | **Presença, convites, papéis na UI, auditoria visível para admin** | `src/app/org/**` | coach convidado só vê o próprio time |
| F9 | **Contract**: remover tabelas antigas, API genérica e `src/lib/volleyball.ts`; fechar docs | migrations, `docs/architecture/*` | nada referencia tabelas antigas; docs atualizados |

Dependências: F1 → F2 → F3 → F4 → F5 → (F6, F7 em paralelo) → F8 → F9. Mockups (gate de F5) podem ser feitos em paralelo a F1–F4.

## 11. Migração, compatibilidade e rollback

1. **Expand (F1):** cria tabelas novas; as antigas continuam sendo usadas pelo site atual. Rollback: dropar tabelas novas.
2. **Backfill (F3):** cria organização "Atlética FAP" e time "Falcons Vôlei" (`volleyball`); copia `jogadores_leilao` → `athletes` + `athlete_private` + `team_members`; `jogos` → `events` + `match_results`; cada coluna de `estatisticas_individuais` vira uma linha em `match_stats` (`passe_a` → `pass_a`, etc.). Idempotente (pode rodar de novo). Conferência por SQL no scheme HTML.
3. **Switch (F4–F5):** site passa a ler e escrever só nas tabelas novas. Rollback: voltar o deploy anterior (dados antigos intactos).
4. **Contract (F9):** só depois de 2 semanas sem problema e com backup verificado, remover tabelas antigas.

Toda migration é aplicada no Supabase **pelo Thiago**; este plano não autoriza escrita em produção nem deploy.

## 12. Testes, QA e observabilidade

- **Unit (Vitest):** cada módulo de esporte (validação de placar, posições, formações, overall), validação da API, geração de seed.
- **Sincronização:** teste que compara o registro de esportes com o seed SQL gerado.
- **RLS:** script SQL rodado no Supabase local (`supabase start`, grátis) com usuários `owner`, `admin`, `coach` de outro time, `viewer` e anônimo — cada um tenta ler/escrever o que não pode e precisa falhar.
- **Contrato da API:** testes de rota com Supabase simulado para os códigos 400/401/403/404/409/422.
- **E2E (Playwright, local):** login → escolher time → criar jogo → escalar → registrar estatísticas → ver dashboard, para vôlei e futsal.
- **CI:** lint, testes, build (já existe) + checagem de seed sincronizado.
- **Observabilidade:** logs estruturados sem dados pessoais nas rotas; `audit_events` para ações sensíveis; Vercel Speed Insights (já instalado) para medir carregamento.

**Futuro (não planejado em detalhe):** mensalidade, notificações (e-mail/push via PWA), login de atleta (ver própria estatística e confirmar presença), scout ao vivo, sorteio de times equilibrado, página pública do time sem dados pessoais, exportação CSV, campeonatos.

## 13. Perguntas em aberto

| # | Pergunta | Padrão proposto | Dono |
|---|---|---|---|
| Q1 | Um atleta pode estar em mais de um time/esporte? | sim (D2) | Thiago |
| Q2 | Atletas e responsáveis vão ter login? | não agora; fase futura (D7) | Thiago |
| Q3 | Vai vender para outros clubes? | esquema pronto, UI com uma organização (D1); revisar custo Vercel se for comercial | Thiago |
| Q4 | Ordem dos esportes | vôlei (paridade) → futsal → society/fut7 → campo → basquete → handebol | Thiago |
| Q5 | Precisa mesmo de CPF? | recomendo não coletar (D3) | Thiago |
| Q6 | Estatística agregada ou lance a lance? | agregada (D6) | Thiago |
| Q7 | Categorias (masculino/feminino/misto, sub-17…) | campo `category` no time | Thiago |
| Q8 | Direção visual do novo layout | mockups na F5 | Thiago |

## 14. Primeiro passo e fechamento

- **Primeiro passo após aprovação:** F1 — migration de fundação + testes de RLS no Supabase local.
- **Autorização:** cada fase é um PR; merge, migration em produção e deploy são decisões do Thiago.
- **Fechamento:** ao terminar F9, contratos estáveis vão para `docs/architecture/` (spec, segurança, esportes) e estes arquivos de `docs/backlog/` são removidos ou marcados `superseded`.
