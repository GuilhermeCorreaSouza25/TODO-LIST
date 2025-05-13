# Aplicação To-Do List Completa

Esta é uma aplicação To-Do List completa construída com React, Tailwind CSS, Node.js (Express) e Docker.
Ela inclui funcionalidades como criação, remoção e atualização de tarefas, além de notificações por email para lembretes e confirmações.

## Funcionalidades

- Criar, visualizar, atualizar (marcar como concluída) e excluir tarefas.
- Definir prazos para tarefas.
- Notificações por email:
    - Confirmação de adição de nova tarefa.
    - Confirmação de remoção de tarefa.
    - Aviso de mudança na tarefa (nome ou data/hora).
    <!-- - Aviso de tarefa próxima (prazo de uma hora ou menor). -->
- Interface responsiva utilizando Tailwind CSS.
- Backend robusto com Node.js e Express.
- Aplicação containerizada com Docker para fácil deployment.

## Tech Stack

**Frontend:**
- React
- Tailwind CSS
- Axios (para chamadas HTTP)

**Backend:**
- Node.js
- Express.js
- `nodemailer` (para envio de emails)
- `node-cron` (para agendamento de tarefas)
- `uuid` (para gerar IDs únicos para tarefas)

**Banco de Dados (Exemplo):**
- Em memória (para simplificação). Em um ambiente de produção, considere usar PostgreSQL, MongoDB, etc.

**DevOps:**
- Docker
- Docker Compose

## Pré-requisitos

- Node.js (v18 ou superior recomendado)
- npm ou yarn
- Docker
- Docker Compose
- Uma conta de email configurada para envio via SMTP (ex: Gmail com senha de app, SendGrid, Mailgun).

## Configuração e Instalação

### Variáveis de Ambiente

Crie os seguintes arquivos `.env` e preencha com suas credenciais:

1.  **`backend/.env`**:
    ```
    PORT=3001
    USER_EMAIL=seu_email_de_destino@exemplo.com # Email do usuário para receber notificações

    # Configurações do Nodemailer (exemplo para Gmail)
    EMAIL_HOST=smtp.gmail.com
    EMAIL_PORT=587 # ou 465 para SSL
    EMAIL_SECURE=false # true para porta 465, false para outras
    EMAIL_USER=seu_email_de_envio@gmail.com
    EMAIL_PASS=sua_senha_de_app_do_gmail
    EMAIL_FROM="To-Do App" <seu_email_de_envio@gmail.com>
    ```

2.  **`frontend/.env`**:
    ```
    REACT_APP_API_URL=http://localhost:3001/api
    ```

### Desenvolvimento Local

1.  **Clone o repositório:**
    ```bash
    git clone <url_do_repositorio>
    cd todo-list-app
    ```

2.  **Backend:**
    ```bash
    cd backend
    npm install
    npm run dev # Ou npm start
    ```
    O backend estará rodando em `http://localhost:3001`.

3.  **Frontend:**
    ```bash
    cd frontend
    npm install
    npm start
    ```
    O frontend estará rodando em `http://localhost:3000`.

### Usando Docker

1.  **Construa e execute os containers:**
    ```bash
    docker-compose up --build
    ```
    A aplicação estará acessível em `http://localhost:3000` (frontend) e o backend em `http://localhost:3001`.

2.  **Para parar os containers:**
    ```bash
    docker-compose down
    ```

## Endpoints da API (Backend)

- `GET /api/tasks`: Lista todas as tarefas.
- `POST /api/tasks`: Cria uma nova tarefa.
    - Corpo: `{ "text": "Descrição da tarefa", "dueDate": "YYYY-MM-DDTHH:mm" }`
- `PUT /api/tasks/:id`: Atualiza uma tarefa (ex: marcar como concluída).
    - Corpo: `{ "completed": true }`
- `DELETE /api/tasks/:id`: Remove uma tarefa.

## Lembretes e Notificações

- **Lembrete de Adição de Nova Tarefa:** Um email é enviado ao `USER_EMAIL` quando uma nova tarefa é criada.
- **Remoção de Tarefa:** Um email é enviado ao `USER_EMAIL` quando uma tarefa é removida.
- **Aviso de Tarefa Próxima:** O sistema verifica a cada minuto se há tarefas com prazo dentro da próxima hora e envia um email de aviso ao `USER_EMAIL`.
