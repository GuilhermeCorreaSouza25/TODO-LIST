# Banco de Dados MySQL

Crie o banco de dados e a tabela com o seguinte comando no phpMyAdmin ou no seu cliente MySQL:

```sql
CREATE DATABASE IF NOT EXISTS tasks;
USE tasks;

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(36) PRIMARY KEY,
  text VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  createdAt DATETIME NOT NULL,
  dueDate DATETIME NULL
);

CREATE TABLE IF NOT EXISTS columns (
  id VARCHAR(36) PRIMARY KEY,
  boardId VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  cardOrder TEXT,
  createdAt DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS cards (
  id VARCHAR(36) PRIMARY KEY,
  boardId VARCHAR(36) NOT NULL,
  columnId VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  image VARCHAR(255),
  createdAt DATETIME NOT NULL,
  FOREIGN KEY (columnId) REFERENCES columns(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS boards (
  id VARCHAR(36) PRIMARY KEY,
  columnOrder TEXT,
  createdAt DATETIME NOT NULL
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