# 🏠 Baita Ajuda

Sistema de localização e gerenciamento de abrigos para pessoas em situação de emergência.

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue?style=flat-square&logo=postgresql)

## 🎯 Funcionalidades

- 🗺️ Mapa interativo com abrigos disponíveis
- 🔍 Busca e filtros (tipo, localização, vagas)
- 📍 Ordenação por proximidade (geolocalização)
- ✏️ Sistema de gerenciamento de abrigos
- 🔐 Autenticação de usuários

## 🛠️ Tecnologias

**Frontend:** Next.js 14, React 18, Leaflet, CSS Modules  
**Backend:** Node.js, Express, PostgreSQL, bcrypt

## 📦 Pré-requisitos

- Node.js 18+
- PostgreSQL 15+
- npm ou yarn

## 🚀 Instalação

### 1. Clone e configure o banco

```bash
git clone https://github.com/seu-usuario/Baita_Ajuda.git
cd Baita_Ajuda

# PostgreSQL
psql -U postgres
CREATE DATABASE baita_ajuda;
\q

psql -U postgres -d baita_ajuda -f backend/init-db.sql
```

### 2. Instale dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configure variáveis de ambiente

Crie `backend/.env`:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=baita_ajuda
DB_PASSWORD=sua_senha
DB_PORT=5432
PORT=5000
```

## 🎮 Executar

```bash
# Backend (terminal 1)
cd backend
node server.js

# Frontend (terminal 2)
cd frontend
npm run dev
```

Acesse: `http://localhost:3000`

