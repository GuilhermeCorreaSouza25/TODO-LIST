import './BoardContent.scss'
import Column from '../Column/Column';
import { initData } from '../../actions/initData';
import { useState, useEffect, useRef } from 'react';
import _ from 'lodash';
import { mapOrder } from '../../utilities/sort';
import { Container, Draggable } from "react-smooth-dnd";
import { applyDrag } from '../../utilities/dragDrop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose, faPlus } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL;

const BoardContent = () => {

    const [board, setBoard] = useState({});
    const [columns, setColumns] = useState([]);

    const [isShowAddList, setIsShowAddList] = useState(false);
    const inputRef = useRef(null);
    const [valueInput, setValueInput] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        if(isShowAddList === true && inputRef && inputRef.current){
            inputRef.current.focus();
        }
    },[isShowAddList])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${apiUrl}/boards`);
                const boards = response.data;
                console.log('Boards:', boards);
                const boardInitData = boards.find(item => item.id === 'board-1');
                console.log('Board Init Data:', boardInitData);
                if(boardInitData) {
                    setBoard(boardInitData);
                    const columnsResponse = await axios.get(`${apiUrl}/columns/board/${boardInitData.id}`);
                    console.log('Columns Response:', columnsResponse.data);
                    // Garantir que cada coluna tenha um cardOrder inicial
                    const columnsWithCardOrder = columnsResponse.data.map(column => ({
                        ...column,
                        cardOrder: column.cardOrder || []
                    }));
                    setColumns(mapOrder(columnsWithCardOrder, boardInitData.columnOrder || [], 'id'));
                }
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
                setMessage({ text: 'Erro ao buscar dados.', type: 'error' });
            }
        };
        fetchData();
    },[]);

    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const onColumnDrop = async (dropResult) => {
        if (!dropResult || !dropResult.removedIndex && dropResult.addedIndex === null) return;

        let newColumns = [...columns];
        newColumns = applyDrag(newColumns, dropResult);

        // Filtrar apenas as colunas que ainda existem
        const validColumnIds = newColumns.map(col => col.id);
        const filteredColumnOrder = (board.columnOrder || []).filter(id => validColumnIds.includes(id));

        // Adicionar novas colunas que não estavam na ordem anterior
        const newColumnOrder = [...filteredColumnOrder];
        newColumns.forEach(col => {
            if (!newColumnOrder.includes(col.id)) {
                newColumnOrder.push(col.id);
            }
        });

        let newBoard = {
            ...board,
            columnOrder: newColumnOrder,
            columns: newColumns
        };

        setColumns(newColumns);
        setBoard(newBoard);

        // Persistir a ordem das colunas no backend
        try {
            await axios.put(`${apiUrl}/boards/${board.id}`, { columnOrder: newColumnOrder });
            setMessage({ text: 'Ordem das colunas atualizada com sucesso!', type: 'success' });
        } catch (error) {
            console.error("Erro ao atualizar ordem das colunas:", error);
            setMessage({ text: 'Erro ao atualizar ordem das colunas.', type: 'error' });
            // Reverter para o estado anterior em caso de erro
            setColumns(columns);
            setBoard(board);
        }
    };

    const onCardDrop = async (dropResult, columnId) => {
        if (!dropResult || (dropResult.removedIndex === null && dropResult.addedIndex === null)) {
            return;
        }

        try {
            let newColumns = [...columns];
            let currentColumn = newColumns.find(column => column.id === columnId);
            
            // Se o card veio de outra coluna
            if (dropResult.payload && dropResult.payload.columnId !== columnId) {
                // Atualizar o columnId do card no backend
                await axios.put(`${apiUrl}/tasks/${dropResult.payload.id}`, {
                    columnId: columnId
                });

                // Atualizar o cardOrder da coluna de origem
                const sourceColumn = newColumns.find(col => col.id === dropResult.payload.columnId);
                if (sourceColumn) {
                    const sourceCardOrder = sourceColumn.cardOrder.filter(id => id !== dropResult.payload.id);
                    sourceColumn.cardOrder = sourceCardOrder;
                    await axios.put(`${apiUrl}/columns/${sourceColumn.id}`, { 
                        cardOrder: JSON.stringify(sourceCardOrder) 
                    });
                }
            }

            // Atualizar os cards da coluna atual usando applyDrag
            currentColumn.cards = applyDrag(currentColumn.cards || [], dropResult);
            currentColumn.cardOrder = currentColumn.cards.map(card => card.id);
            
            // Atualizar o estado
            setColumns(newColumns);

            // Persistir a nova ordem no backend
            await axios.put(`${apiUrl}/columns/${columnId}`, { 
                cardOrder: JSON.stringify(currentColumn.cardOrder) 
            });

            setMessage({ text: 'Ordem dos cards atualizada com sucesso!', type: 'success' });
        } catch (error) {
            console.error("Erro ao atualizar ordem dos cards:", error);
            setMessage({ text: 'Erro ao atualizar ordem dos cards.', type: 'error' });
        }
    };

    const handleAddList = async () => {
        if(!valueInput){
            if(inputRef && inputRef.current)
                inputRef.current.focus();
            return;
        }

        try {
            // Criar a nova coluna
            const newColumn = {
                id: uuidv4(),
                boardId: board.id,
                name: valueInput,
                cardOrder: [],
                cards: []
            };

            // Persistir a nova coluna no backend primeiro
            const response = await axios.post(`${apiUrl}/columns`, newColumn);
            const createdColumn = response.data;

            // Atualizar o estado local apenas após a criação bem-sucedida
            const _columns = [...columns];
            _columns.push(createdColumn);

            // Atualizar o estado do board
            const newBoard = {
                ...board,
                columnOrder: [...board.columnOrder, createdColumn.id]
            };

            // Atualizar os estados
            setColumns(_columns);
            setBoard(newBoard);
            setValueInput('');
            setIsShowAddList(false);

            // Atualizar a ordem das colunas no backend
            await axios.put(`${apiUrl}/boards/${board.id}`, { 
                columnOrder: newBoard.columnOrder 
            });

            setMessage({ text: 'Coluna adicionada com sucesso!', type: 'success' });
        } catch (error) {
            console.error("Erro ao adicionar coluna:", error);
            setMessage({ 
                text: 'Erro ao adicionar coluna. Por favor, tente novamente.', 
                type: 'error' 
            });
        }
    }

    if(_.isEmpty(board)) {
        return (
            <>
                <div className='not-found'> Board not found </div>
            </>
        )
    }

    const onUpdateColumn = async (newColumn) => {
        const columnIdUpdate = newColumn.id;
        const ncols = [...columns];
        const columnIndex = ncols.findIndex(item => item.id === columnIdUpdate);
        if(newColumn._destroy) {
            ncols.splice(columnIndex, 1);
        }else{
            ncols[columnIndex] = newColumn;
        }
        setColumns(ncols);

        // Persistir a atualização da coluna no backend
        try {
            if(newColumn._destroy) {
                await axios.delete(`${apiUrl}/columns/${columnIdUpdate}`);
                setMessage({ text: 'Coluna excluída com sucesso!', type: 'success' });
            } else {
                await axios.put(`${apiUrl}/columns/${columnIdUpdate}`, newColumn);
                setMessage({ text: 'Coluna atualizada com sucesso!', type: 'success' });
            }
        } catch (error) {
            console.error("Erro ao atualizar coluna:", error);
            setMessage({ text: 'Erro ao atualizar coluna.', type: 'error' });
        }
    }
    return (
        <>
            <div className="board-columns">
                <Container
                    orientation="horizontal"
                    onDrop={onColumnDrop}
                    getChildPayload={index => {
                        console.log('Column payload:', columns[index]); // Debug log
                        return columns[index];
                    }}
                    dragHandleSelector=".column-drag-handle"
                    dropPlaceholder={{
                        animationDuration: 150,
                        showOnTop: true,
                        className: 'column-drop-preview'
                    }}
                >
                    {columns && columns.length > 0 && columns.map((column, index) => (
                        <Draggable key={column.id}>
                            <Column                     
                                column={column}
                                onCardDrop={onCardDrop}
                                onUpdateColumn={onUpdateColumn}
                            />
                        </Draggable>
                    ))}
                
                    {isShowAddList ? 
                        <div className='content-add-column'>
                            <input 
                                type='text' 
                                className="form-control" 
                                placeholder="Enter column title..." 
                                ref={inputRef} 
                                value={valueInput}
                                onChange={(e) => setValueInput(e.target.value)}
                            />
                            <div className='group-btn'>
                                <button className='btn btn-success' onClick={() => handleAddList()}>Add list</button>
                                <FontAwesomeIcon icon={faClose} onClick={() => setIsShowAddList(false)} />
                            </div>
                        </div>
                    : 
                        <div className='add-new-column' onClick={() => setIsShowAddList(true)}>
                            <FontAwesomeIcon icon={faPlus} />
                            Add another column
                        </div>
                    }
                </Container>
            </div>
            {message.text && (
                <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`} role="alert">
                    {message.text}
                </div>
            )}
        </>
    )
}

export default BoardContent;