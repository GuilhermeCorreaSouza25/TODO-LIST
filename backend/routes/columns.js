const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { sendEmail } = require('../services/emailService');
require('dotenv').config();

const USER_EMAIL = process.env.USER_EMAIL;

// GET all columns
router.get('/', async (req, res) => {
  try {
    const [columns] = await pool.query('SELECT * FROM columns');
    for (let column of columns) {
      const [cards] = await pool.query('SELECT * FROM cards WHERE columnId = ?', [column.id]);
      column.cards = cards;
      column.cardOrder = column.cardOrder ? JSON.parse(column.cardOrder) : [];
    }
    res.json(columns);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar colunas', error });
  }
});

// POST a new column
router.post('/', async (req, res) => {
  const { boardId, title } = req.body;
  if (!boardId || !title) {
    return res.status(400).json({ message: 'boardId e title são obrigatórios' });
  }
  const id = uuidv4();
  const createdAt = new Date();
  try {
    await pool.query(
      'INSERT INTO columns (id, boardId, title, cardOrder, createdAt) VALUES (?, ?, ?, ?, ?)',
      [id, boardId, title, JSON.stringify([]), createdAt]
    );
    const [rows] = await pool.query('SELECT * FROM columns WHERE id = ?', [id]);
    const newColumn = rows[0];

    // Atualizar columnOrder do board
    const [boardRows] = await pool.query('SELECT * FROM boards WHERE id = ?', [boardId]);
    const board = boardRows[0];
    const columnOrder = board.columnOrder ? JSON.parse(board.columnOrder) : [];
    columnOrder.push(id);
    await pool.query('UPDATE boards SET columnOrder = ? WHERE id = ?', [JSON.stringify(columnOrder), boardId]);

    if (USER_EMAIL) {
      await sendEmail(
        USER_EMAIL,
        'Nova Coluna Adicionada!',
        `Uma nova coluna foi adicionada ao seu quadro: "${title}"`,
        `<p>Uma nova coluna foi adicionada ao seu quadro: <strong>"${title}"</strong></p>`
      );
    }

    res.status(201).json(newColumn);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar coluna', error });
  }
});

// PUT update a column
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, cardOrder } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE columns SET title = COALESCE(?, title), cardOrder = COALESCE(?, cardOrder) WHERE id = ?',
      [title, cardOrder ? JSON.stringify(cardOrder) : null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Coluna não encontrada' });
    }
    const [rows] = await pool.query('SELECT * FROM columns WHERE id = ?', [id]);
    const updatedColumn = rows[0];
    const [cards] = await pool.query('SELECT * FROM cards WHERE columnId = ?', [id]);
    updatedColumn.cards = cards;
    updatedColumn.cardOrder = updatedColumn.cardOrder ? JSON.parse(updatedColumn.cardOrder) : [];
    res.json(updatedColumn);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar coluna', error });
  }
});

// DELETE a column
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM columns WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Coluna não encontrada' });
    }
    const deletedColumn = rows[0];
    await pool.query('DELETE FROM columns WHERE id = ?', [id]);

    // Atualizar columnOrder do board
    const [boardRows] = await pool.query('SELECT * FROM boards WHERE id = ?', [deletedColumn.boardId]);
    const board = boardRows[0];
    const columnOrder = board.columnOrder ? JSON.parse(board.columnOrder) : [];
    const newColumnOrder = columnOrder.filter(columnId => columnId !== id);
    await pool.query('UPDATE boards SET columnOrder = ? WHERE id = ?', [JSON.stringify(newColumnOrder), deletedColumn.boardId]);

    if (USER_EMAIL) {
      await sendEmail(
        USER_EMAIL,
        'Coluna Removida',
        `A coluna "${deletedColumn.title}" foi removida do seu quadro.`,
        `<p>A coluna "<strong>${deletedColumn.title}</strong>" foi removida do seu quadro.</p>`
      );
    }

    res.status(200).json({ message: 'Coluna removida com sucesso', column: deletedColumn });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover coluna', error });
  }
});

// Limpar coluna (remover todos os cards)
router.delete('/:id/clear', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM columns WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Coluna não encontrada' });
    }
    const column = rows[0];
    await pool.query('DELETE FROM cards WHERE columnId = ?', [id]);
    await pool.query('UPDATE columns SET cardOrder = ? WHERE id = ?', [JSON.stringify([]), id]);

    if (USER_EMAIL) {
      await sendEmail(
        USER_EMAIL,
        'Coluna Limpa',
        `Todos os cards da coluna "${column.title}" foram removidos.`,
        `<p>Todos os cards da coluna "<strong>${column.title}</strong>" foram removidos.</p>`
      );
    }

    res.status(200).json({ message: 'Coluna limpa com sucesso', column });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao limpar coluna', error });
  }
});

module.exports = router; 