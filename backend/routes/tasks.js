const express = require('express');
const router = express.Router();
const pool = require('../services/db');
const { v4: uuidv4 } = require('uuid');
const { sendEmail } = require('../services/emailService');
require('dotenv').config();

const USER_EMAIL = process.env.USER_EMAIL;

function toMySQLDateTime(dateString) {
  if (!dateString) return null;
  // Remove o 'Z' se existir e substitui 'T' por espaço
  return dateString.replace('T', ' ').replace('Z', '').split('.')[0];
}

// GET all cards
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cards');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar cards', error });
  }
});

// Listar cards de uma coluna
router.get('/column/:columnId', async (req, res) => {
  const { columnId } = req.params;
  try {
    const [cards] = await pool.query('SELECT * FROM cards WHERE columnId = ? ORDER BY createdAt', [columnId]);
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar card
router.post('/', async (req, res) => {
  const { boardId, columnId, title } = req.body;
  
  // Validação dos campos obrigatórios
  if (!boardId || !columnId || !title) {
    return res.status(400).json({ 
      error: 'Campos obrigatórios faltando',
      required: { boardId, columnId, title }
    });
  }

  const id = uuidv4();
  try {
    console.log('Criando card:', { id, boardId, columnId, title });
    
    // Iniciar uma transação
    await pool.query('START TRANSACTION');
    
    try {
      // Verificar se a coluna existe e buscar o cardOrder em uma única query
      const [columns] = await pool.query(
        'SELECT id, name, cardOrder FROM columns WHERE id = ?', 
        [columnId]
      );
      
      if (columns.length === 0) {
        throw new Error('Coluna não encontrada');
      }

      const column = columns[0];
      
      // Inserir o novo card
      await pool.query(
        'INSERT INTO cards (id, boardId, columnId, title) VALUES (?, ?, ?, ?)', 
        [id, boardId, columnId, title]
      );

      // Processar o cardOrder
      let cardOrder = [];
      if (column.cardOrder) {
        try {
          cardOrder = JSON.parse(column.cardOrder);
          if (!Array.isArray(cardOrder)) cardOrder = [];
        } catch (e) {
          console.warn('Erro ao fazer parse do cardOrder, inicializando como array vazio');
          cardOrder = [];
        }
      }
      
      // Adicionar o novo card ao cardOrder
      cardOrder.push(id);
      
      // Atualizar o cardOrder da coluna
      await pool.query(
        'UPDATE columns SET cardOrder = ? WHERE id = ?',
        [JSON.stringify(cardOrder), columnId]
      );

      // Buscar o card recém-criado
      const [cards] = await pool.query('SELECT * FROM cards WHERE id = ?', [id]);
      
      if (cards.length === 0) {
        throw new Error('Card não encontrado após criação');
      }

      // Commit da transação
      await pool.query('COMMIT');
      
      // Enviar email de notificação de forma assíncrona
      if (USER_EMAIL) {
        const columnName = column.name || 'Coluna';
        sendEmail(
          USER_EMAIL,
          'Novo Card Adicionado',
          `Um novo card foi adicionado à coluna "${columnName}"`,
          `
            <h2>Novo Card Adicionado</h2>
            <p>Um novo card foi adicionado ao seu quadro:</p>
            <ul>
              <li><strong>Título:</strong> ${title}</li>
              <li><strong>Coluna:</strong> ${columnName}</li>
              <li><strong>Data:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          `
        ).catch(err => console.error('Erro ao enviar email:', err));
      }
      
      res.status(201).json(cards[0]);
    } catch (err) {
      // Rollback em caso de erro
      await pool.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('Erro ao criar card:', err);
    res.status(500).json({ 
      error: 'Erro ao criar card',
      details: err.message 
    });
  }
});

// Editar card
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, completed, dueDate, columnId } = req.body;
  
  try {
    console.log('Atualizando card:', { id, title, columnId });
    
    // Construir a query dinamicamente baseada nos campos fornecidos
    let updateFields = [];
    let updateValues = [];
    
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    
    if (completed !== undefined) {
      updateFields.push('completed = ?');
      updateValues.push(completed);
    }
    
    if (dueDate !== undefined) {
      updateFields.push('dueDate = ?');
      updateValues.push(dueDate);
    }
    
    if (columnId !== undefined) {
      updateFields.push('columnId = ?');
      updateValues.push(columnId);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }
    
    // Adicionar o ID ao final dos valores
    updateValues.push(id);
    
    const query = `UPDATE cards SET ${updateFields.join(', ')} WHERE id = ?`;
    await pool.query(query, updateValues);
    
    // Buscar o card atualizado
    const [cards] = await pool.query('SELECT * FROM cards WHERE id = ?', [id]);
    
    if (cards.length === 0) {
      throw new Error('Card não encontrado após atualização');
    }
    
    res.json(cards[0]);
  } catch (err) {
    console.error('Erro ao atualizar card:', err);
    res.status(500).json({ 
      error: 'Erro ao atualizar card',
      details: err.message 
    });
  }
});

// Excluir card
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Buscar informações do card antes de excluir
    const [cards] = await pool.query('SELECT c.*, col.name as columnName FROM cards c JOIN columns col ON c.columnId = col.id WHERE c.id = ?', [id]);
    
    if (cards.length > 0) {
      const card = cards[0];
      
      // Excluir o card
      await pool.query('DELETE FROM cards WHERE id = ?', [id]);
      
      // Enviar email de notificação
      if (USER_EMAIL) {
        await sendEmail(
          USER_EMAIL,
          'Card Removido',
          `Um card foi removido da coluna "${card.columnName}"`,
          `
            <h2>Card Removido</h2>
            <p>Um card foi removido do seu quadro:</p>
            <ul>
              <li><strong>Título:</strong> ${card.title}</li>
              <li><strong>Coluna:</strong> ${card.columnName}</li>
              <li><strong>Data:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          `
        );
      }
    }

    res.status(204).end();
  } catch (err) {
    console.error('Erro ao excluir card:', err);
    res.status(500).json({ 
      error: 'Erro ao excluir card',
      details: err.message 
    });
  }
});

module.exports = { router };