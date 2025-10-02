-- =================================================================
-- ARQUIVO DE SEEDS PARA POPULAR O BANCO COM DADOS DE TESTE
-- Localização: Porto Alegre/RS
-- =================================================================

-- 1. INSERIR USUÁRIOS DE TESTE
-- Em uma aplicação real, a senha_hash seria gerada por uma biblioteca como bcrypt.
INSERT INTO Usuarios (id, nome, email, senha_hash) VALUES
(1, 'João da Silva', 'joao.silva@email.com', 'senha_super_segura_hashed_123'),
(2, 'Maria Oliveira', 'maria.oliveira@email.com', 'outra_senha_segura_hashed_456')
ON CONFLICT (id) DO NOTHING;


-- 2. INSERIR ABRIGOS DE TESTE EM PORTO ALEGRE/RS
-- A localização usa a função do PostGIS: ST_GeographyFromText('SRID=4326;POINT(longitude latitude)')
INSERT INTO Abrigos (id, usuario_id, nome, endereco, localizacao, tipo_abrigo, vagas_disponiveis, media_avaliacoes, ativo) VALUES
(1, 1, 'Abrigo Gigantinho Solidário', 'Avenida Padre Cacique, 891 - Praia de Belas, Porto Alegre - RS', ST_GeographyFromText('SRID=4326;POINT(-51.2360 -30.0670)'), 'Familiar', 150, 4.80, TRUE),
(2, 1, 'Centro Comunitário da Restinga', 'Estrada João Antônio da Silveira, 2355 - Restinga, Porto Alegre - RS', ST_GeographyFromText('SRID=4326;POINT(-51.1445 -30.1470)'), 'Familiar', 80, 4.50, TRUE),
(3, 2, 'Abrigo Exclusivo para Mulheres', 'Rua dos Andradas, 1001 - Centro Histórico, Porto Alegre - RS', ST_GeographyFromText('SRID=4326;POINT(-51.2287 -30.0318)'), 'Feminino', 40, 0.0, TRUE),
(4, 2, 'Abrigo Amigo Pet - Sarandi', 'Avenida Assis Brasil, 8000 - Sarandi, Porto Alegre - RS', ST_GeographyFromText('SRID=4326;POINT(-51.1450 -30.0050)'), 'Pets', 60, 5.0, TRUE),
(5, 1, 'Albergue Noturno Teste Baixa Avaliação', 'Rua Voluntários da Pátria, 500 - Floresta, Porto Alegre - RS', ST_GeographyFromText('SRID=4326;POINT(-51.2180 -30.0230)'), 'Masculino', 25, 2.50, TRUE),
(6, 2, 'Abrigo Inativo de Teste', 'Avenida Ipiranga, 6681 - Partenon, Porto Alegre - RS', ST_GeographyFromText('SRID=4326;POINT(-51.1800 -30.0590)'), 'Familiar', 0, 0.0, FALSE)
ON CONFLICT (id) DO NOTHING;


-- 3. INSERIR NECESSIDADES PARA OS ABRIGOS
INSERT INTO Necessidades (abrigo_id, item, quantidade) VALUES
(1, 'Água Potável', 'Grande quantidade - Urgente'),
(1, 'Colchões e Cobertores', 'Muitos'),
(1, 'Alimentos não perecíveis', 'Grande volume'),
(2, 'Roupas infantis (0-10 anos)', 'Qualquer quantidade'),
(2, 'Fraldas (todos os tamanhos)', 'Urgente'),
(3, 'Produtos de higiene feminina', 'Muitos'),
(4, 'Ração para cães e gatos', 'Urgente'),
(4, 'Caixas de transporte para pets', '10 unidades'),
(5, 'Roupas masculinas (adulto)', 'Qualquer quantidade');


-- 4. INSERIR AVALIAÇÕES PARA OS ABRIGOS
-- Nota: A média na tabela Abrigos foi inserida manualmente para fins de teste.
-- Em uma aplicação real, essa média seria calculada pelo backend a cada nova avaliação.
INSERT INTO Avaliacoes (abrigo_id, nota, comentario) VALUES
(1, 5, 'Excelente organização e muito seguro para a família.'),
(1, 4, 'Bom atendimento, mas precisa de mais voluntários.'),
(1, 5, 'Muito bem estruturado, limpo e com comida de qualidade.'),
(2, 4, 'Ótimo lugar, salvaram minha família. Só um pouco cheio.'),
(2, 5, 'Acolhimento nota 10!'),
(4, 5, 'Cuidaram muito bem do meu cachorro, sou muito grato!'),
(5, 2, 'A estrutura é precária e a organização é confusa.'),
(5, 3, 'É um teto, mas poderia ser melhor. Poucos banheiros.');

-- Ajusta a sequência dos IDs para evitar conflitos ao inserir novos dados pela aplicação
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM Usuarios));
SELECT setval('abrigos_id_seq', (SELECT MAX(id) FROM Abrigos));
SELECT setval('necessidades_id_seq', (SELECT MAX(id) FROM Necessidades));
SELECT setval('avaliacoes_id_seq', (SELECT MAX(id) FROM Avaliacoes));
