require('dotenv').config(); // ← Adicionar no topo
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 5000;

// Database configuration - USAR VARIÁVEIS DE AMBIENTE
// Coerce types to avoid pg errors (password must be a string, port must be a number)
const dbPassword = process.env.DB_PASSWORD != null ? String(process.env.DB_PASSWORD) : undefined;
const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined;

if (!dbPassword) {
  console.warn('⚠️  DB_PASSWORD não está definida. Verifique backend/.env');
}

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: dbPassword,
  port: dbPort
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

    // Detect whether the usuarios table has a coluna 'senha_hash'. If not, fall back to legacy 'senha'.
    const colRes = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'senha_hash'"
    );
    const hasSenhaHash = colRes.rows.length > 0;

    let insertResult;
    if (hasSenhaHash) {
      insertResult = await pool.query(
        'INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email',
        [nome.trim(), email.toLowerCase().trim(), hashedPassword]
      );
    } else {
      // legacy schema: column is 'senha'
      insertResult = await pool.query(
        'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email',
        [nome.trim(), email.toLowerCase().trim(), hashedPassword]
      );
    }

    console.log('User created:', insertResult.rows[0].email);
    res.status(201).json({ success: true, user: insertResult.rows[0] });

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
    // Support both legacy (senha) and newer (senha_hash) column names
    const storedHash = user.senha_hash || user.senha;
    if (!storedHash) {
      console.warn('User has no password hash column (expected senha_hash or senha)');
      return unauthorized(res);
    }
    const isValid = await bcrypt.compare(senha, storedHash);

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
    // Detect schema differences: older init-db.sql uses different column names
    const colRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'abrigos'");
    const columns = colRes.rows.map(r => r.column_name);

    let insertResult;
    if (columns.includes('aceita_pets')) {
      // Newer schema: supports aceita_pets, tipo_feminino, tipo_masculino, formulario_inscricao_url
      insertResult = await pool.query(
        `INSERT INTO abrigos (usuario_id, nome, endereco, aceita_pets, tipo_feminino, tipo_masculino, vagas_disponiveis, formulario_inscricao_url, ativo) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) RETURNING *`,
        [usuario_id, cleanNome, cleanEndereco, flags.aceita_pets, flags.tipo_feminino, flags.tipo_masculino, spots, cleanUrl]
      );
    } else {
      // Legacy schema from init-db.sql: requires latitude, longitude, cidade, estado, tipo, capacidade_total, vagas_disponiveis
      const latitude = (req.body.latitude !== undefined) ? parseFloat(req.body.latitude) : -30.0346;
      const longitude = (req.body.longitude !== undefined) ? parseFloat(req.body.longitude) : -51.2177;
      const cidade = req.body.cidade || 'Porto Alegre';
      const estado = req.body.estado || 'RS';
      // Map provided tipo_abrigo to one of legacy allowed types if possible, otherwise default to 'temporario'
      let tipo = 'temporario';
      if (Array.isArray(tipo_abrigo) && tipo_abrigo.length > 0) {
        const lower = tipo_abrigo[0].toString().toLowerCase();
        if (['temporario','permanente','emergencia'].includes(lower)) tipo = lower;
      } else if (typeof tipo_abrigo === 'string') {
        const lower = tipo_abrigo.toLowerCase();
        if (['temporario','permanente','emergencia'].includes(lower)) tipo = lower;
      }
      const capacidade_total = parseInt(req.body.capacidade_total) || spots || 0;

      insertResult = await pool.query(
        `INSERT INTO abrigos (nome, endereco, latitude, longitude, cidade, estado, tipo, capacidade_total, vagas_disponiveis, contato_responsavel, telefone, email, descricao, infraestrutura, restricoes, horario_funcionamento, ativo, usuario_id, verificado)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,true,$17,false)
         RETURNING *`,
        [cleanNome, cleanEndereco, latitude, longitude, cidade, estado, tipo, capacidade_total, spots, null, null, null, null, null, null, null, usuario_id]
      );
    }

    console.log('Shelter created:', insertResult.rows[0]);
    res.status(201).json({ success: true, abrigo: insertResult.rows[0] });

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

    // Normalize coordinates: support both 'latitude'/'longitude' (legacy) and 'lat'/'lng' (other schemas)
    const normalizedRows = result.rows.map(r => {
      const latVal = r.latitude !== undefined && r.latitude !== null ? Number(r.latitude)
        : (r.lat !== undefined && r.lat !== null ? Number(r.lat) : undefined);
      const lngVal = r.longitude !== undefined && r.longitude !== null ? Number(r.longitude)
        : (r.lng !== undefined && r.lng !== null ? Number(r.lng) : undefined);

      return {
        ...r,
        lat: latVal,
        lng: lngVal
      };
    });

    console.log(`Encontrados ${normalizedRows.length} abrigos`);

    res.json({
      success: true,
      abrigos: normalizedRows,
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

    // Select columns matching the schema in backend/init-db.sql and alias them to the shape the frontend expects
    // init-db.sql defines: id, abrigo_id, categoria, item, quantidade_necessaria, unidade, prioridade, descricao, data_solicitacao, atendida
    const needsQuery = `
      SELECT id, abrigo_id, categoria, item, quantidade_necessaria AS quantidade, unidade,
             prioridade AS urgencia, descricao, data_solicitacao
      FROM necessidades
      WHERE abrigo_id = $1
      ORDER BY data_solicitacao DESC
    `;

    try {
      const result = await pool.query(needsQuery, [id]);
      return res.json({ success: true, necessidades: result.rows });
    } catch (err) {
      // fallback: try selecting with id ordering
      const fallback = `
        SELECT id, abrigo_id, categoria, item, quantidade_necessaria AS quantidade, unidade,
               prioridade AS urgencia, descricao
        FROM necessidades
        WHERE abrigo_id = $1
        ORDER BY id DESC
      `;
      const result = await pool.query(fallback, [id]);
      return res.json({ success: true, necessidades: result.rows });
    }

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

    // Map frontend fields to DB schema (init-db.sql)
    // frontend sends: { item, quantidade, urgencia }
    // DB columns: item, quantidade_necessaria, prioridade, categoria, unidade, descricao
    const categoria = 'outro';
    const quantidadeNec = parseInt(String(quantidade).trim()) || null;
    const prioridade = urgencia || 'media';

    const insertQuery = `
      INSERT INTO necessidades (abrigo_id, categoria, item, quantidade_necessaria, unidade, prioridade, descricao)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, abrigo_id, categoria, item, quantidade_necessaria AS quantidade, unidade, prioridade AS urgencia, descricao, data_solicitacao
    `;

    const result = await pool.query(insertQuery, [id, categoria, item.trim(), quantidadeNec, null, prioridade, null]);

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

    // Update mapping for init-db.sql schema: quantidade_necessaria column
    const quantidadeNec = parseInt(String(quantidade).trim()) || null;
    const result = await pool.query(
      `UPDATE necessidades SET item = $1, quantidade_necessaria = $2 WHERE id = $3 RETURNING id, abrigo_id, categoria, item, quantidade_necessaria AS quantidade, unidade, prioridade AS urgencia, descricao, data_solicitacao`,
      [item.trim(), quantidadeNec, id]
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

    // Determine schema: does doacoes table have necessidade_id column?
    const colRes = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'doacoes' AND column_name = 'necessidade_id'`
    );
    const hasNecessidadeId = colRes.rows.length > 0;

    // Use a transaction to ensure all donations are saved together
    await client.query('BEGIN');

    for (const doacao of doacoes) {
      const { necessidade_id, quantidade } = doacao;
      if (!necessidade_id || !quantidade || quantidade <= 0) {
        throw new Error('Item de doação inválido encontrado.');
      }

      if (hasNecessidadeId) {
        // Newer schema: store referência para necessidade
        await client.query(
          `INSERT INTO doacoes (abrigo_id, necessidade_id, quantidade_doada, doador_nome, doador_contato)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, necessidade_id, quantidade, doador_nome, doador_contato]
        );
      } else {
        // Older schema (init-db.sql): doacoes table doesn't link to necessidade_id
        // Fetch the necessidade to populate item/categoria/unidade
        const needRes = await client.query(
          `SELECT item, categoria, unidade FROM necessidades WHERE id = $1`,
          [necessidade_id]
        );
        if (needRes.rows.length === 0) {
          throw new Error(`Necessidade não encontrada: ${necessidade_id}`);
        }
        const need = needRes.rows[0];

        // Map doador_contato to email or telefone when possible
        let doador_email = null;
        let doador_telefone = null;
        if (typeof doador_contato === 'string') {
          if (doador_contato.includes('@')) doador_email = doador_contato;
          else doador_telefone = doador_contato;
        }

        await client.query(
          `INSERT INTO doacoes (abrigo_id, doador_nome, doador_email, doador_telefone, categoria, item, quantidade, unidade)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [id, doador_nome, doador_email, doador_telefone, need.categoria || 'outro', need.item, quantidade, need.unidade || null]
        );
      }
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

  // Check if doacoes table has necessidade_id to decide join strategy
  const colRes = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'doacoes' AND column_name = 'necessidade_id'`);
  const hasNecessidadeId = colRes.rows.length > 0;

  if (hasNecessidadeId) {
    const result = await pool.query(
        `SELECT d.id, d.doador_nome, d.quantidade_doada, d.data_doacao, n.item AS item_nome
         FROM doacoes d
         JOIN necessidades n ON d.necessidade_id = n.id
         WHERE d.abrigo_id = $1
         ORDER BY d.data_doacao DESC`,
      [id]
    );
    return res.json({ success: true, doacoes: result.rows });
  } else {
    // Legacy schema: doacoes stores item and quantidade directly
    const result = await pool.query(
      `SELECT id, doador_nome, quantidade as quantidade_doada, data_doacao, item as item_nome
       FROM doacoes
       WHERE abrigo_id = $1
       ORDER BY data_doacao DESC`,
      [id]
    );
    return res.json({ success: true, doacoes: result.rows });
  }
    } catch (error) {
  handleError(res, error, 'Failed to fetch shelter donations');
    }
});

// Geocode endpoint (proxy to Nominatim) - to avoid CORS and provide a stable User-Agent/contact
app.get('/api/geocode', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.toString().trim()) return badRequest(res, 'Query param "q" is required');

    const contact = process.env.GEOCODE_CONTACT_EMAIL || 'dev@local';
    const defaultCity = process.env.DEFAULT_CITY || 'Porto Alegre';
    const defaultState = process.env.DEFAULT_STATE || 'RS';

    // Prepare query variations to improve matching for partial addresses
    const rawQ = q.toString().trim();
    const queries = [
      rawQ,
      `${rawQ}, ${defaultCity}`,
      `${rawQ}, ${defaultCity}, ${defaultState}`,
      `${rawQ} ${defaultCity} ${defaultState}`
    ];

    const fetchOptions = {
      headers: {
        'User-Agent': `Baita_Ajuda/1.0 (${contact})`,
        'Accept-Language': 'pt-BR'
      }
    };

    let lastError = null;
    for (const attemptQ of queries) {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=3&q=${encodeURIComponent(attemptQ)}&countrycodes=br`;
      try {
        console.log('[geocode] trying query:', attemptQ);
        const geoRes = await fetch(nominatimUrl, fetchOptions);
        console.log('[geocode] response status:', geoRes.status);
        if (!geoRes.ok) {
          lastError = `provider returned status ${geoRes.status}`;
          continue;
        }

        const geoJson = await geoRes.json();
        if (Array.isArray(geoJson) && geoJson.length > 0) {
          // prefer the best match (first), but ensure it has lat/lon
          const top = geoJson.find(r => r && r.lat && r.lon) || geoJson[0];
          const lat = top.lat ? parseFloat(top.lat) : null;
          const lon = top.lon ? parseFloat(top.lon) : null;
          if (lat !== null && lon !== null) {
            console.log('[geocode] success for query:', attemptQ, '->', lat, lon);
            return res.json({ success: true, lat, lon, raw: top });
          }
        } else {
          lastError = 'no results';
        }
      } catch (err) {
        console.error('[geocode] fetch error for query:', attemptQ, err.message);
        lastError = err.message;
      }
    }

    // If we get here, none of the queries returned coordinates
    console.warn('[geocode] all attempts failed, lastError=', lastError);
    return res.status(404).json({ success: false, error: 'No results from geocoding', detail: lastError });
  } catch (error) {
    handleError(res, error, 'Geocoding failed');
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
