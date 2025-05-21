import './Column.scss';
// import imgDesign from '../../assets/img-design.png';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Task from '../Task/Task';

const Column = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchTasks = useCallback(async () => {
        try {
        setLoading(true);
        const response = await axios.get(`${apiUrl}/tasks`);
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
        setTasks([]);
        } finally {
        setLoading(false);
        }
    }, [apiUrl]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return (
        <>
            <div className="column">
                <header className="board-column">Brainstorm</header>
                <ul className="task-list">
                    <Task />

                    {tasks.map(task => (
                    <li key={task.id} className="task-item">
                        {task.task}
                    </li>
                    ))}


                    <li className="task-item">
                    first
                    </li>
                    <li className="task-item">
                    second
                    </li>
                    <li className="task-item">
                    third
                    </li>
                    <li className="task-item">
                    first
                    </li>
                    <li className="task-item">
                    second
                    </li>
                    <li className="task-item">
                    third
                    </li>
                    <li className="task-item">
                    first
                    </li>
                    <li className="task-item">
                    second
                    </li>
                    <li className="task-item">
                    third
                    </li>
                    <li className="task-item">
                    first
                    </li>
                    <li className="task-item">
                    second
                    </li>
                    <li className="task-item">
                    third
                    </li>
                    <li className="task-item">
                    first
                    </li>
                    <li className="task-item">
                    second
                    </li>
                    <li className="task-item">
                    third
                    </li>
                    <li className="task-item">
                    first
                    </li>
                    <li className="task-item">
                    second
                    </li>
                    <li className="task-item">
                    third
                    </li>
                    <li className="task-item">
                    first
                    </li>
                    <li className="task-item">
                    second
                    </li>
                    <li className="task-item">
                    third
                    </li>
                </ul>
                <footer>Add another card</footer>
            </div>

            {loading && <p className="text-center text-gray-600">Carregando tarefas...</p>}
            {error && <p className="text-center text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
        </>
    )
}

export default Column;