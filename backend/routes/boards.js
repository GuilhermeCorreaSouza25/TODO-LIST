const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// GET all boards
router.get('/', async (req, res) => {
  console.log('GET /boards - Buscando todos os boards');
  try {
    const [boards] = await pool.query('SELECT * FROM boards');
    console.log('Boards encontrados:', boards);
    for (let board of boards) {
      board.columnOrder = board.columnOrder ? JSON.parse(board.columnOrder) : [];
    }
    res.json(boards);
  } catch (error) {
    console.error('Erro ao buscar boards:', error);
    res.status(500).json({ message: 'Erro ao buscar quadros', error: error.message });
  }
});

// GET a specific board
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`GET /boards/${id} - Buscando board específico`);
  try {
    const [rows] = await pool.query('SELECT * FROM boards WHERE id = ?', [id]);
    console.log('Board encontrado:', rows[0]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Quadro não encontrado' });
    }
    const board = rows[0];
    board.columnOrder = board.columnOrder ? JSON.parse(board.columnOrder) : [];
    res.json(board);
  } catch (error) {
    console.error(`Erro ao buscar board ${id}:`, error);
    res.status(500).json({ message: 'Erro ao buscar quadro', error: error.message });
  }
});

// POST a new board
router.post('/', async (req, res) => {
  console.log('POST /boards - Criando novo board:', req.body);
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'title é obrigatório' });
  }
  const id = uuidv4();
  const createdAt = new Date();
  try {
    await pool.query(
      'INSERT INTO boards (id, title, createdAt) VALUES (?, ?, ?)',
      [id, title, createdAt]
    );
    const [rows] = await pool.query('SELECT * FROM boards WHERE id = ?', [id]);
    const newBoard = rows[0];
    newBoard.columnOrder = newBoard.columnOrder ? JSON.parse(newBoard.columnOrder) : [];
    console.log('Board criado com sucesso:', newBoard);
    res.status(201).json(newBoard);
  } catch (error) {
    console.error('Erro ao criar board:', error);
    res.status(500).json({ message: 'Erro ao criar quadro', error: error.message });
  }
});

// PUT update a board
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`PUT /boards/${id} - Atualizando board:`, req.body);
  const { title } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE boards SET title = ? WHERE id = ?',
      [title, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Board não encontrado' });
    }
    const [rows] = await pool.query('SELECT * FROM boards WHERE id = ?', [id]);
    const updatedBoard = rows[0];
    updatedBoard.columnOrder = updatedBoard.columnOrder ? JSON.parse(updatedBoard.columnOrder) : [];
    console.log('Board atualizado com sucesso:', updatedBoard);
    res.json(updatedBoard);
  } catch (error) {
    console.error(`Erro ao atualizar board ${id}:`, error);
    res.status(500).json({ message: 'Erro ao atualizar quadro', error: error.message });
  }
});

// DELETE a board
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`DELETE /boards/${id} - Removendo board`);
  try {
    const [rows] = await pool.query('SELECT * FROM boards WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Board não encontrado' });
    }
    const deletedBoard = rows[0];
    await pool.query('DELETE FROM boards WHERE id = ?', [id]);
    console.log('Board removido com sucesso:', deletedBoard);
    res.status(200).json({ message: 'Board removido com sucesso', board: deletedBoard });
  } catch (error) {
    console.error(`Erro ao remover board ${id}:`, error);
    res.status(500).json({ message: 'Erro ao remover board', error: error.message });
  }
});

module.exports = router; 