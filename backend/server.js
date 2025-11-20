require('dotenv').config(); // ← Adicionar no topo
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Database configuration - USAR VARIÁVEIS DE AMBIENTE
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

// Middleware
app.use(cors());
app.use(express.json());

// Utility functions
const validateFields = (data, required) => {
  const missing = required.filter(field => {
    const value = data[field];
    if (typeof value === 'string') {
      return !value.trim();
    }
    return value === null || value === undefined || value === '';
  });
  return missing.length === 0 ? null : `Missing: ${missing.join(', ')}`;
};

const handleError = (res, error, message = 'Internal server error') => {
  console.error(message + ':', error.message);
  res.status(500).json({ success: false, error: message });
};

const badRequest = (res, message) => {
  res.status(400).json({ success: false, error: message });
};

const unauthorized = (res, message = 'Invalid credentials') => {
  res.status(401).json({ success: false, error: message });
};

// Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    const validation = validateFields(req.body, ['nome', 'email', 'senha']);
    if (validation) return badRequest(res, validation);

    if (senha.length < 6) {
      return badRequest(res, 'Password must be at least 6 characters');
    }

    const emailExists = await pool.query(
      'SELECT id FROM Usuarios WHERE email = $1',
      [email.toLowerCase()]
    );

    if (emailExists.rows.length > 0) {
      return badRequest(res, 'Email already in use');
    }

    const hashedPassword = await bcrypt.hash(senha, 12);
    const result = await pool.query(
      'INSERT INTO Usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email',
      [nome.trim(), email.toLowerCase().trim(), hashedPassword]
    );

    console.log('User created:', result.rows[0].email);
    res.status(201).json({ success: true, user: result.rows[0] });

  } catch (error) {
    handleError(res, error, 'Registration failed');
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    const validation = validateFields(req.body, ['email', 'senha']);
    if (validation) return badRequest(res, validation);

    const result = await pool.query(
      'SELECT * FROM Usuarios WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return unauthorized(res);
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(senha, user.senha_hash);

    if (!isValid) {
      return unauthorized(res);
    }

    console.log('Login successful:', user.email);
    res.json({
      success: true,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email
      }
    });

  } catch (error) {
    handleError(res, error, 'Login failed');
  }
});

// Criar abrigo - CORRIGIDO
app.post('/api/abrigos', async (req, res) => {
  try {
    const { nome, endereco, tipo_abrigo, vagas_disponiveis, formulario_inscricao_url, usuario_id } = req.body;

    console.log('=== CRIAR ABRIGO ===');
    console.log('Dados recebidos:', req.body);

    // Validar campos obrigatórios
    const validation = validateFields(req.body, ['nome', 'endereco', 'usuario_id']);
    if (validation) return badRequest(res, validation);

    // Verificar se o usuário existe
    const userExists = await pool.query(
      'SELECT id FROM Usuarios WHERE id = $1',
      [usuario_id]
    );

    if (userExists.rows.length === 0) {
      return badRequest(res, 'User not found');
    }

    const spots = parseInt(vagas_disponiveis) || 0;
    if (spots < 0) {
      return badRequest(res, 'Spots cannot be negative');
    }

    // Processar tipo_abrigo - CORRIGIDO
    const flags = {
      tipo_feminino: false,
      aceita_pets: false,
      tipo_masculino: false,
    };

    if (tipo_abrigo && Array.isArray(tipo_abrigo)) {
      const validTypes = ['Pets', 'Feminino', 'Masculino'];
      
      // Validar tipos
      const invalidTypes = tipo_abrigo.filter(type => !validTypes.includes(type));
      if (invalidTypes.length > 0) {
        return badRequest(res, `Invalid type provided: ${invalidTypes.join(', ')}`);
      }

      flags.tipo_feminino = tipo_abrigo.includes('Feminino');
      flags.aceita_pets = tipo_abrigo.includes('Pets');
      flags.tipo_masculino = tipo_abrigo.includes('Masculino');
    }

    console.log('Flags processados:', flags);

    const cleanNome = nome.trim();
    const cleanEndereco = endereco.trim();
    const cleanUrl = formulario_inscricao_url ? formulario_inscricao_url.trim() : null;

    const result = await pool.query(
      `INSERT INTO Abrigos (usuario_id, nome, endereco, aceita_pets, tipo_feminino, tipo_masculino, vagas_disponiveis, formulario_inscricao_url, ativo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) RETURNING *`,
      [usuario_id, cleanNome, cleanEndereco, flags.aceita_pets, flags.tipo_feminino, flags.tipo_masculino, spots, cleanUrl]
    );

    console.log('Shelter created:', result.rows[0]);
    res.status(201).json({ success: true, abrigo: result.rows[0] });

  } catch (error) {
    console.error('=== ERRO AO CRIAR ABRIGO ===');
    console.error(error);
    handleError(res, error, 'Shelter creation failed');
  }
});

// Listar abrigos - CORRIGIDO
app.get('/api/abrigos', async (req, res) => {
  try {
    console.log('=== BUSCAR ABRIGOS ===');
    console.log('Query params:', req.query);

    const { search, min_vagas, tipo_feminino, aceita_pets, tipo_masculino, lat, lng } = req.query;
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    const offset = (page - 1) * limit;

    let selectClause = 'SELECT a.*, u.nome as responsavel_nome';
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      if (!isNaN(latitude) && !isNaN(longitude)) {
        selectClause += `, 
          (6371 * acos(
            cos(radians(${latitude})) * 
            cos(radians(COALESCE(a.latitude, -30.0346))) * 
            cos(radians(COALESCE(a.longitude, -51.2177)) - radians(${longitude})) + 
            sin(radians(${latitude})) * 
            sin(radians(COALESCE(a.latitude, -30.0346)))
          )) * 1000 as distance_meters`;
      }
    }

    let whereClause = 'WHERE a.ativo = true';
    const params = [];
    let paramIndex = 1;

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (a.nome ILIKE $${paramIndex} OR a.endereco ILIKE $${paramIndex})`;
      paramIndex++;
    }

    if (min_vagas) {
      params.push(parseInt(min_vagas));
      whereClause += ` AND a.vagas_disponiveis >= $${paramIndex}`;
      paramIndex++;
    }

    if (tipo_feminino === 'true') {
      whereClause += ` AND a.tipo_feminino = true`;
    }

    if (tipo_masculino === 'true') {
      whereClause += ` AND a.tipo_masculino = true`;
    }

    if (aceita_pets === 'true') {
      whereClause += ` AND a.aceita_pets = true`;
    }

    // Contar total
    const countQuery = `SELECT COUNT(*) FROM Abrigos a ${whereClause}`;
    const totalResult = await pool.query(countQuery, params);
    const totalShelters = parseInt(totalResult.rows[0].count);
    const totalPages = Math.ceil(totalShelters / limit);

    // Ordenação
    let orderByClause = 'ORDER BY a.created_at DESC';
    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      orderByClause = 'ORDER BY distance_meters ASC';
    }

    // Query principal
    const resultsQuery = `
      ${selectClause}
      FROM Abrigos a
      LEFT JOIN Usuarios u ON a.usuario_id = u.id
      ${whereClause}
      ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    console.log('Query SQL:', resultsQuery);
    console.log('Params:', params);

    const result = await pool.query(resultsQuery, params);

    console.log(`Encontrados ${result.rows.length} abrigos`);

    res.json({
      success: true,
      abrigos: result.rows,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalShelters: totalShelters,
        limit: limit
      }
    });

  } catch (error) {
    console.error('=== ERRO AO BUSCAR ABRIGOS ===');
    console.error(error);
    handleError(res, error, 'Shelters listing failed');
  }
});

// Buscar abrigos de um usuário específico
app.get('/api/abrigos/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(`
      SELECT * FROM Abrigos
      WHERE usuario_id = $1 AND ativo = true
      ORDER BY created_at DESC
    `, [userId]);

    console.log(`Found ${result.rows.length} shelters for user ${userId}`);
    res.json({ success: true, abrigos: result.rows });

  } catch (error) {
    handleError(res, error, 'Failed to fetch user shelters');
  }
});

// Buscar um abrigo específico
app.get('/api/abrigos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM Abrigos WHERE id = $1 AND ativo = true',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Abrigo não encontrado' });
    }

    res.json({ success: true, abrigo: result.rows[0] });

  } catch (error) {
    handleError(res, error, 'Failed to fetch shelter');
  }
});

// GET reviews for a specific shelter
app.get('/api/abrigos/:id/avaliacoes', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM Avaliacoes WHERE abrigo_id = $1 ORDER BY data_avaliacao DESC',
      [id]
    );

    res.json({ success: true, avaliacoes: result.rows });

  } catch (error) {
    handleError(res, error, 'Failed to fetch shelter reviews');
  }
});

// Atualizar um abrigo
app.put('/api/abrigos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, endereco, tipo_abrigo, vagas_disponiveis, formulario_inscricao_url } = req.body;

    const validation = validateFields(req.body, ['nome', 'endereco']);
    if (validation) return badRequest(res, validation);

    const spots = parseInt(vagas_disponiveis) || 0;
    if (spots < 0) {
      return badRequest(res, 'Spots cannot be negative');
    }

    const cleanNome = nome.trim();
    const cleanEndereco = endereco.trim();
    const cleanUrl = formulario_inscricao_url ? formulario_inscricao_url.trim() : null;

    const result = await pool.query(`
      UPDATE Abrigos
      SET nome = $1, endereco = $2, vagas_disponiveis = $3, formulario_inscricao_url = $4, updated_at = NOW()
      WHERE id = $5 AND ativo = true
      RETURNING *
    `, [cleanNome, cleanEndereco, spots, cleanUrl, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Abrigo não encontrado' });
    }

    console.log('Shelter updated:', result.rows[0].nome);
    res.json({ success: true, abrigo: result.rows[0] });

  } catch (error) {
    handleError(res, error, 'Failed to update shelter');
  }
});

// Deletar um abrigo (soft delete)
app.delete('/api/abrigos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE Abrigos SET ativo = false WHERE id = $1 AND ativo = true RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Abrigo não encontrado' });
    }

    console.log('Shelter deleted:', id);
    res.json({ success: true, message: 'Abrigo deletado com sucesso' });

  } catch (error) {
    handleError(res, error, 'Failed to delete shelter');
  }
});

// Buscar necessidades de um abrigo
app.get('/api/abrigos/:id/necessidades', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM Necessidades WHERE abrigo_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json({ success: true, necessidades: result.rows });

  } catch (error) {
    handleError(res, error, 'Failed to fetch shelter needs');
  }
});

// Adicionar necessidade a um abrigo
app.post('/api/abrigos/:id/necessidades', async (req, res) => {
  try {
    const { id } = req.params;
    const { item, quantidade, urgencia } = req.body;

    const validation = validateFields(req.body, ['item', 'quantidade']);
    if (validation) return badRequest(res, validation);

    const abrigoExists = await pool.query(
      'SELECT id FROM Abrigos WHERE id = $1 AND ativo = true',
      [id]
    );

    if (abrigoExists.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Abrigo não encontrado' });
    }

    const result = await pool.query(
      'INSERT INTO Necessidades (abrigo_id, item, quantidade, urgencia) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, item.trim(), quantidade.trim(), urgencia || 'media']
    );

    console.log('Need added:', result.rows[0].item);
    res.status(201).json({ success: true, necessidade: result.rows[0] });

  } catch (error) {
    handleError(res, error, 'Failed to add shelter need');
  }
});

// Atualizar necessidade
app.put('/api/necessidades/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { item, quantidade } = req.body;

    const validation = validateFields(req.body, ['item', 'quantidade']);
    if (validation) return badRequest(res, validation);

    const result = await pool.query(
      'UPDATE Necessidades SET item = $1, quantidade = $2 WHERE id = $3 RETURNING *',
      [item.trim(), quantidade.trim(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Necessidade não encontrada' });
    }

    console.log('Need updated:', result.rows[0].item);
    res.json({ success: true, necessidade: result.rows[0] });

  } catch (error) {
    handleError(res, error, 'Failed to update need');
  }
});

// Deletar necessidade
app.delete('/api/necessidades/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM Necessidades WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Necessidade não encontrada' });
    }

    console.log('Need deleted:', id);
    res.json({ success: true, message: 'Necessidade removida com sucesso' });

  } catch (error) {
    handleError(res, error, 'Failed to delete need');
  }
});

app.post('/api/abrigos/:id/doacoes', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { doador_nome, doador_contato, doacoes } = req.body;

    // --- Validation ---
    if (!doador_nome || !doacoes || !Array.isArray(doacoes) || doacoes.length === 0) {
      return res.status(400).json({ success: false, error: 'Dados de doação inválidos.' });
    }

    // Use a transaction to ensure all donations are saved together
    await client.query('BEGIN');

    for (const doacao of doacoes) {
      const { necessidade_id, quantidade } = doacao;
      if (!necessidade_id || !quantidade || quantidade <= 0) {
        throw new Error('Item de doação inválido encontrado.');
      }

      await client.query(
        `INSERT INTO Doacoes (abrigo_id, necessidade_id, quantidade_doada, doador_nome, doador_contato)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, necessidade_id, quantidade, doador_nome, doador_contato]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Doação registrada com sucesso!' });

  } catch (error) {
    await client.query('ROLLBACK');
    handleError(res, error, 'Failed to register donation');
  } finally {
    client.release();
  }
});

// GET donations for a specific shelter
app.get('/api/abrigos/:id/doacoes', async (req, res) => {
    try {
	const { id } = req.params;

	const result = await pool.query(
	    `SELECT d.id, d.doador_nome, d.quantidade_doada, d.data_doacao, n.item AS item_nome
       FROM Doacoes d
       JOIN Necessidades n ON d.necessidade_id = n.id
       WHERE d.abrigo_id = $1
       ORDER BY d.data_doacao DESC`,
	    [id]
	);

	res.json({ success: true, doacoes: result.rows });
    } catch (error) {
	handleError(res, error, 'Failed to fetch shelter donations');
    }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
});
