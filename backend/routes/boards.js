const express = require('express');
const router = express.Router();
const pool = require('../services/db');
const { v4: uuidv4 } = require('uuid');

// Listar todos os boards
router.get('/', async (req, res) => {
  try {
    const [boards] = await pool.query('SELECT * FROM boards');
    // Converter a string JSON de columnOrder de volta para um array
    const formattedBoards = boards.map(board => ({
      ...board,
      columnOrder: board.columnOrder ? JSON.parse(board.columnOrder) : []
    }));
    res.json(formattedBoards);
  } catch (err) {
    console.error('Erro ao buscar boards:', err);
    res.status(500).json({ error: err.message });
  }
});

// Criar um novo board
router.post('/', async (req, res) => {
  const { columnOrder } = req.body;
  const id = uuidv4();
  try {
    await pool.query('INSERT INTO boards (id, columnOrder) VALUES (?, ?)', [id, columnOrder]);
    res.status(201).json({ id, columnOrder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar um board
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { columnOrder } = req.body;
  try {
    // Converter o array columnOrder para uma string JSON
    const columnOrderString = JSON.stringify(columnOrder);
    await pool.query('UPDATE boards SET columnOrder = ? WHERE id = ?', [columnOrderString, id]);
    res.json({ id, columnOrder });
  } catch (err) {
    console.error('Erro ao atualizar board:', err);
    res.status(500).json({ error: err.message });
  }
});

// Excluir um board
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM boards WHERE id = ?', [id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports =  router; 