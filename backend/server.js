const express = require('express');
const cors = require('cors');
const boardRoutes = require('./routes/boards');
const columnRoutes = require('./routes/columns');
const cardRoutes = require('./routes/cards');
const notificationService = require('./services/notificationService');

const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/boards', boardRoutes);
app.use('/api/columns', columnRoutes);
app.use('/api/cards', cardRoutes);

// Iniciar o serviço de notificações
notificationService.checkUpcomingCards();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});