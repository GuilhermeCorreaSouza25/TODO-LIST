import React from 'react';
import axios from 'axios';

const TaskItem = ({ card, onTaskUpdated, onTaskDeleted, onSelectTask, onToggleComplete }) => {
  const apiUrl = process.env.REACT_APP_API_URL;

  const handleToggleComplete = async () => {
    try {
      const updatedTask = { ...card, completed: !card.completed };
      const response = await axios.put(`${apiUrl}/cards/${card.id}`, {
        title: updatedTask.title,
        data_fim: updatedTask.data_fim,
        descricao: updatedTask.descricao,
        completed: updatedTask.completed
      });
      onTaskUpdated(response.data);
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      alert('Falha ao atualizar tarefa.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja remover a tarefa "${card.title}"?`)) {
      try {
        await axios.delete(`${apiUrl}/cards/${card.id}`);
        onTaskDeleted(card.id);
      } catch (error) {
        console.error('Erro ao deletar tarefa:', error);
        alert('Falha ao deletar tarefa.');
      }
    }
  };

  return (
    <li className={`flex items-center justify-between p-4 mb-2 bg-white shadow rounded-lg ${card.completed ? 'opacity-60 line-through' : ''}`}>
      <div className="flex items-center">
        <div onClick={() => onSelectTask && onSelectTask(card)} style={{ cursor: 'pointer' }} className="flex-1">
          <span className={`text-lg ${card.completed ? 'text-gray-500' : 'text-gray-800'}`}>
            {card.title}
          </span>
          {card.data_fim && (
            <p className={`text-xs ${new Date(card.data_fim) < new Date() && !card.completed ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
              Prazo: {new Date(card.data_fim).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          {card.descricao && (
            <p className="text-sm text-gray-600 mt-1">
              {card.descricao}
            </p>
          )}
        </div>
        <input
          type="checkbox"
          checked={card.completed}
          onChange={() => onToggleComplete(card)}
          className="ml-4 h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
      </div>
      <button
        onClick={handleDelete}
        className="ml-4 px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400"
      >
        Remover
      </button>
    </li>
  );
};

export default TaskItem;