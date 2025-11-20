require("dotenv").config();
const { Pool } = require("pg");

console.log("=== TESTANDO CONEXÃO ===");
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "***" : "VAZIO");
console.log("DB_PORT:", process.env.DB_PORT);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
});

pool.connect()
  .then(client => {
    console.log("✅ CONEXÃO BEM-SUCEDIDA!");
    client.release();
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ ERRO:", err.message);
    process.exit(1);
  });
