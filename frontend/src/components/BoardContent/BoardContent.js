import './BoardContent.scss'
import Column from '../Column/Column';
import { useState, useEffect, useRef } from 'react';
import _ from 'lodash';
import { mapOrder } from '../../utilities/sort';
import { Container, Draggable } from "react-smooth-dnd";
import { applyDrag } from '../../utilities/dragDrop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose, faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';

const BoardContent = () => {
    const [board, setBoard] = useState({});
    const [columns, setColumns] = useState([]);
    const [isShowAddList, setIsShowAddList] = useState(false);
    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const inputRef = useRef(null);
    const [valueInput, setValueInput] = useState('');
    const apiUrl = process.env.REACT_APP_API_URL;
    const BOARD_ID = 'board-1';
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if(isShowAddList === true && inputRef && inputRef.current){
            inputRef.current.focus();
        }
    },[isShowAddList]);

    useEffect(() => {
        const fetchBoard = async () => {
            try {
                // Primeiro, tenta buscar o board
                let boardResponse;
                try {
                    boardResponse = await axios.get(`${apiUrl}/boards/${BOARD_ID}`);
                } catch (error) {
                    // Se o board não existir, cria um novo
                    if (error.response && error.response.status === 404) {
                        boardResponse = await axios.post(`${apiUrl}/boards`, {
                            id: BOARD_ID,
                            columnOrder: []
                        });
                    } else {
                        throw error;
                    }
                }

                // Busca as colunas
                const columnsResponse = await axios.get(`${apiUrl}/columns`);
                const columns = columnsResponse.data;
                
                setBoard(boardResponse.data);
                setColumns(columns);
            } catch (error) {
                console.error('Erro ao carregar dados do quadro:', error);
                alert('Erro ao carregar dados do quadro. Verifique se o backend está rodando e se o banco de dados está configurado corretamente.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBoard();
    }, [apiUrl]);

    const onColumnDrop = async (dropResult) => {
        let newColumns = [...columns];
        newColumns = applyDrag(newColumns, dropResult);

        let newBoard = {...board};
        newBoard.columnOrder = newColumns.map(c => c.id);
        newBoard.columns = newColumns;

        setColumns(newColumns);
        setBoard(newBoard);

        // Atualizar ordem no backend
        try {
            await axios.put(`${apiUrl}/boards/${board.id}`, {
                columnOrder: newBoard.columnOrder
            });
        } catch (error) {
            console.error('Erro ao atualizar ordem das colunas:', error);
        }
    }

    const onCardDrop = async (dropResult, columnId) => {
        if(dropResult.removedIndex === null && dropResult.addedIndex === null) return;
        
        let newColumns = [...columns];
        let currentColumn = newColumns.find(column => column.id === columnId);
        currentColumn.cards = applyDrag(currentColumn.cards, dropResult);
        currentColumn.cardOrder = currentColumn.cards.map(card => card.id);
        
        setColumns(newColumns);

        // Atualizar ordem no backend
        try {
            await axios.put(`${apiUrl}/columns/${columnId}`, {
                cardOrder: currentColumn.cardOrder
            });
        } catch (error) {
            console.error('Erro ao atualizar ordem dos cards:', error);
        }
    }

    const handleAddList = async () => {
        if(!valueInput){
            if(inputRef && inputRef.current)
                inputRef.current.focus();
            return;
        }

        setIsAddingColumn(true);
        try {
            const response = await axios.post(`${apiUrl}/columns`, {
                boardId: board.id,
                name: valueInput
            });

            const newColumn = response.data;
            const _columns = _.cloneDeep(columns);
            _columns.push(newColumn);

            setColumns(_columns);
            setValueInput('');
            inputRef.current.focus();
            setIsShowAddList(false);
        } catch (error) {
            console.error('Erro ao adicionar coluna:', error);
            alert('Erro ao adicionar coluna');
        } finally {
            setIsAddingColumn(false);
        }
    }

    if(_.isEmpty(board)) {
        return (
            <>
                <div className='not-found'>Quadro não encontrado</div>
            </>
        )
    }

    const onUpdateColumn = (newColumn) => {
        const columnIdUpdate = newColumn.id;
        const ncols = [...columns];
        const columnIndex = ncols.findIndex(item => item.id === columnIdUpdate);
        if(newColumn._destroy) {
            ncols.splice(columnIndex, 1);
        } else {
            ncols[columnIndex] = newColumn;
        }
        setColumns(ncols);
    }

    const handleAddColumn = async () => {
        setIsAddingColumn(true);
        try {
            const response = await axios.post(`${apiUrl}/columns`, {
                boardId: board.id,
                name: 'Nova Coluna'
            });
            const newColumn = response.data;
            const _columns = _.cloneDeep(columns);
            _columns.push(newColumn);
            setColumns(_columns);
        } catch (error) {
            console.error('Erro ao adicionar coluna:', error);
        } finally {
            setIsAddingColumn(false);
        }
    };

    const handleDeleteColumn = async (columnId) => {
        try {
            await axios.delete(`${apiUrl}/columns/${columnId}`);
            setColumns(columns.filter(column => column.id !== columnId));
        } catch (error) {
            console.error('Erro ao deletar coluna:', error);
        }
    };

    const handleClearColumn = async (columnId) => {
        try {
            await axios.delete(`${apiUrl}/columns/${columnId}/cards`);
            setColumns(columns.map(column => {
                if (column.id === columnId) {
                    return { ...column, cards: [] };
                }
                return column;
            }));
        } catch (error) {
            console.error('Erro ao limpar coluna:', error);
        }
    };

    const handleUpdateColumnName = async (columnId, newName) => {
        try {
            await axios.put(`${apiUrl}/columns/${columnId}`, {
                title: newName
            });
            setColumns(columns.map(column => {
                if (column.id === columnId) {
                    return { ...column, title: newName };
                }
                return column;
            }));
        } catch (error) {
            console.error('Erro ao atualizar nome da coluna:', error);
        }
    };

    const handleAddCard = async (columnId, title) => {
        try {
            const response = await axios.post(`${apiUrl}/cards`, {
                title,
                columnId
            });
            const newCard = response.data;
            setColumns(columns.map(column => {
                if (column.id === columnId) {
                    return { ...column, cards: [...column.cards, newCard] };
                }
                return column;
            }));
        } catch (error) {
            console.error('Erro ao adicionar card:', error);
        }
    };

    const onDragEnd = async (result) => {
        const { destination, source, draggableId, type } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        if (type === 'column') {
            const newColumns = Array.from(columns);
            const [removed] = newColumns.splice(source.index, 1);
            newColumns.splice(destination.index, 0, removed);
            setColumns(newColumns);
            return;
        }

        const sourceColumn = columns.find(col => col.id === source.droppableId);
        const destColumn = columns.find(col => col.id === destination.droppableId);
        const sourceCards = Array.from(sourceColumn.cards);
        const destCards = source.droppableId === destination.droppableId
            ? sourceCards
            : Array.from(destColumn.cards);

        const [removed] = sourceCards.splice(source.index, 1);
        destCards.splice(destination.index, 0, removed);

        const newColumns = columns.map(col => {
            if (col.id === source.droppableId) {
                return { ...col, cards: sourceCards };
            }
            if (col.id === destination.droppableId) {
                return { ...col, cards: destCards };
            }
            return col;
        });

        setColumns(newColumns);

        try {
            await axios.put(`${apiUrl}/cards/${draggableId}/move`, {
                sourceColumnId: source.droppableId,
                destinationColumnId: destination.droppableId,
                sourceIndex: source.index,
                destinationIndex: destination.index,
            });
        } catch (error) {
            console.error('Erro ao mover card:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="board-content">
                <div className="loading">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>Carregando...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="board-content">
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="all-columns" direction="horizontal" type="column">
                    {(provided) => (
                        <div
                            className="board-columns"
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {columns.map((column, index) => (
                                <Column
                                    key={column.id}
                                    column={column}
                                    index={index}
                                    onAddCard={handleAddCard}
                                    onDeleteColumn={handleDeleteColumn}
                                    onClearColumn={handleClearColumn}
                                    onUpdateColumnName={handleUpdateColumnName}
                                    onUpdateColumn={onUpdateColumn}
                                />
                            ))}
                            {provided.placeholder}
                            <div className="add-column">
                                <button
                                    className="add-column-button"
                                    onClick={handleAddColumn}
                                    disabled={isAddingColumn}
                                    title="Adicionar nova coluna"
                                >
                                    {isAddingColumn ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin className="spinner" />
                                            <span>Adicionando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faPlus} />
                                            <span>Adicionar coluna</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
}

export default BoardContent;