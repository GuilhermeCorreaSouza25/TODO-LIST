const express = require('express');
const router = express.Router();
const pool = require('../services/db');
const { v4: uuidv4 } = require('uuid');
const { sendEmail } = require('../services/emailService');
require('dotenv').config();

const USER_EMAIL = process.env.USER_EMAIL;

// Listar colunas de um board
router.get('/board/:boardId', async (req, res) => {
  const { boardId } = req.params;
  try {
    const [columns] = await pool.query('SELECT * FROM columns WHERE boardId = ?', [boardId]);
    res.json(columns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar coluna
router.post('/', async (req, res) => {
  const { boardId, name, cardOrder } = req.body;
  const id = uuidv4();
  try {
    console.log('Criando coluna:', { id, boardId, name, cardOrder });

    // Verificar se o board existe
    const [boards] = await pool.query('SELECT * FROM boards WHERE id = ?', [boardId]);
    if (boards.length === 0) {
      throw new Error(`Board com ID ${boardId} não encontrado`);
    }

    // Converter o cardOrder para JSON string antes de salvar
    const cardOrderJson = cardOrder ? JSON.stringify(cardOrder) : '[]';
    
    // Iniciar uma transação
    await pool.query('START TRANSACTION');
    
    try {
      // Inserir a coluna
      const [result] = await pool.query(
        'INSERT INTO columns (id, boardId, name, cardOrder) VALUES (?, ?, ?, ?)', 
        [id, boardId, name, cardOrderJson]
      );
      
      console.log('Coluna criada com sucesso:', result);

      // Buscar a coluna recém-criada para confirmar
      const [columns] = await pool.query('SELECT * FROM columns WHERE id = ?', [id]);
      if (columns.length === 0) {
        throw new Error('Coluna não encontrada após criação');
      }

      // Enviar email de notificação
      if (USER_EMAIL) {
        const boardName = boards[0]?.id || 'Quadro';
        
        await sendEmail(
          USER_EMAIL,
          'Nova Coluna Adicionada',
          `Uma nova coluna foi adicionada ao quadro`,
          `
            <h2>Nova Coluna Adicionada</h2>
            <p>Uma nova coluna foi adicionada ao seu quadro:</p>
            <ul>
              <li><strong>Nome:</strong> ${name}</li>
              <li><strong>Quadro:</strong> ${boardName}</li>
              <li><strong>Data:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          `
        );
      }

      // Commit da transação
      await pool.query('COMMIT');
      
      // Retornar a coluna criada com o cardOrder como array
      res.status(201).json({ 
        id, 
        boardId, 
        name, 
        cardOrder: cardOrder || [] 
      });
    } catch (err) {
      // Rollback em caso de erro
      await pool.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('Erro ao criar coluna:', err);
    res.status(500).json({ 
      error: 'Erro ao criar coluna',
      details: err.message 
    });
  }
});

// Editar coluna
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, cardOrder } = req.body;
  
  try {
    console.log('Atualizando coluna:', { id, name, cardOrder });
    
    if (name) {
      await pool.query('UPDATE columns SET name = ? WHERE id = ?', [name, id]);
    }
    
    if (cardOrder) {
      // Converter o array para JSON string antes de salvar
      const cardOrderJson = JSON.stringify(cardOrder);
      await pool.query('UPDATE columns SET cardOrder = ? WHERE id = ?', [cardOrderJson, id]);
    }

    // Buscar a coluna atualizada
    const [columns] = await pool.query('SELECT * FROM columns WHERE id = ?', [id]);
    
    if (columns.length === 0) {
      throw new Error('Coluna não encontrada após atualização');
    }

    // Converter o cardOrder de volta para array
    const updatedColumn = {
      ...columns[0],
      cardOrder: columns[0].cardOrder ? JSON.parse(columns[0].cardOrder) : []
    };

    res.json(updatedColumn);
  } catch (err) {
    console.error('Erro ao atualizar coluna:', err);
    res.status(500).json({ 
      error: 'Erro ao atualizar coluna',
      details: err.message 
    });
  }
});

// Excluir coluna
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Buscar informações da coluna antes de excluir
    const [columns] = await pool.query('SELECT c.*, b.id as boardId FROM columns c JOIN boards b ON c.boardId = b.id WHERE c.id = ?', [id]);
    
    if (columns.length > 0) {
      const column = columns[0];
      
      // Excluir a coluna
      await pool.query('DELETE FROM columns WHERE id = ?', [id]);
      
      // Enviar email de notificação
      if (USER_EMAIL) {
        await sendEmail(
          USER_EMAIL,
          'Coluna Removida',
          `A coluna "${column.name}" foi removida`,
          `
            <h2>Coluna Removida</h2>
            <p>Uma coluna foi removida do seu quadro:</p>
            <ul>
              <li><strong>Nome:</strong> ${column.name}</li>
              <li><strong>Quadro:</strong> ${column.boardId}</li>
              <li><strong>Data:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          `
        );
      }
    }

    res.status(204).end();
  } catch (err) {
    console.error('Erro ao excluir coluna:', err);
    res.status(500).json({ 
      error: 'Erro ao excluir coluna',
      details: err.message 
    });
  }
});

// Limpar coluna (apagar todos os cards da coluna)
router.delete('/:id/clear', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM cards WHERE columnId = ?', [id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports =  router; 