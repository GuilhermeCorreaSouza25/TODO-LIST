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

const BoardContent = () => {

    const [board, setBoard] = useState({});
    const [columns, setColumns] = useState([]);

    const [isShowAddList, setIsShowAddList] = useState(false);
    const inputRef = useRef(null);
    const [valueInput, setValueInput] = useState('');


    useEffect(() => {
        if(isShowAddList === true && inputRef && inputRef.current){
            inputRef.current.focus();
        }
    },[isShowAddList])

    useEffect(() => {
        const boardInitData = initData.boards.find(item => item.id === 'board-1');
        if(boardInitData) {
            setBoard(boardInitData);

            // Sort columns
            setColumns(mapOrder(boardInitData.columns, boardInitData.columnOrder, 'id'));
        }
    },[]);

    const onColumnDrop = (dropResult) => {
        let newColumns = [...columns];
        newColumns = applyDrag(newColumns, dropResult);

        let newBoard = {...board};
        newBoard.columnOrder = newColumns.map(c => c.id);
        newBoard.columns = newColumns;

        setColumns(newColumns);
        setBoard(newBoard);
    }


    const onCardDrop = (dropResult, columnId) =>{
        if(dropResult.removedIndex === null && dropResult.addedIndex === null) {
            // console.log('>>>>> inside onCardDrop', dropResult, 'with columnId', columnId);
        }
        
        let newColumns = [...columns];
        let currentColumn = newColumns.find(column => column.id === columnId);
        currentColumn.cards = applyDrag(currentColumn.cards, dropResult);
        currentColumn.cardOrder = currentColumn.cards.map(card => card.id);
        
        setColumns(newColumns);
    }

    const handleAddList = () => {
        if(!valueInput){
            if(inputRef && inputRef.current)
                inputRef.current.focus();
            return;
        }

        // update boar columns
        const _columns = _.cloneDeep(columns);
        _columns.push({
            id: uuidv4(),
            boardId: board.id,
            name: valueInput,
            cardOrder: [],
            cards: []
        });

        setColumns(_columns);
        setValueInput('');
        inputRef.current.focus();
        setIsShowAddList(false);
    }

    if(_.isEmpty(board)) {
        return (
            <>
                <div className='not-found'> Board not found </div>
            </>
        )
    }

    const onUpdateColumn = (newColumn) => {
        const columnIdUpdate = newColumn.id;
        const ncols = [...columns];
        const columnIndex = ncols.findIndex(item => item.id === columnIdUpdate);
        if(newColumn._destroy) {
            ncols.splice(columnIndex, 1);
        }else{
            ncols[columnIndex] = newColumn;
        }
        setColumns(ncols);
    }
    return (
        <>
            <div className="board-columns">
                <Container
                    orientation="horizontal"
                    onDrop={onColumnDrop}
                    getChildPayload={index => columns[index]}
                    dragHandleSelector=".column-drag-handle"
                    dropPlaceholder={{
                        animationDuration: 150,
                        showOnTop: true,
                        className: 'column-drop-preview'
                    }}
                >{

                    columns && columns.length > 0 && columns.map((column, index) => (
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
        </>
    )
}

export default BoardContent;