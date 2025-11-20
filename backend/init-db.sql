-- Criar banco (se não existir)
CREATE DATABASE baita_ajuda;

-- Conectar ao banco
\c baita_ajuda;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS Usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Abrigos
CREATE TABLE IF NOT EXISTS Abrigos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES Usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    endereco TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    aceita_pets BOOLEAN DEFAULT FALSE,
    tipo_feminino BOOLEAN DEFAULT FALSE,
    tipo_masculino BOOLEAN DEFAULT FALSE,
    vagas_disponiveis INTEGER DEFAULT 0,
    formulario_inscricao_url TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Necessidades
CREATE TABLE IF NOT EXISTS Necessidades (
    id SERIAL PRIMARY KEY,
    abrigo_id INTEGER REFERENCES Abrigos(id) ON DELETE CASCADE,
    item VARCHAR(100) NOT NULL,
    quantidade VARCHAR(50),
    urgencia VARCHAR(20) DEFAULT 'media',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Avaliações
CREATE TABLE IF NOT EXISTS Avaliacoes (
    id SERIAL PRIMARY KEY,
    abrigo_id INTEGER REFERENCES Abrigos(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES Usuarios(id) ON DELETE CASCADE,
    nota INTEGER CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_abrigos_usuario ON Abrigos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_abrigos_ativo ON Abrigos(ativo);
CREATE INDEX IF NOT EXISTS idx_necessidades_abrigo ON Necessidades(abrigo_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_abrigo ON Avaliacoes(abrigo_id);

-- Inserir alguns dados de exemplo
INSERT INTO Usuarios (nome, email, senha_hash) VALUES
('Admin', 'admin@baita.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW.hN/C3P7Qm')
ON CONFLICT (email) DO NOTHING;

-- Senha do admin acima é: admin123

INSERT INTO Abrigos (usuario_id, nome, endereco, aceita_pets, tipo_feminino, tipo_masculino, vagas_disponiveis, latitude, longitude) VALUES
(1, 'Abrigo Central', 'Av. Borges de Medeiros, 1501 - Centro, Porto Alegre', TRUE, TRUE, TRUE, 50, -30.0346, -51.2177),
(1, 'Abrigo Norte', 'Rua Voluntários da Pátria, 3200 - São Geraldo, Porto Alegre', FALSE, TRUE, FALSE, 30, -30.0120, -51.1980),
(1, 'Abrigo Sul', 'Av. Ipiranga, 6681 - Partenon, Porto Alegre', TRUE, FALSE, TRUE, 40, -30.0680, -51.1740)
ON CONFLICT DO NOTHING;

INSERT INTO Necessidades (abrigo_id, item, quantidade, urgencia) VALUES
(1, 'Cobertores', '20 unidades', 'alta'),
(1, 'Alimentos não perecíveis', '50kg', 'media'),
(2, 'Roupas femininas', '30 peças', 'alta'),
(3, 'Produtos de higiene', '100 unidades', 'media')
ON CONFLICT DO NOTHING;

GRANT ALL PRIVILEGES ON DATABASE baita_ajuda TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;