const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const app = express();
const PORT = 5000;

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'baita_ajuda',
  password: 'postgres',
  port: 5432,
});

// Test connection
pool.connect()
  .then(() => console.log('Database connected'))
  .catch(err => {
    console.error('Database error:', err.message);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Utility functions - CORRIGIDA para lidar com diferentes tipos de dados
const validateFields = (data, required) => {
  const missing = required.filter(field => {
    const value = data[field];
    // Se for string, verificar se não está vazia após trim
    if (typeof value === 'string') {
      return !value.trim();
    }
    // Para outros tipos (números, etc), verificar se não é null/undefined
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
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend running' });
});

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

// Criar abrigo - CORRIGIDO para validação adequada
app.post('/api/abrigos', async (req, res) => {
  try {
    const { nome, endereco, tipo_abrigo, vagas_disponiveis, formulario_inscricao_url, usuario_id } = req.body;

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

      // Validar tipo_abrigo se fornecido
      const validTypes = ['Pets', 'Feminino', 'Masculino'];
      if (tipo_abrigo && (
	  !Array.isArray(tipo_abrigo) ||
	      !tipo_abrigo.every(type => validTypes.includes(type))
      )) {
	  return badRequest(res, `Invalid type provided. Options: ${validTypes.join(', ')}`);
      }

      const flags = {
	  tipo_feminino: tipo_abrigo.includes('Feminino'),
	  aceita_pets: tipo_abrigo.includes('Pets'),
	  tipo_masculino: tipo_abrigo.includes('Masculino'),
      };

      console.log(tipo_abrigo)
      console.log(flags)
    // Limpar strings apenas se não forem nulas/undefined
    const cleanNome = nome ? nome.trim() : '';
    const cleanEndereco = endereco ? endereco.trim() : '';
    const cleanUrl = formulario_inscricao_url ? formulario_inscricao_url.trim() : null;

    const result = await pool.query(
	'INSERT INTO Abrigos (usuario_id, nome, endereco, aceita_pets, tipo_feminino, tipo_masculino, vagas_disponiveis, formulario_inscricao_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
	[usuario_id, cleanNome, cleanEndereco, flags.aceita_pets, flags.tipo_feminino, flags.tipo_masculino, spots, cleanUrl]
    );

    console.log('Shelter created:', result.rows[0].nome, 'for user:', usuario_id);
    res.status(201).json({ success: true, abrigo: result.rows[0] });

  } catch (error) {
    handleError(res, error, 'Shelter creation failed');
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, email, data_criacao FROM Usuarios ORDER BY data_criacao DESC'
    );

    res.json({ success: true, users: result.rows });

  } catch (error) {
    handleError(res, error, 'Users listing failed');
  }
});

app.get('/api/abrigos', async (req, res) => {
    try {

	const { search, min_vagas, tipo_feminino, aceita_pets, tipo_masculino, lat, lng } = req.query;
	const page = parseInt(req.query.page || '1');
	const limit = parseInt(req.query.limit || '10');
	const offset = (page - 1) * limit;

	let selectClause = 'SELECT a.*, u.nome as responsavel_nome';
	if (lat && lng) {
	    // ST_Distance returns distance in meters
	    selectClause += `, ST_Distance(a.localizacao, ST_MakePoint(${lng}, ${lat})::geography) as distance_meters`;
	}

	let whereClause = `
      WHERE a.ativo = true
    `;

	const params = [];
	let paramIndex = 1;

	if (search) {
	    params.push(`%${search}%`); // Add wildcards for partial matching
	    whereClause += ` AND (a.nome ILIKE $${paramIndex} OR a.endereco ILIKE $${paramIndex++})`; // ILIKE is case-insensitive
	}
	if (min_vagas) {
	    params.push(parseInt(min_vagas));
	    whereClause += ` AND a.vagas_disponiveis >= $${paramIndex++}`;
	}

	if (tipo_feminino === 'true') { // Query params are strings
	    whereClause += ` AND a.tipo_feminino = true`;
	}

	if (tipo_masculino === 'true') { // Query params are strings
	    whereClause += ` AND a.tipo_feminino = true`;
	}

	if (aceita_pets === 'true') {
	    whereClause += ` AND a.aceita_pets = true`;
	}

	const countQuery = `SELECT COUNT(*) FROM Abrigos a ${whereClause}`;
	const totalResult = await pool.query(countQuery, params);
	const totalShelters = parseInt(totalResult.rows[0].count);
	const totalPages = Math.ceil(totalShelters / limit);

	let orderByClause = 'ORDER BY a.media_avaliacoes DESC';
	if (lat && lng) {
	    // Order by the calculated distance, ascending
	    orderByClause = 'ORDER BY distance_meters ASC';
	}

	const resultsQuery = `
      ${selectClause}
      FROM Abrigos a
      JOIN Usuarios u ON a.usuario_id = u.id
      ${whereClause}
      ${orderByClause}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
	const result = await pool.query(resultsQuery, [...params, limit, offset]);
//	const result = await pool.query(baseQuery, params);

	//	res.json({ success: true, abrigos: result.rows });
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
      ORDER BY data_criacao DESC
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

    // Validar tipo_abrigo se fornecido
    const validTypes = ['Familiar', 'Feminino', 'Masculino', 'Pets'];
    if (tipo_abrigo && !validTypes.includes(tipo_abrigo)) {
      return badRequest(res, 'Invalid shelter type');
    }

    const cleanNome = nome ? nome.trim() : '';
    const cleanEndereco = endereco ? endereco.trim() : '';
    const cleanUrl = formulario_inscricao_url ? formulario_inscricao_url.trim() : null;

    const result = await pool.query(`
      UPDATE Abrigos
      SET nome = $1, endereco = $2, tipo_abrigo = $3,
          vagas_disponiveis = $4, formulario_inscricao_url = $5
      WHERE id = $6 AND ativo = true
      RETURNING *
    `, [cleanNome, cleanEndereco, tipo_abrigo || null, spots, cleanUrl, id]);

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
      'SELECT * FROM Necessidades WHERE abrigo_id = $1 ORDER BY id DESC',
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
    const { item, quantidade } = req.body;

    const validation = validateFields(req.body, ['item', 'quantidade']);
    if (validation) return badRequest(res, validation);

    // Verificar se o abrigo existe
    const abrigoExists = await pool.query(
      'SELECT id FROM Abrigos WHERE id = $1 AND ativo = true',
      [id]
    );

    if (abrigoExists.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Abrigo não encontrado' });
    }

    const result = await pool.query(
      'INSERT INTO Necessidades (abrigo_id, item, quantidade) VALUES ($1, $2, $3) RETURNING *',
      [id, item.trim(), quantidade.trim()]
    );

    console.log('Need added:', result.rows[0].item, 'to shelter:', id);
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
