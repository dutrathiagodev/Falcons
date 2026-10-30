# Feature Skills - Next.js + Supabase

Guia pratico para evoluir o sistema de gestao do time Falcons (atletas, escalacao, jogos e estatisticas) sem quebrar a arquitetura nem a seguranca.

## Objetivo

Manter consistencia entre as telas, com responsabilidades claras:

- src/app: rotas, layout, metadata e busca de dados
- src/app/api: escrita no banco, sempre autenticada
- src/components/sections: telas (players, games, lineup, statistics, dashboard, login)
- src/components/ui e layout: pecas visuais reutilizaveis
- src/lib: regras de volei, helpers e clientes Supabase

## Estrutura base

```text
src/proxy.ts
src/app/
  layout.tsx
  login/page.tsx
  dashboard/page.tsx
  players/page.tsx
  api/[resource]/route.ts
  api/[resource]/[id]/route.ts
src/components/
  layout/{sidebar,top-bar}.tsx
  sections/<secao>/<secao>.tsx
src/lib/
  api.ts
  api-client.ts
  volleyball.ts
  supabase/{server,middleware}.ts
supabase/migrations/
```

## Regras praticas (skills)

1. A page busca, a secao mostra

- `page.tsx` e Server Component: busca com o cliente de servidor e passa por props.

2. Cada secao e independente

- uma pasta por secao; secao nao importa outra secao.

3. Escrita so pela API

- componente de cliente usa `apiRequest()` de `@/lib/api-client`; nunca `createBrowserClient`.
- recurso novo = entrada em `resources` (src/lib/api.ts) com tabela e colunas permitidas.

4. Regras de volei em um lugar

- calculos de overall, aproveitamento, saldo de sets, posicoes e rotacao ficam em `src/lib/volleyball.ts`, com funcoes puras.

5. Server Component por padrao

- "use client" so com estado, evento ou efeito (formularios, modais, filtros).

6. Dados sensiveis

- CPF, telefone, data de nascimento, peso e altura so aparecem onde forem necessarios (cadastro e edicao do atleta).
- nao logar, nao colocar em URL, nao enviar para analytics, nao expor em rota publica.

7. Banco

- tabela nova: migration + RLS + policy `TO authenticated`. Sem excecao.

8. Tailwind e estilo

- classes utilitarias, mobile first (sm:, md:, lg:); tokens de cor e fonte centralizados.

9. Imagens

- next/image com width, height e alt; fotos de atletas vem do bucket `fotos-jogadores`.

10. Nomenclatura

- arquivos em kebab-case, componentes em PascalCase.

## Template rapido de implementacao

1. Criar a migration (tabela + RLS + policy para `authenticated`)
2. Registrar o recurso em `resources` (src/lib/api.ts)
3. Criar src/components/sections/<secao>/<secao>.tsx
4. Criar src/app/<rota>/page.tsx buscando os dados no servidor
5. Adicionar o link na sidebar
6. Rodar o checklist de [seguranca](feature.security.md), `npm run lint` e `npm run build`

## Definition of Done

- Estrutura segue o padrao
- Escrita somente via `/api`, com sessao valida
- RLS ligado e sem acesso anonimo
- Nenhum dado de atleta em log, URL ou variavel publica
- Lint e build sem erros

Documentacao detalhada:

- [Spec](feature.spec.md)
- [Seguranca e protecao de dados](feature.security.md)
- [Template de criacao do projeto](feature.template.md)
