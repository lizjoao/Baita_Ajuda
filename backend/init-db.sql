-- Limpar tabelas existentes
DROP TABLE IF EXISTS avaliacoes CASCADE;
DROP TABLE IF EXISTS necessidades CASCADE;
DROP TABLE IF EXISTS doacoes CASCADE;
DROP TABLE IF EXISTS abrigos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Tabela de usuários
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'comum' CHECK (tipo IN ('comum', 'gestor', 'admin')),
    telefone VARCHAR(20),
    cpf VARCHAR(14) UNIQUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT true
);

-- Tabela de abrigos
CREATE TABLE abrigos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    endereco TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('temporario', 'permanente', 'emergencia')),
    capacidade_total INTEGER NOT NULL,
    vagas_disponiveis INTEGER NOT NULL,
    formulario_inscricao_url VARCHAR(255),
    contato_responsavel VARCHAR(100),
    telefone VARCHAR(20),
    email VARCHAR(100),
    descricao TEXT,
    infraestrutura JSONB,
    aceita_pets BOOLEAN DEFAULT false,
    tipo_feminino BOOLEAN DEFAULT false,
    tipo_masculino BOOLEAN DEFAULT false,
    restricoes TEXT,
    horario_funcionamento VARCHAR(100),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER REFERENCES usuarios(id),
    verificado BOOLEAN DEFAULT false
);

-- Tabela de necessidades
CREATE TABLE necessidades (
    id SERIAL PRIMARY KEY,
    abrigo_id INTEGER NOT NULL REFERENCES abrigos(id) ON DELETE CASCADE,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('alimento', 'higiene', 'roupa', 'medicamento', 'outro')),
    item VARCHAR(100) NOT NULL,
    quantidade_necessaria INTEGER,
    unidade VARCHAR(20),
    prioridade VARCHAR(20) DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
    descricao TEXT,
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atendida BOOLEAN DEFAULT false
);

-- Tabela de doações
CREATE TABLE doacoes (
    id SERIAL PRIMARY KEY,
    abrigo_id INTEGER NOT NULL REFERENCES abrigos(id) ON DELETE CASCADE,
    doador_nome VARCHAR(100) NOT NULL,
    doador_email VARCHAR(100),
    doador_telefone VARCHAR(20),
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('alimento', 'higiene', 'roupa', 'medicamento', 'financeira', 'outro')),
    item VARCHAR(100),
    quantidade DECIMAL(10, 2),
    unidade VARCHAR(20),
    valor_estimado DECIMAL(10, 2),
    data_doacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmada', 'entregue', 'cancelada')),
    observacoes TEXT
);

-- Tabela de avaliações
CREATE TABLE avaliacoes (
    id SERIAL PRIMARY KEY,
    abrigo_id INTEGER NOT NULL REFERENCES abrigos(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    nota INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario TEXT,
    data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    anonimo BOOLEAN DEFAULT false
);

-- Índices
CREATE INDEX idx_abrigos_cidade ON abrigos(cidade);
CREATE INDEX idx_abrigos_tipo ON abrigos(tipo);
CREATE INDEX idx_abrigos_ativo ON abrigos(ativo);
CREATE INDEX idx_abrigos_localizacao ON abrigos(latitude, longitude);
CREATE INDEX idx_necessidades_abrigo ON necessidades(abrigo_id);
CREATE INDEX idx_necessidades_atendida ON necessidades(atendida);
CREATE INDEX idx_doacoes_abrigo ON doacoes(abrigo_id);
CREATE INDEX idx_doacoes_status ON doacoes(status);
CREATE INDEX idx_avaliacoes_abrigo ON avaliacoes(abrigo_id);


INSERT INTO usuarios (nome, email, senha, tipo, telefone, cpf) VALUES
('Admin Sistema', 'admin@baitaajuda.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '(51) 99999-0000', '000.000.000-00'),
('Maria Silva', 'maria@baitaajuda.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'gestor', '(51) 99999-0001', '111.111.111-11'),
('João Santos', 'joao@baitaajuda.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'comum', '(51) 98888-0000', '222.222.222-22');


INSERT INTO abrigos (nome, endereco, latitude, longitude, cidade, estado, tipo, capacidade_total, vagas_disponiveis, contato_responsavel, telefone, email, descricao, infraestrutura, aceita_pets, tipo_feminino, tipo_masculino, ativo, usuario_id, verificado) VALUES
('Ginásio Municipal Centro', 'Rua dos Andradas, 1234 - Centro, Porto Alegre - RS', -30.0346, -51.2177, 'Porto Alegre', 'RS', 'emergencia', 200, 150, 'João Santos', '(51) 3333-1111', 'ginasio@poa.rs.gov.br', 'Abrigo emergencial com estrutura completa.', '{"banheiros": 10, "chuveiros": 8, "cozinha": true}', false, true, true, true, 2, true),

('Centro Comunitário Sarandi', 'Av. Assis Brasil, 3500 - Sarandi, Porto Alegre - RS', -30.0030, -51.1730, 'Porto Alegre', 'RS', 'temporario', 120, 80, 'Ana Paula Costa', '(51) 3342-2222', 'sarandi@poa.rs.gov.br', 'Abrigo comunitário na zona norte.', '{"banheiros": 6, "chuveiros": 6}', true, true, true, true, 2, true),

('Casa Restinga', 'Rua Aparício Borges, 234 - Restinga, Porto Alegre - RS', -30.1736, -51.1088, 'Porto Alegre', 'RS', 'permanente', 80, 50, 'Carlos Lima', '(51) 3361-3333', 'restinga@poa.rs.gov.br', 'Abrigo permanente na zona sul.', '{"banheiros": 5, "lavanderia": true}', false, true, true, true, 2, true),

('Abrigo Canoas', 'Av. Guilherme Schell, 6750 - Centro, Canoas - RS', -29.9177, -51.1854, 'Canoas', 'RS', 'emergencia', 150, 100, 'Fernanda Souza', '(51) 3472-4444', 'canoas@prefeitura.rs.gov.br', 'Principal abrigo de Canoas.', '{"banheiros": 8, "enfermaria": true}', true, true, true, true, 2, true),

('Centro NH', 'Av. Nações Unidas, 5000 - Centro, Novo Hamburgo - RS', -29.6783, -51.1320, 'Novo Hamburgo', 'RS', 'temporario', 100, 70, 'Roberto Alves', '(51) 3593-5555', 'nh@prefeitura.rs.gov.br', 'Abrigo central de NH.', '{"banheiros": 6, "sala_capacitacao": true}', false, true, true, true, 2, true),

('Abrigo São Leopoldo', 'Av. Feitoria, 1500 - Feitoria, São Leopoldo - RS', -29.7604, -51.1480, 'São Leopoldo', 'RS', 'permanente', 90, 60, 'Patricia Mendes', '(51) 3592-6666', 'abrigo@saoleopoldo.rs.gov.br', 'Abrigo com parceria universitária.', '{"biblioteca": true, "cursos": true}', false, true, true, true, 2, true),

('Casa Viamão', 'Av. João Goulart, 2345 - Centro, Viamão - RS', -30.0811, -51.0233, 'Viamão', 'RS', 'temporario', 70, 45, 'Lucas Ferreira', '(51) 3485-7777', 'viamao@abrigo.org.br', 'Abrigo familiar.', '{"area_externa": true, "horta": true}', true, true, true, true, 2, true),

('Abrigo Gravataí', 'Av. Dorival Cândido, 3456 - Centro, Gravataí - RS', -29.9436, -50.9919, 'Gravataí', 'RS', 'emergencia', 110, 75, 'Juliana Rocha', '(51) 3489-8888', 'gravatai@prefeitura.rs.gov.br', 'Estrutura moderna.', '{"banheiros": 7, "enfermaria": true}', false, true, true, true, 2, true),

('Centro Comunitário Alvorada', 'Av. Presidente Vargas, 2500 - Centro, Alvorada - RS', -30.0011, -51.0800, 'Alvorada', 'RS', 'temporario', 85, 55, 'Marina Costa', '(51) 3441-1111', 'alvorada@prefeitura.rs.gov.br', 'Abrigo comunitário.', '{"playground": true, "cozinha": true}', true, true, true, true, 2, true),

('Casa Cachoeirinha', 'Av. Flores da Cunha, 3200 - Centro, Cachoeirinha - RS', -29.9511, -51.0944, 'Cachoeirinha', 'RS', 'permanente', 95, 65, 'Raquel Soares', '(51) 3470-2222', 'cachoeirinha@prefeitura.rs.gov.br', 'Abrigo permanente.', '{"acessibilidade": true}', false, true, true, true, 2, true),

('Abrigo Zona Sul POA', 'Av. Cavalhada, 4500 - Cavalhada, Porto Alegre - RS', -30.1200, -51.2400, 'Porto Alegre', 'RS', 'emergencia', 130, 90, 'André Silva', '(51) 3268-3333', 'zonasul@poa.rs.gov.br', 'Zona sul de POA.', '{"estacionamento": true}', false, true, true, true, 2, true),

('Centro Lomba', 'Est. João de Oliveira Remião, 5678 - Lomba, Porto Alegre - RS', -30.1500, -51.1200, 'Porto Alegre', 'RS', 'temporario', 75, 50, 'Carla Santos', '(51) 3349-4444', 'lomba@poa.rs.gov.br', 'Zona leste.', '{"horta": true}', false, true, true, true, 2, true),

('Abrigo Partenon', 'Av. Bento Gonçalves, 2300 - Partenon, Porto Alegre - RS', -30.0600, -51.1700, 'Porto Alegre', 'RS', 'emergencia', 140, 95, 'Roberto Lima', '(51) 3330-5555', 'partenon@poa.rs.gov.br', 'Zona leste.', '{"enfermaria": true}', true, true, true, true, 2, true),

('Casa Esteio', 'Rua XV de Novembro, 450 - Centro, Esteio - RS', -29.8585, -51.1793, 'Esteio', 'RS', 'temporario', 65, 40, 'Paula Oliveira', '(51) 3458-6666', 'esteio@prefeitura.rs.gov.br', 'Centro de Esteio.', '{"cozinha": true}', false, true, true, true, 2, true),

('Abrigo Sapucaia', 'Av. Leônidas de Souza, 1200 - Centro, Sapucaia do Sul - RS', -29.8268, -51.1464, 'Sapucaia do Sul', 'RS', 'permanente', 80, 55, 'Bruno Dias', '(51) 3474-7777', 'sapucaia@prefeitura.rs.gov.br', 'Sapucaia do Sul.', '{"sala_tv": true}', false, true, true, true, 2, true);

-- Necessidades (1 por abrigo)
INSERT INTO necessidades (abrigo_id, categoria, item, quantidade_necessaria, unidade, prioridade, descricao) VALUES
(1, 'alimento', 'Arroz', 100, 'kg', 'alta', 'Alimentação diária'),
(2, 'higiene', 'Sabonete', 200, 'unidades', 'media', 'Higiene'),
(3, 'roupa', 'Cobertores', 50, 'unidades', 'alta', 'Inverno'),
(4, 'alimento', 'Feijão', 80, 'kg', 'alta', 'Básico'),
(5, 'medicamento', 'Primeiros socorros', 5, 'kits', 'urgente', 'Emergências'),
(6, 'higiene', 'Papel higiênico', 100, 'rolos', 'media', 'Banheiros'),
(7, 'alimento', 'Leite', 50, 'litros', 'media', 'Crianças'),
(8, 'roupa', 'Agasalhos', 40, 'peças', 'alta', 'Frio'),
(9, 'alimento', 'Macarrão', 60, 'kg', 'media', 'Alimentação'),
(10, 'higiene', 'Fraldas', 80, 'pacotes', 'alta', 'Bebês'),
(11, 'alimento', 'Óleo', 30, 'litros', 'baixa', 'Cozinha'),
(12, 'roupa', 'Roupas infantis', 50, 'peças', 'media', 'Crianças'),
(13, 'medicamento', 'Analgésicos', 10, 'caixas', 'media', 'Dores'),
(14, 'alimento', 'Açúcar', 40, 'kg', 'baixa', 'Cozinha'),
(15, 'higiene', 'Escova dental', 100, 'unidades', 'media', 'Higiene bucal');

-- Atualizar sequências
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));
SELECT setval('abrigos_id_seq', (SELECT MAX(id) FROM abrigos));
SELECT setval('necessidades_id_seq', (SELECT MAX(id) FROM necessidades));

ALTER TABLE necessidades
DROP COLUMN quantidade_necessaria,
ADD COLUMN nivel VARCHAR(20) CHECK (nivel IN ('urgente', 'em_falta', 'suficiente', 'em_excesso')) DEFAULT 'em_falta';

-- Resumo
SELECT
    'BANCO INICIALIZADO!' as status,
    (SELECT COUNT(*) FROM usuarios) as usuarios,
    (SELECT COUNT(*) FROM abrigos) as abrigos_ativos,
    (SELECT SUM(vagas_disponiveis) FROM abrigos) as vagas_totais;
