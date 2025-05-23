import './Column.scss';
// import imgDesign from '../../assets/img-design.png';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Card from '../Card/Card';
import { mapOrder } from '../../utilities/sort';
import { Container, Draggable } from "react-smooth-dnd";
import { faPlus, faEllipsisH, faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Dropdown from 'react-bootstrap/Dropdown';
import ConfirmModal from '../Common/ConfirmModal';
import Form from 'react-bootstrap/Form';
import { MODAL_ACTION_CLOSE, MODAL_ACTION_CONFIRM } from '../../utilities/constant';
import { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

const Column = (props) => {
    const { column, onCardDrop, onUpdateColumn } = props;
    const cards = mapOrder(column.cards, column.cardOrder, 'id');

    const [isShowModalDelete, setShowModalDelete] = useState(false);
    const [nomeColumn, setNameColumn] = useState(column.name);
    const [isFirstClick, setIsFirstClick] = useState(true);
    const inputRef = useRef(null);
    const [isShowAddNewCard, setIsShowAddNewCard] = useState(false);
    const [valueTextArea, setValueTextArea] = useState('');
    const textAreaRef = useRef(null);
    

    // State to manage tasks
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const apiUrl = process.env.REACT_APP_API_URL;

    // Fetch tasks from the backend
    // using useCallback to memoize the function
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

    useEffect(() => {
        if(isShowAddNewCard && textAreaRef && textAreaRef.current) {
            textAreaRef.current.focus();
        }
    }, [isShowAddNewCard]);

    useEffect(() => {
        if(column && column.name) {
            setNameColumn(column.name);
        }
    },[column])

    const toggleModal = () => {
        setShowModalDelete(!isShowModalDelete);
    }

    const onModalAction = (type) => {
        if(type === MODAL_ACTION_CLOSE) {

        }
        if (type === MODAL_ACTION_CONFIRM) {
            const newColumn = {
                ...column,
                _destroy: true
            };
            onUpdateColumn(newColumn);
        }
        toggleModal();
    }

    const selectAllText = (event) => {
        setIsFirstClick(false);
        if (isFirstClick) {
            event.target.select();
        }else{
            inputRef.current.setSelectionRange(nomeColumn.length, nomeColumn.length);
        }
       
        
    }

    const handleClickOutside = () =>{
        setIsFirstClick(false);
        const newColumn = {
            ...column,
            name: nomeColumn,
            _destroy: false
        };
        onUpdateColumn(newColumn);
    }

    const handleAddNewCard = () => {
        if(!valueTextArea) {
            alert('Please enter a card name');
            return;
        }

        const newCard = {
            id: uuidv4(),
            boardId: column.boardId,
            columnId: column.id,
            title: valueTextArea,
            image: null
        };

        let newColumn = {...column};
        newColumn.cards = [...newColumn.cards, newCard];
        newColumn.cardOrder = newColumn.cards.map((card) => card.id);
        onUpdateColumn(newColumn);
        setValueTextArea('');
        setIsShowAddNewCard(false);
    }
    return (
        <>
            <div className="column">
                <header className="column-drag-handle">
                    <div className="column-name">
                        <Form.Control
                            size="sm"
                            type="text"
                            value= {nomeColumn}
                            className='customize-input-column'
                            onClick={selectAllText}
                            onChange={(event)=> setNameColumn(event.target.value)}
                            spellCheck="false"
                            onBlur={handleClickOutside}
                            onMouseDown={(event) => event.preventDefault()}
                            ref={inputRef}
                            
                        />
                        </div>
                    <div className="column-dropdown">
                        <Dropdown>
                            <Dropdown.Toggle 
                                variant="" 
                                id="dropdown-basic"
                                size='sm'
                            >
                                <FontAwesomeIcon icon={faEllipsisH} />
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => console.log('Editar coluna:', column.id)}>
                                    Editar coluna
                                </Dropdown.Item>
                                <Dropdown.Item onClick={toggleModal}>
                                    Excluir coluna
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => console.log('Limpar coluna:', column.id)}>
                                    Limpar coluna
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </header>
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
                    {isShowAddNewCard === true &&
                        <div className="add-new-card">
                            <textarea
                                rows={2}
                                className='form-control'
                                placeholder="Enter a name for this card..."
                                ref={textAreaRef}
                                value={valueTextArea}
                                onChange={(event) => setValueTextArea(event.target.value)}
                            ></textarea>
                            <div className="group-btn">
                                <button 
                                    className='btn btn-primary btn-sm'
                                    onClick={() => handleAddNewCard()}
                                >Add card</button>
                                <FontAwesomeIcon 
                                    icon={faClose}
                                    className='add-icon'
                                    onClick={() => setIsShowAddNewCard(false)}
                                />
                            </div>
                        </div>
                    }
                </div>
                {isShowAddNewCard === false &&
                    <footer>
                        <div 
                            className='footer-action' 
                            onClick={() => setIsShowAddNewCard(true)}
                        >
                            <FontAwesomeIcon 
                                icon={faPlus} 
                            /> 
                            Add another card
                        </div>
                    </footer>
                }
            </div>
            <ConfirmModal 
                show={isShowModalDelete}
                title={"Remove a column"}
                content={`Are you sure you want to remove the column: <b>${column.name}</b>?`}
                onAction={onModalAction}
            />
            {loading && <p className="text-center text-gray-600">Carregando tarefas...</p>}
            {error && <p className="text-center text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
        </>
    )
}

export default Column;