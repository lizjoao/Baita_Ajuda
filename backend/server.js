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
  port: 5433,
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

// Utility functions
const validateFields = (data, required) => {
  const missing = required.filter(field => !data[field]?.trim());
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
    
    // Validate input
    const validation = validateFields(req.body, ['nome', 'email', 'senha']);
    if (validation) return badRequest(res, validation);
    
    if (senha.length < 6) {
      return badRequest(res, 'Password must be at least 6 characters');
    }

    // Check existing email
    const emailExists = await pool.query(
      'SELECT id FROM Usuarios WHERE email = $1', 
      [email.toLowerCase()]
    );
    
    if (emailExists.rows.length > 0) {
      return badRequest(res, 'Email already in use');
    }
    
    // Create user
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
    
    // Validate input
    const validation = validateFields(req.body, ['email', 'senha']);
    if (validation) return badRequest(res, validation);
    
    // Find user
    const result = await pool.query(
      'SELECT * FROM Usuarios WHERE email = $1', 
      [email.toLowerCase().trim()]
    );
    
    if (result.rows.length === 0) {
      return unauthorized(res);
    }
    
    // Verify password
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

app.post('/api/abrigos', async (req, res) => {
  try {
    const { nome, endereco, tipo_abrigo, vagas_disponiveis } = req.body;
    
    // Validate input
    const validation = validateFields(req.body, ['nome', 'endereco']);
    if (validation) return badRequest(res, validation);
    
    // Validate shelter type
    const validTypes = ['Familiar', 'Feminino', 'Masculino', 'Pets'];
    if (tipo_abrigo && !validTypes.includes(tipo_abrigo)) {
      return badRequest(res, `Invalid type. Options: ${validTypes.join(', ')}`);
    }
    
    // Validate spots
    const spots = parseInt(vagas_disponiveis) || 0;
    if (spots < 0) {
      return badRequest(res, 'Spots cannot be negative');
    }
    
    // Create shelter
    const result = await pool.query(
      'INSERT INTO Abrigos (usuario_id, nome, endereco, tipo_abrigo, vagas_disponiveis) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [1, nome.trim(), endereco.trim(), tipo_abrigo || null, spots]
    );
    
    console.log('Shelter created:', result.rows[0].nome);
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
    const result = await pool.query(`
      SELECT a.*, u.nome as responsavel_nome 
      FROM Abrigos a 
      JOIN Usuarios u ON a.usuario_id = u.id 
      WHERE a.ativo = true 
      ORDER BY a.data_criacao DESC
    `);
    
    res.json({ success: true, abrigos: result.rows });
    
  } catch (error) {
    handleError(res, error, 'Shelters listing failed');
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