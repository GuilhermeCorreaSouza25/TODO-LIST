const express = require('express');
const router = express.Router();
const pool = require('../services/db'); 
const { v4: uuidv4 } = require('uuid');
const { sendEmail } = require('../services/emailService');
require('dotenv').config();

const USER_EMAIL = process.env.USER_EMAIL;

// ... (as rotas GET e DELETE permanecem iguais) ...

// Rota GET all cards
router.get('/', async (req, res) => {
    try {
        const [cards] = await pool.query('SELECT * FROM cards');
        res.json(cards);
    } catch (error) {
        console.error('Erro ao buscar todos os cards:', error);
        res.status(500).json({ message: 'Erro ao buscar cards', error: error.message });
    }
});

// Rota GET cards by column
router.get('/column/:columnId', async (req, res) => {
    const { columnId } = req.params;
    try {
        const [columns] = await pool.query('SELECT * FROM columns WHERE id = ?', [columnId]);
        if (columns.length === 0) {
            return res.status(404).json({ message: 'Coluna não encontrada' });
        }
        const [cards] = await pool.query('SELECT * FROM cards WHERE columnId = ?', [columnId]);
        res.json(cards);
    } catch (error) {
        console.error(`Erro ao buscar cards para a coluna ${columnId}:`, error);
        res.status(500).json({ message: 'Erro ao buscar cards da coluna', error: error.message, columnId });
    }
});


// POST a new card - (O seu código já estava correto)
router.post('/', async (req, res) => {
    // Adicionamos um log para depurar o que está sendo recebido
    console.log("Dados recebidos no backend (POST):", req.body);
    console.log('Backend recebeu para criar card:', req.body); 

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
                `Um novo card foi adicionado: "${title}"`
            );
        }

        res.status(201).json(newCard);
    } catch (error) {
        console.error('Erro ao adicionar card:', error);
        res.status(500).json({ message: 'Erro ao adicionar card', error: error.message });
    }
});

// PUT update a card (MÉTODO OTIMIZADO)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`DADOS RECEBIDOS NO BACKEND (PUT para o card ${req.params.id}):`, req.body);
    // Adicionamos um log para depurar o que está sendo recebido
    console.log(`Backend recebeu para atualizar o card ${id}:`, req.body);
    
    const { title, descricao, data_fim } = req.body;

    try {
        const [existingCard] = await pool.query('SELECT * FROM cards WHERE id = ?', [id]);
        if (existingCard.length === 0) {
            return res.status(404).json({ message: 'Card não encontrado' });
        }

        // Monta a query dinamicamente para atualizar apenas os campos fornecidos
        const updateFields = {};
        if (title !== undefined) updateFields.title = title;
        if (descricao !== undefined) updateFields.descricao = descricao;
        if (data_fim !== undefined) updateFields.data_fim = data_fim || null;

        if (Object.keys(updateFields).length === 0) {
            return res.json(existingCard[0]); // Nada para atualizar, retorna o card existente
        }

        const setClause = Object.keys(updateFields).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updateFields), id];

        await pool.query(`UPDATE cards SET ${setClause} WHERE id = ?`, values);

        const [rows] = await pool.query('SELECT * FROM cards WHERE id = ?', [id]);
        res.json(rows[0]);
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
                `O card "${deletedCard.title}" foi removido.`
            );
        }

        res.status(200).json({ message: 'Card removido com sucesso', card: deletedCard });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao remover card', error: error.message });
    }
});

module.exports = router;