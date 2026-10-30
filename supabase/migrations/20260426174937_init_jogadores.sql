-- Tabelas base (antes so existiam no database_setup.sql removido).
-- IF NOT EXISTS: seguro em bancos que ja tem as tabelas.
-- As policies ficam em 20261030120000_lock_down_rls.sql (so autenticados).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.jogadores_leilao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    leilao_id UUID,
    nome TEXT NOT NULL,
    apelido TEXT,
    posicao TEXT,
    camisa INTEGER,
    data_nascimento DATE,
    cpf TEXT,
    telefone TEXT,
    curso TEXT,
    ano INTEGER,
    peso NUMERIC,
    altura NUMERIC,
    pe TEXT,
    status TEXT DEFAULT 'DISPONIVEL',
    time_comprador TEXT,
    valor_arrematado NUMERIC,
    observacoes TEXT,
    foto_url TEXT,
    atq INTEGER DEFAULT 50,
    def INTEGER DEFAULT 50,
    fin INTEGER DEFAULT 50,
    ctl INTEGER DEFAULT 50,
    rit INTEGER DEFAULT 50,
    pas INTEGER DEFAULT 50,
    dri INTEGER DEFAULT 50,
    fis INTEGER DEFAULT 50
);

ALTER TABLE public.jogadores_leilao ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.jogos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data DATE NOT NULL,
    data_fim DATE,
    titulo TEXT,
    tipo TEXT DEFAULT 'AMISTOSO',
    status TEXT DEFAULT 'AGENDADO',
    adversario TEXT,
    local TEXT,
    placar_nos INTEGER,
    placar_eles INTEGER,
    observacoes TEXT
);

ALTER TABLE public.jogos ENABLE ROW LEVEL SECURITY;
