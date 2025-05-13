const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const taskRoutes = require('./routes/tasks').router; // Acessa o router exportado
const { scheduleUpcomingTaskReminders } = require('./services/notificationService');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors()); // Permite requisições de diferentes origens (ex: frontend em localhost:3000)
app.use(express.json()); // Para parsear JSON no corpo das requisições

// Routes
app.use('/api/tasks', taskRoutes);

app.get('/', (req, res) => {
  res.send('Backend da To-Do List está rodando!');
});

// Iniciar o agendador de notificações
scheduleUpcomingTaskReminders();

app.listen(PORT, () => {
  console.log(`Backend server rodando na porta ${PORT}`);
});