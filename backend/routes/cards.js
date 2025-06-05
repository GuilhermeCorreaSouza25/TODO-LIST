const express = require('express');
const router = express.Router();
const pool = require('../services/db'); 
const { v4: uuidv4 } = require('uuid');
const { sendEmail } = require('../services/emailService');
require('dotenv').config();

const USER_EMAIL = process.env.USER_EMAIL;

// GET all cards
router.get('/', async (req, res) => {
  try {
    const [cards] = await pool.query('SELECT * FROM cards');
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar cards', error });
  }
});

// POST a new card
router.post('/', async (req, res) => {
  const { boardId, columnId, title, descricao, data_fim } = req.body;
  if (!boardId || !columnId || !title) {
    return res.status(400).json({ message: 'boardId, columnId e title são obrigatórios' });
  }
  const id = uuidv4();
  const createdAt = new Date();
  try {
    await pool.query(
      'INSERT INTO cards (id, boardId, columnId, title, descricao, data_fim, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, boardId, columnId, title, descricao || null, data_fim || null, createdAt]
    );
    const [rows] = await pool.query('SELECT * FROM cards WHERE id = ?', [id]);
    const newCard = rows[0];

    // Atualizar cardOrder da coluna
    const [columnRows] = await pool.query('SELECT * FROM columns WHERE id = ?', [columnId]);
    const column = columnRows[0];
    const cardOrder = column.cardOrder ? JSON.parse(column.cardOrder) : [];
    cardOrder.push(id);
    await pool.query('UPDATE columns SET cardOrder = ? WHERE id = ?', [JSON.stringify(cardOrder), columnId]);

    if (USER_EMAIL) {
      await sendEmail(
        USER_EMAIL,
        'Novo Card Adicionado!',
        `Um novo card foi adicionado: "${title}"`,
        `<p>Um novo card foi adicionado: <strong>"${title}"</strong></p>`
      );
    }

    res.status(201).json(newCard);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar card', error });
  }
});

// PUT update a card
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, descricao, data_fim, completed, columnId, boardId } = req.body;
  try {
    // Primeiro, vamos verificar se o card existe
    const [existingCard] = await pool.query('SELECT * FROM cards WHERE id = ?', [id]);
    if (existingCard.length === 0) {
      return res.status(404).json({ message: 'Card não encontrado' });
    }

    // Atualizar apenas o título
    const [result] = await pool.query(
      'UPDATE cards SET title = ? WHERE id = ?',
      [title, id]
    );

    const [rows] = await pool.query('SELECT * FROM cards WHERE id = ?', [id]);
    const updatedCard = rows[0];
    res.json(updatedCard);
  } catch (error) {
    console.error('Erro ao atualizar card:', error);
    res.status(500).json({ message: 'Erro ao atualizar card', error: error.message });
  }
});

// DELETE a card
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM cards WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Card não encontrado' });
    }
    const deletedCard = rows[0];
    await pool.query('DELETE FROM cards WHERE id = ?', [id]);

    // Atualizar cardOrder da coluna
    const [columnRows] = await pool.query('SELECT * FROM columns WHERE id = ?', [deletedCard.columnId]);
    const column = columnRows[0];
    const cardOrder = column.cardOrder ? JSON.parse(column.cardOrder) : [];
    const newCardOrder = cardOrder.filter(cardId => cardId !== id);
    await pool.query('UPDATE columns SET cardOrder = ? WHERE id = ?', [JSON.stringify(newCardOrder), deletedCard.columnId]);

    if (USER_EMAIL) {
      await sendEmail(
        USER_EMAIL,
        'Card Removido',
        `O card "${deletedCard.title}" foi removido.`,
        `<p>O card "<strong>${deletedCard.title}</strong>" foi removido.</p>`
      );
    }

    res.status(200).json({ message: 'Card removido com sucesso', card: deletedCard });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover card', error });
  }
});

  module.exports = router ; 