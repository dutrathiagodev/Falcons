# Falcons Vôlei - Gestão de Atlética

<p align="center">
Centro de comando e gestão esportiva para o time de vôlei da Atlética FAP. <br/>
<a href="https://falcons-wine.vercel.app">Clique aqui para acessar o sistema online.</a>
</p>

<p align="center">
  <a href="#-tecnologias">Tecnologias</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-projeto">Projeto</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-funcionalidades">Funcionalidades</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#memo-licença">Licença</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-desenvolvedor">Desenvolvedor</a>
</p>

<p align="center">
  <img alt="License" src="https://img.shields.io/static/v1?label=license&message=MIT&color=49AA26&labelColor=000000">
</p>

<br>

<p align="center">
  <img alt="projeto Falcons Volei" src=".github/preview.png" width="100%">
</p>

## 🚀 Tecnologias

Esse projeto foi desenvolvido com as seguintes tecnologias:

- HTML5 e CSS3
- JavaScript (ES6+)
- React
- Vite
- Git e GitHub
- Vercel

## 💻 Projeto

O **Falcons Vôlei** é um painel completo de gestão esportiva desenvolvido para a Atlética FAP. A plataforma permite centralizar a leitura do elenco, controlar a agenda competitiva e analisar o momento técnico do time para tomada de decisões estratégicas em treinos e campeonatos.

- [Acesse o projeto finalizado, online](https://falcons-wine.vercel.app)

## ✨ Funcionalidades

- 📊 **Dashboard Geral:** Leitura rápida de estatísticas do time, saldo de sets, aproveitamento e compromissos do elenco.
- 👥 **Gestão do Elenco (Atletas):** Cadastro completo de jogadores, controle de disponibilidade, definição de posições e números de camisa.
- 🏐 **Escalação e Rotações (Tático):** Montagem de sextetos com visualização interativa de quadra e gerenciamento de rotações táticas.
- 📈 **Leitura Estatística:** Acompanhamento de fundamentos por atleta (passe, ataque, etc.), overall e rankings de performance.
- 📅 **Calendário Esportivo (Jogos):** Agendamento e gestão de campeonatos, amistosos, treinos e reuniões com visualização mensal.

## :memo: Licença

Esse projeto está sob a licença MIT.

---

Desenvolvido por **Thiago Dutra**.

- **GitHub:** [@dutrathiagodev](https://github.com/dutrathiagodev)
- **LinkedIn:** [Thiago Dutra de Oliveira](https://linkedin.com/in/dutrathiagodev)

## 🛠️ Arquitetura e API

Tudo em um unico repositorio Next.js. O navegador nunca fala direto com o Supabase: leituras acontecem nas paginas (Server Components) e escritas passam pela API em `src/app/api`.

| Rota | Metodo | Uso |
| --- | --- | --- |
| `/api/players`, `/api/games`, `/api/stats` | `POST` | cria (stats faz upsert por jogo + atleta) |
| `/api/players/:id`, `/api/games/:id`, `/api/stats/:id` | `PATCH`, `DELETE` | edita e remove |
| `/api/photos` | `POST` | envia foto (JPG/PNG/WEBP, ate 2 MB) |
| `/api/auth/login`, `/api/auth/logout` | `POST` | sessao via Supabase Auth |

Para criar um novo recurso, adicione a tabela e as colunas permitidas em `src/lib/api.ts` (`resources`).

Estrutura (segue `docs/architecture`): `src/app` (rotas), `src/components/{layout,sections,ui}`, `src/lib` (helpers e Supabase), `public`.

## 🔐 Configuracao

1. Crie `.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. Aplique as migrations de `supabase/migrations` (a ultima fecha o acesso anonimo ao banco).
3. No painel do Supabase: **Authentication → Sign In / Providers → desative "Allow new users to sign up"** e crie os usuarios do time manualmente.
4. `npm install` e `npm run dev`.
