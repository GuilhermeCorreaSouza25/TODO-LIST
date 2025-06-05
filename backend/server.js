const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const { scheduleUpcomingTaskReminders } = require('./services/notificationService');
const boardRoutes = require('./routes/boards');
const columnRoutes = require('./routes/columns');
const cardRoutes = require('./routes/cards');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/cards', cardRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/columns', columnRoutes);

app.get('/', (req, res) => {
  res.send('Backend da To-Do List está rodando!');
});

scheduleUpcomingTaskReminders();

app.listen(PORT, () => {
  console.log(`Backend server rodando na porta ${PORT}`);
});
