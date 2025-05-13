const cron = require('node-cron');
const { sendEmail } = require('./emailService');
const pool = require('./db');
require('dotenv').config();

const USER_EMAIL = process.env.USER_EMAIL;

// Verifica tarefas próximas a cada minuto
const scheduleUpcomingTaskReminders = () => {
  cron.schedule('* * * * *', async () => { // Executa a cada minuto
    console.log('Verificando tarefas próximas...');
    try {
      const [tasks] = await pool.query('SELECT * FROM tasks');
      const now = new Date();
      for (const task of tasks) {
        if (!task.completed && task.dueDate) {
          const dueDate = new Date(task.dueDate);
          const timeDifference = dueDate.getTime() - now.getTime();
          const oneHour = 60 * 60 * 1000;

          // Se a tarefa vence em 1 hora ou menos e ainda não passou
          if (timeDifference > 0 && timeDifference <= oneHour) {
            // Aqui, idealmente, você deveria ter uma flag no banco para evitar múltiplas notificações
            // Exemplo: UPDATE tasks SET notifiedUpcoming = 1 WHERE id = ?
            if (USER_EMAIL) {
              await sendEmail(
                USER_EMAIL,
                `Lembrete: Tarefa Próxima - "${task.text}"`,
                `A tarefa "${task.text}" está programada para ${new Date(task.dueDate).toLocaleString()}. Menos de uma hora restante!`,
                `<p>Lembrete!</p><p>A tarefa "<strong>${task.text}</strong>" está programada para <strong>${new Date(task.dueDate).toLocaleString()}</strong>.</p><p>Menos de uma hora restante!</p>`
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar tarefas para notificação:', error);
    }
  });
  console.log('Agendador de lembretes de tarefas próximas iniciado.');
};

module.exports = { scheduleUpcomingTaskReminders };
// module.exports = { scheduleUpcomingTaskReminders };