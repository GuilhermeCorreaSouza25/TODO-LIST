import React from 'react';
import axios from 'axios';

const TaskItem = ({ task, onTaskUpdated, onTaskDeleted, onSelectTask, onToggleComplete }) => {
  const apiUrl = process.env.REACT_APP_API_URL;

  const handleToggleComplete = async () => {
    try {
      const updatedTask = { ...task, completed: !task.completed };
      const response = await axios.put(`${apiUrl}/tasks/${task.id}`, {
        text: updatedTask.text,
        dueDate: updatedTask.dueDate,
        completed: updatedTask.completed
      });
      onTaskUpdated(response.data);

    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      alert('Falha ao atualizar tarefa.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja remover a tarefa "${task.text}"?`)) {
      try {
        await axios.delete(`${apiUrl}/tasks/${task.id}`);
        onTaskDeleted(task.id);
      } catch (error) {
        console.error('Erro ao deletar tarefa:', error);
        alert('Falha ao deletar tarefa.');
      }
    }
  };

  return (
    <li className={`flex items-center justify-between p-4 mb-2 bg-white shadow rounded-lg ${task.completed ? 'opacity-60 line-through' : ''}`}>
      <div className="flex items-center">
        <div onClick={() => onSelectTask && onSelectTask(task)} style={{ cursor: 'pointer' }} className="flex-1">
          <span className={`text-lg ${task.completed ? 'text-gray-500' : 'text-gray-800'}`}>
            {task.text}
          </span>
          {task.dueDate && (
            <p className={`text-xs ${new Date(task.dueDate) < new Date() && !task.completed ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
              Prazo: {new Date(task.dueDate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggleComplete(task)}
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