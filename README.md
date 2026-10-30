# Falcons Vôlei - Gestão de Atlética

<p align="center">
Sistema de gestão esportiva do time de vôlei da Atlética FAP: elenco, escalação, jogos e estatísticas. <br/>
<a href="https://falcons-painel.vercel.app">Acessar o sistema online</a>
</p>

<p align="center">
  <a href="#-tecnologias">Tecnologias</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#-funcionalidades">Funcionalidades</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#-segurança">Segurança</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#-arquitetura-e-api">Arquitetura</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#-como-rodar">Como rodar</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#-licença">Licença</a>
</p>

<p align="center">
  <img alt="Painel do Falcons Vôlei" src="docs/images/tela-principal.png" width="100%">
</p>

## 🚀 Tecnologias

- **Next.js 16** (App Router, Server Components, Route Handlers) e **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Supabase**: PostgreSQL com RLS, Auth e Storage
- **Vitest** para testes e **ESLint** para lint
- **GitHub Actions** (CI) e **Vercel** (deploy)

## ✨ Funcionalidades

- 📊 **Dashboard:** estatísticas do time, saldo de sets, aproveitamento e próximos compromissos.
- 👥 **Atletas:** cadastro completo, disponibilidade, posições, camisas e fotos.
- 🏐 **Escalação:** montagem de sextetos com visualização da quadra e rotações.
- 📈 **Estatísticas:** fundamentos por atleta (passe, ataque, saque, bloqueio), overall e rankings.
- 📅 **Jogos:** calendário de campeonatos, amistosos, treinos e reuniões.

## 🔐 Segurança

O sistema guarda dados pessoais de atletas, por isso o acesso é fechado:

- Somente usuários autenticados acessam; sem sessão, tudo redireciona para `/login`.
- O navegador nunca fala direto com o banco: leituras no servidor e escritas pela API.
- A API valida origem (CSRF), sessão, tabelas e colunas permitidas.
- RLS ligado em todas as tabelas, sem acesso anônimo; upload de foto limitado a imagem de até 2 MB.
- Headers de segurança (CSP, X-Frame-Options, nosniff) aplicados em `src/proxy.ts`.

Regras completas e checklist de PR em [docs/architecture/feature.security.md](docs/architecture/feature.security.md).

## 🛠️ Arquitetura e API

Tudo em um único repositório Next.js, sem backend separado.

| Rota | Método | Uso |
| --- | --- | --- |
| `/api/players`, `/api/games`, `/api/stats` | `POST` | cria (stats faz upsert por jogo + atleta) |
| `/api/players/:id`, `/api/games/:id`, `/api/stats/:id` | `PATCH`, `DELETE` | edita e remove |
| `/api/photos` | `POST` | envia foto (JPG, PNG ou WEBP, até 2 MB) |
| `/api/auth/login`, `/api/auth/logout` | `POST` | sessão via Supabase Auth |

Para criar um recurso novo, registre a tabela e as colunas permitidas em `src/lib/api.ts` (`resources`).

```text
src/app          rotas, layout e API
src/components   layout, sections e ui
src/lib          regras de vôlei, helpers e Supabase
src/proxy.ts     sessão e headers de segurança
supabase         migrations
docs             arquitetura e segurança
```

Padrões em [docs/architecture](docs/architecture).

## ▶️ Como rodar

Requer Node.js 20 ou superior.

1. `npm install`
2. Crie `.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Aplique as migrations de `supabase/migrations` (a última fecha o acesso anônimo ao banco).
4. No Supabase, em **Authentication → Sign In / Providers**, desative **Allow new users to sign up** e crie os usuários do time manualmente.
5. `npm run dev` e abra http://localhost:3000.

```bash
npm run dev     # desenvolvimento
npm run lint    # lint
npm test        # testes
npm run build   # build de produção
```

## 📝 Licença

Este projeto está sob a licença MIT.

---

Desenvolvido por **Thiago Dutra**.

- **GitHub:** [@dutrathiagodev](https://github.com/dutrathiagodev)
- **LinkedIn:** [Thiago Dutra de Oliveira](https://linkedin.com/in/dutrathiagodev)
