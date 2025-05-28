CREATE DATABASE IF NOT EXISTS tasks;
use tasks;

-- Tabela de boards
CREATE TABLE boards (
    id VARCHAR(36) PRIMARY KEY,
    columnOrder TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de colunas
CREATE TABLE columns (
    id VARCHAR(36) PRIMARY KEY,
    boardId VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    cardOrder TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (boardId) REFERENCES boards(id) ON DELETE CASCADE
);

-- Tabela de cards
CREATE TABLE cards (
    id VARCHAR(36) PRIMARY KEY,
    boardId VARCHAR(36) NOT NULL,
    columnId VARCHAR(36) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    dueDate DATETIME,
    notified BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (boardId) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (columnId) REFERENCES columns(id) ON DELETE CASCADE
);

-- Índices para melhorar a performance
CREATE INDEX idx_cards_board_id ON cards(boardId);
CREATE INDEX idx_cards_column_id ON cards(columnId);
CREATE INDEX idx_columns_board_id ON columns(boardId);
CREATE INDEX idx_cards_due_date ON cards(dueDate);
CREATE INDEX idx_cards_completed ON cards(completed);
