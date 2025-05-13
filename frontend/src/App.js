import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AddTaskForm from './components/AddTaskForm';
import TaskList from './components/TaskList';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const apiUrl = process.env.REACT_APP_API_URL;

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/tasks`);
      // Ordenar tarefas: não concluídas primeiro, depois por data de criação (mais recentes primeiro)
      const sortedTasks = response.data.sort((a, b) => {
         if (a.completed !== b.completed) {
           return a.completed ? 1 : -1;
         }
         return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setTasks(sortedTasks);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar tarefas:", err);
      setError("Falha ao carregar tarefas. Verifique a conexão com o backend.");
      setTasks([]); // Limpa tarefas em caso de erro para não mostrar dados obsoletos
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskAdded = (newTask) => {
    setTasks(prevTasks => [newTask, ...prevTasks].sort((a, b) => { // Re-sort ao adicionar
         if (a.completed !== b.completed) {
           return a.completed ? 1 : -1;
         }
         return new Date(b.createdAt) - new Date(a.createdAt);
      }));
    setSelectedTask(null); // Limpa seleção após adicionar
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks(prevTasks =>
      prevTasks.map(task => (task.id === updatedTask.id ? updatedTask : task))
      .sort((a, b) => { // Re-sort ao atualizar
         if (a.completed !== b.completed) {
           return a.completed ? 1 : -1;
         }
         return new Date(b.createdAt) - new Date(a.createdAt);
      })
    );
    setSelectedTask(null); // Limpa seleção após atualizar
  };

  const handleTaskDeleted = (taskId) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    if (selectedTask && selectedTask.id === taskId) setSelectedTask(null); // Limpa seleção se deletar
  };

  const handleSelectTask = (task) => {
    setSelectedTask(task);
  };

  const handleCancelEdit = () => {
    setSelectedTask(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto max-w-2xl px-4">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-indigo-700">Minha Lista de Tarefas</h1>
        </header>

        <AddTaskForm
          onTaskAdded={handleTaskAdded}
          onTaskUpdated={handleTaskUpdated}
          selectedTask={selectedTask}
          onCancelEdit={handleCancelEdit}
        />

        {loading && <p className="text-center text-gray-600">Carregando tarefas...</p>}
        {error && <p className="text-center text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}

        {!loading && !error && (
          <TaskList
            tasks={tasks}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
            onSelectTask={handleSelectTask}
          />
        )}
      </div>
    </div>
  );
}

export default App;