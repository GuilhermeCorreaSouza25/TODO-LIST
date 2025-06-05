# Banco de Dados MySQL

Crie o banco de dados e a tabela com o seguinte comando no phpMyAdmin ou no seu cliente MySQL:

```sql
CREATE DATABASE IF NOT EXISTS tasks;
USE tasks;

CREATE TABLE IF NOT EXISTS cards (
  id VARCHAR(36) PRIMARY KEY,
  text VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  createdAt DATETIME NOT NULL,
  dueDate DATETIME NULL
);
```

Configure as variáveis de ambiente no arquivo `.env` conforme o exemplo:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=tasks
DB_PORT=3306
```
