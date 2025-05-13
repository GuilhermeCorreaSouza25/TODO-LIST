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

// GET all tasks
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tasks');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar tarefas', error });
  }
});

// POST a new task
router.post('/', async (req, res) => {
  const { text, dueDate } = req.body;
  if (!text) {
    return res.status(400).json({ message: 'Text is required' });
  }
  const id = uuidv4();
  const createdAt = new Date();
  try {
    await pool.query(
      'INSERT INTO tasks (id, text, completed, createdAt, dueDate) VALUES (?, ?, ?, ?, ?)',
      [id, text, false, createdAt, dueDate ? new Date(dueDate) : null]
    );
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    const newTask = rows[0];

    // Notificação por email - Adição de tarefa
    if (USER_EMAIL) {
      await sendEmail(
        USER_EMAIL,
        'Nova Tarefa Adicionada!',
        `Uma nova tarefa foi adicionada à sua lista: "${newTask.text}". Prazo: ${newTask.dueDate ? new Date(newTask.dueDate).toLocaleString() : 'N/A'}`,
        `<p>Uma nova tarefa foi adicionada à sua lista: <strong>"${newTask.text}"</strong>.</p><p>Prazo: ${newTask.dueDate ? new Date(newTask.dueDate).toLocaleString() : 'N/A'}</p>`
      );
    }

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar tarefa', error });
  }
});

// PUT update a task (nome, data/hora e/ou completed)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  let { text, dueDate, completed } = req.body;
  try {
    let sendCompletedEmail = false;
    // Buscar tarefa original para comparar completed
    const [originalRows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    const originalTask = originalRows[0];
    // Converter completed para 0 ou 1 se não for undefined
    if (completed !== undefined && completed !== null) {
      completed = completed ? 1 : 0;
      if (originalTask && !originalTask.completed && completed === 1) {
        sendCompletedEmail = true;
      }
    } else {
      completed = null;
    }
    // Converter data para formato MySQL
    if (dueDate) {
      dueDate = toMySQLDateTime(dueDate);
    }
    const [result] = await pool.query(
      'UPDATE tasks SET text = COALESCE(?, text), dueDate = COALESCE(?, dueDate), completed = COALESCE(?, completed) WHERE id = ?',
      [text, dueDate !== undefined ? dueDate : null, completed, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    const updatedTask = rows[0];
    // Enviar email se a tarefa foi concluída
    if (sendCompletedEmail && USER_EMAIL) {
      await sendEmail(
        USER_EMAIL,
        'Tarefa Concluída',
        `A tarefa "${updatedTask.text}" foi marcada como concluída!`,
        `<p>A tarefa <strong>"${updatedTask.text}"</strong> foi marcada como concluída!</p>`
      );
    }
    res.json(updatedTask);
  } catch (error) {
    console.error('Erro ao editar tarefa:', error); // Log detalhado
    res.status(500).json({ message: 'Erro ao editar tarefa', error });
  }
});

// DELETE a task
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    const deletedTask = rows[0];
    await pool.query('DELETE FROM tasks WHERE id = ?', [id]);

    // Notificação por email - Remoção de tarefa
    if (USER_EMAIL) {
      await sendEmail(
        USER_EMAIL,
        'Tarefa Removida',
        `A tarefa "${deletedTask.text}" foi removida da sua lista.`,
        `<p>A tarefa "<strong>${deletedTask.text}</strong>" foi removida da sua lista.</p>`
      );
    }
    res.status(200).json({ message: 'Task deleted successfully', task: deletedTask });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar tarefa', error });
  }
});

module.exports = { router };