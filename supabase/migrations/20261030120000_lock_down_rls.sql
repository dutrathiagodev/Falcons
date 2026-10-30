-- Fecha o acesso anonimo: antes qualquer pessoa com a chave publica do projeto
-- podia ler (inclusive CPF e telefone), alterar e apagar todas as tabelas.
-- Agora so usuarios autenticados (Supabase Auth) acessam, via API do app.

DROP POLICY IF EXISTS "Acesso publico leitura jogadores" ON public.jogadores_leilao;
DROP POLICY IF EXISTS "Acesso publico insercao jogadores" ON public.jogadores_leilao;
DROP POLICY IF EXISTS "Acesso publico atualizacao jogadores" ON public.jogadores_leilao;
DROP POLICY IF EXISTS "Acesso publico delecao jogadores" ON public.jogadores_leilao;

DROP POLICY IF EXISTS "Acesso publico leitura jogos" ON public.jogos;
DROP POLICY IF EXISTS "Acesso publico insercao jogos" ON public.jogos;
DROP POLICY IF EXISTS "Acesso publico atualizacao jogos" ON public.jogos;
DROP POLICY IF EXISTS "Acesso publico delecao jogos" ON public.jogos;

DROP POLICY IF EXISTS "Acesso publico leitura estatisticas" ON public.estatisticas_individuais;
DROP POLICY IF EXISTS "Acesso publico insercao estatisticas" ON public.estatisticas_individuais;
DROP POLICY IF EXISTS "Acesso publico atualizacao estatisticas" ON public.estatisticas_individuais;
DROP POLICY IF EXISTS "Acesso publico delecao estatisticas" ON public.estatisticas_individuais;

CREATE POLICY "Autenticados gerenciam jogadores"
ON public.jogadores_leilao FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados gerenciam jogos"
ON public.jogos FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados gerenciam estatisticas"
ON public.estatisticas_individuais FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Bucket de fotos: leitura publica por URL, escrita so autenticada, 2 MB, so imagem.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('fotos-jogadores', 'fotos-jogadores', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "Autenticados enviam fotos" ON storage.objects;
CREATE POLICY "Autenticados enviam fotos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'fotos-jogadores');
