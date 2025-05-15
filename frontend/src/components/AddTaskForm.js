import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddTaskForm = ({ onTaskAdded, onTaskUpdated, selectedTask, onCancelEdit }) => {
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (selectedTask) {
      setText(selectedTask.task || '');
      setDueDate(selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().slice(0, 16) : '');
    } else {
      setText('');
      setDueDate('');
    }
  }, [selectedTask]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      alert('A descrição da tarefa não pode estar vazia.');
      return;
    }
    try {
      if (selectedTask) {
        // Atualizar tarefa existente
        const updatedTask = { task: text, dueDate: dueDate || null };
        const response = await axios.put(`${apiUrl}/tasks/${selectedTask.id}`, updatedTask);
        onTaskUpdated(response.data);
      } else {
        // Adicionar nova tarefa
        const newTask = { task: text, dueDate: dueDate || null };
        const response = await axios.post(`${apiUrl}/tasks`, newTask);
        onTaskAdded(response.data);
      }
      setText('');
      setDueDate('');
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      alert('Falha ao salvar tarefa. Verifique o console para mais detalhes.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white shadow-md rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-grow">
          <label htmlFor="task-text" className="block text-sm font-medium text-gray-700 mb-1">
            {selectedTask ? 'Editar Tarefa' : 'Nova Tarefa'}
          </label>
          <input
            id="task-text"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="O que precisa ser feito?"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div className="flex-grow sm:flex-grow-0 sm:w-auto">
          <label htmlFor="task-due-date" className="block text-sm font-medium text-gray-700 mb-1">
            Prazo (Opcional)
          </label>
          <input
            id="task-due-date"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {selectedTask ? 'Atualizar Tarefa' : 'Adicionar Tarefa'}
          </button>
          {selectedTask && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default AddTaskForm;