import React from 'react';
import TaskItem from './TaskItem';
import axios from 'axios';

const TaskList = ({ tasks, onTaskUpdated, onTaskDeleted, onSelectTask }) => {
  const handleToggleComplete = async (card) => {
    const updatedTask = { ...card, completed: !card.completed };
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await axios.put(`${apiUrl}/tasks/${card.id}`, {
        card: updatedTask.card,
        dueDate: updatedTask.dueDate,
        completed: updatedTask.completed
      });
      onTaskUpdated(response.data);
    } catch (error) {
      alert('Erro ao atualizar tarefa.');
    }
  };

  const pendentes = tasks.filter(t => !t.completed);
  const concluidas = tasks.filter(t => t.completed);

  return (
    <>
      {pendentes.length === 0 && (
        <p className="text-center text-gray-500">Nenhuma tarefa pendente.</p>
      )}
      <ul className="space-y-3">
        {pendentes.map(card => (
          <TaskItem
            key={card.id}
            card={card}
            onTaskUpdated={onTaskUpdated}
            onTaskDeleted={onTaskDeleted}
            onSelectTask={onSelectTask}
            onToggleComplete={handleToggleComplete}
          />
        ))}
      </ul>
      {concluidas.length > 0 ? (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Tarefas Concluídas</h2>
          <ul className="space-y-3">
            {concluidas.map(card => (
              <TaskItem
                key={card.id}
                card={card}
                onTaskUpdated={onTaskUpdated}
                onTaskDeleted={onTaskDeleted}
                onSelectTask={onSelectTask}
                onToggleComplete={handleToggleComplete}
              />
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-center text-gray-400 mt-8">Nenhuma tarefa concluída.</p>
      )}
    </>
  );
};

export default TaskList;