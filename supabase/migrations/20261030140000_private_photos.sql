-- Fotos de atletas deixam de ser publicas: so usuarios autenticados conseguem
-- gerar URL assinada (temporaria). Links publicos antigos param de funcionar.
UPDATE storage.buckets SET public = false WHERE id = 'fotos-jogadores';

DROP POLICY IF EXISTS "Autenticados leem fotos" ON storage.objects;
CREATE POLICY "Autenticados leem fotos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'fotos-jogadores');
