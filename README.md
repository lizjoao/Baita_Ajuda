# Baita Ajuda

![Status do Projeto](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)

## 📖 Sobre o Projeto

O **Baita Ajuda** é um projeto acadêmico desenvolvido para a disciplina de **[Nome da Disciplina]** do curso de **[Nome do Curso]** da **[Nome da Universidade]**.

Trata-se de uma plataforma web criada para centralizar e facilitar o acesso a informações sobre abrigos durante situações de calamidade em Porto Alegre e região. O objetivo é conectar pessoas que precisam de ajuda a abrigos seguros, além de organizar as necessidades de cada local para direcionar doações de forma eficiente.

---

## ✨ Funcionalidades

-   👤 **Gestão de Contas:** Usuários podem se cadastrar para administrar um ou mais abrigos.
-   🔐 **Autenticação Segura:** Senhas são protegidas com hashing **Bcrypt**, garantindo a segurança dos dados.
-   🏠 **Cadastro Detalhado de Abrigos:** Informações completas como nome, endereço, tipo de abrigo (Familiar, Feminino, Masculino, Pets), e vagas disponíveis.
-   🗺️ **Busca por Proximidade:** Utilizando PostGIS, usuários podem encontrar os abrigos mais próximos de sua localização.
-   🔍 **Filtros Avançados:** Pesquise abrigos por nome, vagas disponíveis ou por itens de necessidade específicos.
-   📋 **Lista de Necessidades:** Cada abrigo pode manter uma lista atualizada de itens que precisa, otimizando o recebimento de doações.
-   ⭐ **Sistema de Avaliação:** Um sistema de notas permite a moderação e a garantia da qualidade dos locais listados.

---

## 🛠️ Tecnologias Utilizadas

-   **Backend**:
    -   **Node.js** com **Express.js** para a API RESTful.
    -   **PostgreSQL** como banco de dados relacional.
    -   **PostGIS** para funcionalidades geoespaciais.
    -   **Bcrypt.js** para hashing e segurança de senhas.
    -   **pg (node-postgres)** como driver de conexão com o banco de dados.

-   **Frontend**:
    -   _(A definir - Sugestão: **React.js** com **Vite**)._
    -   _(Sugestão: **Leaflet** ou **Mapbox** para os mapas)._

-   **Ambiente de Desenvolvimento**:
    -   **Docker** e **Docker Compose** para criar um ambiente de desenvolvimento padronizado.

---

## 🚀 Como Executar o Projeto

Siga os passos abaixo para configurar и rodar a aplicação localmente para avaliação.

### Pré-requisitos

-   [Git](https://git-scm.com/)
-   [Node.js](https://nodejs.org/en/) (versão 18 ou superior)
-   [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Passos

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/baita-ajuda.git](https://github.com/seu-usuario/baita-ajuda.git)
    cd baita-ajuda
    ```

2.  **Configure as Variáveis de Ambiente do Backend:**
    -   Navegue até a pasta `backend`.
    -   Copie o arquivo `.env.example` para um novo arquivo `.env`. O conteúdo padrão já está configurado para o Docker.
        ```bash
        # No Windows (PowerShell)
        copy backend\.env.example backend\.env
        ```

3.  **Inicie o Banco de Dados com Docker:**
    -   Na pasta raiz do projeto, execute o Docker Compose:
        ```bash
        docker-compose up -d
        ```

4.  **Crie a Estrutura do Banco de Dados:**
    -   Execute os scripts SQL para criar as tabelas e popular com dados de teste.
    -   **Schema:**
        ```bash
        docker exec -i abrigos_db psql -U docker -d abrigos < database/schema.sql
        ```
    -   **Dados Iniciais (Seeds):**
        ```bash
        docker exec -i abrigos_db psql -U docker -d abrigos < database/seeds/001_initial_data.sql
        ```

5.  **Inicie o Servidor Backend:**
    ```bash
    cd backend
    npm install
    npm run dev
    ```

6.  **Inicie a Aplicação Frontend:**
    ```bash
    cd ../frontend
    npm install
    npm run dev
    ```
