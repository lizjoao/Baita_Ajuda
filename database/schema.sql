-- Habilita a extensão PostGIS, necessária para o campo de geolocalização.
-- Se já estiver habilitada, o comando não fará nada.
CREATE EXTENSION IF NOT EXISTS postgis;

-- Tabela para armazenar os dados dos usuários administradores dos abrigos.
CREATE TABLE Usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela principal com todas as informações dos abrigos.
CREATE TABLE Abrigos (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    endereco TEXT NOT NULL,
    localizacao GEOGRAPHY(Point, 4326), -- Armazena latitude e longitude para buscas por proximidade.
    tipo_abrigo VARCHAR(50) CHECK (tipo_abrigo IN ('Familiar', 'Feminino', 'Masculino', 'Pets')),
    vagas_disponiveis INT NOT NULL DEFAULT 0,
    formulario_inscricao_url VARCHAR(255),
    media_avaliacoes NUMERIC(3, 2) DEFAULT 0.0,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id)
);

-- Tabela para listar os itens que cada abrigo necessita.
-- A cláusula ON DELETE CASCADE garante que se um abrigo for deletado, suas necessidades também serão.
CREATE TABLE Necessidades (
    id SERIAL PRIMARY KEY,
    abrigo_id INT NOT NULL,
    item VARCHAR(255) NOT NULL,
    quantidade VARCHAR(100), -- Campo flexível para "Urgente", "Muitas", "10 pacotes", etc.
    FOREIGN KEY (abrigo_id) REFERENCES Abrigos(id) ON DELETE CASCADE
);

-- Tabela para armazenar as avaliações que os usuários fazem dos abrigos.
CREATE TABLE Avaliacoes (
    id SERIAL PRIMARY KEY,
    abrigo_id INT NOT NULL,
    nota INT NOT NULL CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT,
    data_avaliacao TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (abrigo_id) REFERENCES Abrigos(id) ON DELETE CASCADE
);
