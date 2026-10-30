# Feature Template (Scaffold)

Passo a passo para montar o projeto de gestao do time de volei Falcons do zero, ou para recriar o ambiente em outra maquina.

> Todo o codigo fica dentro de `src/`. Na raiz ficam apenas `public/`, `docs/`, `supabase/`, configs e `package.json`.

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript
- Tailwind CSS 4 (via @tailwindcss/postcss)
- Supabase (Postgres, Auth, Storage) com `@supabase/ssr`
- ESLint

## 1. Criar o projeto

Pre-requisito: Node.js 20 ou superior.

```bash
git clone https://github.com/dutrathiagodev/Falcons.git
cd Falcons
npm install
```

## 2. Configurar o Supabase

1. Crie um projeto no Supabase.
2. Crie `.env.local` na raiz (o arquivo e ignorado pelo git):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<chave publishable>
```

3. Aplique as migrations de `supabase/migrations` em ordem (SQL Editor ou `supabase db push`).
4. Em Authentication, desative o cadastro publico e crie os usuarios do time manualmente.
5. Nunca coloque a chave `service_role` neste projeto.

## 3. Rodar

```bash
npm run dev
```

Abra http://localhost:3000. Sem sessao, o proxy redireciona para `/login`.

## 4. Criar uma tela nova (exemplo: presenca em treino)

```bash
mkdir -p src/components/sections/attendance src/app/attendance
touch src/components/sections/attendance/attendance.tsx src/app/attendance/page.tsx
touch supabase/migrations/<timestamp>_attendance.sql
```

Depois:

1. Escreva a migration com `ENABLE ROW LEVEL SECURITY` e policy `TO authenticated`.
2. Adicione `attendance` em `resources` (src/lib/api.ts) com a tabela e as colunas permitidas.
3. Na `page.tsx`, busque os dados com `createClient()` de `@/lib/supabase/server` e passe por props.
4. Na secao, escreva com `apiRequest("/api/attendance", ...)`.
5. Adicione o link em `src/components/layout/sidebar.tsx`.

## 5. Comandos do dia a dia

```bash
npm run dev     # desenvolvimento
npm run lint    # lint
npm run build   # build de producao
npm run start   # servir o build
```

## Observacoes

- A page busca dados; a secao e dona do markup; a API e a unica que escreve.
- Esta versao do Next.js tem mudancas em relacao ao que a maioria dos tutoriais mostra (por exemplo, `middleware` virou `proxy`). Consulte `node_modules/next/dist/docs/` antes de usar uma API nova.
