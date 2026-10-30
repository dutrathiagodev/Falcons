# Feature Security - Protecao de Dados dos Atletas

O sistema guarda dados pessoais de atletas (CPF, telefone, data de nascimento, peso, altura, fotos) e desempenho individual. Estas regras existem para impedir vazamento e alteracao indevida. Sao obrigatorias para qualquer mudanca.

## Modelo de acesso

- Somente usuarios autenticados no Supabase Auth acessam o sistema. Nao ha acesso anonimo.
- Usuarios sao criados manualmente por quem administra o projeto; o cadastro publico fica desativado no painel do Supabase.
- O navegador nunca fala direto com o banco: leitura nas pages (servidor) e escrita em `/api`.
- Todos os usuarios logados tem o mesmo nivel (comissao tecnica). Se surgir perfil de atleta ou capitao, criar papeis e policies por papel antes de liberar.

## Camadas de defesa

| Camada | Onde | O que faz |
| --- | --- | --- |
| Proxy | `src/proxy.ts` | redireciona sem sessao para `/login` e aplica CSP, X-Frame-Options, nosniff, Referrer-Policy e Permissions-Policy |
| API | `src/lib/api.ts` | `authorize()` exige Origin igual ao host (CSRF) e sessao valida (401 sem login) |
| Allowlist | `resources` | so tabelas e colunas listadas sao gravaveis (evita mass assignment) |
| Validacao | rotas `[id]` | `id` precisa ser UUID; recurso inexistente retorna 404 |
| Banco | `supabase/migrations` | RLS ligado e policies `TO authenticated`; nada para `anon` |
| Storage | bucket `fotos-jogadores` | imagem JPG/PNG/WEBP, ate 2 MB; envio so autenticado; nome do arquivo e UUID |

## Regras obrigatorias

1. Chaves e segredos

- somente `NEXT_PUBLIC_SUPABASE_URL` e a chave publishable vao para o cliente.
- `service_role`, senhas e tokens nunca entram no repositorio, em `NEXT_PUBLIC_*` ou em log.
- `.env*` fica no `.gitignore`; se uma chave vazar, rotacionar no Supabase.

2. Banco

- toda tabela nova: `ENABLE ROW LEVEL SECURITY` + policy `TO authenticated`.
- proibido `USING (true)` para `anon` e `GRANT` para `anon`.
- migration que mexe em policy deve ser revisada como codigo de seguranca.

3. API

- toda rota de escrita comeca com `authorize(request)`.
- usar `pickFields(body, config.fields)`; nunca repassar o corpo inteiro ao banco.
- resposta de erro generica; `console.error` so com a mensagem do erro, sem dados do atleta.
- rotas de login e logout so checam Origin; o limite de tentativas de login e do Supabase Auth.

4. Dados pessoais

- minimizar: pedir CPF e telefone somente se houver uso real.
- nao exibir CPF completo em listas; mostrar mascarado (`***.***.***-12`) quando precisar identificar.
- nao colocar dado de atleta em URL, query string, `localStorage` ou analytics.
- fotos de menores de idade exigem autorizacao do responsavel antes do upload.
- atender pedido de exclusao: remover atleta (`DELETE /api/players/:id`) e a foto do bucket.

5. Frontend

- sem `dangerouslySetInnerHTML` com dado do banco.
- links externos com `rel="noopener noreferrer"`.
- CSP continua restritiva; liberar novo dominio so com justificativa.

6. Dependencias e deploy

- `npm audit` antes de cada release; atualizar pacotes com vulnerabilidade alta.
- variaveis de ambiente configuradas apenas no painel da Vercel e do Supabase.
- producao e desenvolvimento usam projetos Supabase diferentes.
- ativar backup/PITR no Supabase e conferir periodicamente.

## Checklist de PR

- [ ] Tabela nova tem RLS e policy `TO authenticated`
- [ ] Recurso novo esta em `resources` com colunas minimas
- [ ] Rota nova chama `authorize()` e usa `pickFields`
- [ ] Nenhum `createBrowserClient` ou chave secreta no cliente
- [ ] Nenhum dado de atleta em log, URL ou analytics
- [ ] Upload valida tipo e tamanho
- [ ] `npm run lint`, `npm run build` e `npm audit` sem problemas altos

## Como reportar vazamento

1. Revogar sessoes e rotacionar as chaves no Supabase.
2. Desligar o acesso afetado (policy ou rota) ate corrigir.
3. Avisar a comissao tecnica e os atletas envolvidos.
4. Registrar o que vazou, a causa e a correcao.

## Configuracao obrigatoria no Supabase (painel)

O codigo nao consegue garantir estes pontos sozinho; sem eles o banco fica exposto.

1. **Migrations aplicadas** em ordem, incluindo `20261030120000_lock_down_rls.sql` (fecha o acesso anonimo) e `20261030140000_private_photos.sql` (fotos privadas).
2. **Cadastro publico desativado**: Authentication → Sign In / Providers → desligar "Allow new users to sign up". Usuarios sao criados manualmente.
3. **Chaves novas**: Settings → API Keys → usar as chaves `publishable`/`secret` e desativar as chaves JWT antigas (`anon`/`service_role`). Uma chave `anon` antiga aparece no historico publico do repositorio.
4. **2FA para administradores**: cada admin ativa em `/conta/seguranca` (TOTP, gratis).
5. **Senha minima**: Authentication → Policies → tamanho minimo 10 e exigir letras e numeros.

## Garantias no codigo

- `next` sempre na ultima versao corrigida; `npm audit --omit=dev` sem vulnerabilidades.
- CPF e telefone nunca vao em lista: so `GET /api/players/:id/private` ao abrir um atleta para editar, sem cache.
- Fotos em bucket privado; o banco guarda so o caminho e as telas recebem URL assinada de 1 hora.
- Contas com 2FA: o proxy e a API so liberam a sessao depois do codigo (nivel `aal2`).
- O header `x-powered-by` e desligado. `server: Vercel` e o certificado `*.vercel.app` vem da hospedagem e so somem com dominio proprio.
