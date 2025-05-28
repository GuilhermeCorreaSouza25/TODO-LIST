const pool = require('../config/database');
const { sendEmail } = require('./emailService');
require('dotenv').config();

const USER_EMAIL = process.env.USER_EMAIL;

const checkUpcomingCards = async () => {
    try {
        const [cards] = await pool.query(`
            SELECT c.*, col.name as columnName 
            FROM cards c
            JOIN columns col ON c.columnId = col.id
            WHERE c.dueDate IS NOT NULL 
            AND c.completed = FALSE 
            AND c.notified = FALSE
            AND c.dueDate BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 1 HOUR)
        `);

        for (const card of cards) {
            if (USER_EMAIL) {
                await sendEmail(
                    USER_EMAIL,
                    'Card com Prazo Próximo!',
                    `O card "${card.title}" na coluna "${card.columnName}" está próximo do prazo.`,
                    `<p>O card "<strong>${card.title}</strong>" na coluna "<strong>${card.columnName}</strong>" está próximo do prazo.</p>`
                );

                // Marcar como notificado
                await pool.query('UPDATE cards SET notified = TRUE WHERE id = ?', [card.id]);
            }
        }
    } catch (error) {
        console.error('Erro ao verificar cards com prazo próximo:', error);
    }
};

// Verificar a cada hora
setInterval(checkUpcomingCards, 60 * 60 * 1000);

// Verificar imediatamente ao iniciar
checkUpcomingCards();

module.exports = {
    checkUpcomingCards
};