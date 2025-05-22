import './Column.scss';
// import imgDesign from '../../assets/img-design.png';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Card from '../Card/Card';
import { mapOrder } from '../../utilities/sort';
import { Container, Draggable } from "react-smooth-dnd";
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Column = (props) => {
    const { column, onCardDrop } = props;
    const cards = mapOrder(column.cards, column.cardOrder, 'id');



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
                <header className="column-drag-handle">{column.name}</header>
                <div className="card-list">
                    <Container
                        groupName="col"
                        onDrop={(dropResult) => onCardDrop(dropResult, column.id)}
                        getChildPayload={index => cards[index]}
                        dragClass="card-ghost"
                        dropClass="card-ghost-drop"
                        dropPlaceholder={{                      
                        animationDuration: 150,
                        showOnTop: true,
                        className: 'card-drop-preview ' 
                        }}
                        dropPlaceholderAnimationDuration={200}
                        >
                            {cards && cards.length > 0 && cards.map((card, index) => {
                                return (
                                    <Draggable key={card.id}>
                                        <Card card={card} isFirstCard={index === 0} />
                                    </Draggable>
                                )
                            })}
                            {tasks.map(task => (
                                <Draggable key={task.id}>
                                    <div key={task.id} className="card-item">
                                        {task.task}
                                    </div>
                                </Draggable>
                            ))}
                        </Container>
                </div>
                <footer>
                    <div className='footer-action'>
                        <FontAwesomeIcon icon={faPlus} /> Add another card
                    </div>
                </footer>
            </div>

            {loading && <p className="text-center text-gray-600">Carregando tarefas...</p>}
            {error && <p className="text-center text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
        </>
    )
}

export default Column;