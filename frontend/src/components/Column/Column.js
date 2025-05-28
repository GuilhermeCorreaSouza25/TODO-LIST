import './Column.scss';
// import imgDesign from '../../assets/img-design.png';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Card from '../Card/Card';
import { mapOrder } from '../../utilities/sort';
import { Container, Draggable } from "react-smooth-dnd";
import { faPlus, faEllipsisH, faClose, faSpinner, faEdit, faTrash, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
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
    const [isShowModalClear, setShowModalClear] = useState(false);
    const [nomeColumn, setNameColumn] = useState(column.name);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const inputRef = useRef(null);
    const [isShowAddNewCard, setIsShowAddNewCard] = useState(false);
    const [valueTextArea, setValueTextArea] = useState('');
    const textAreaRef = useRef(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    

    const apiUrl = process.env.REACT_APP_API_URL;

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

    useEffect(() => {
        if(isEditing && inputRef && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const toggleModal = () => {
        setShowModalDelete(!isShowModalDelete);
    }

    const toggleClearModal = () => {
        setShowModalClear(!isShowModalClear);
    }

    const onModalAction = async (type) => {
        if(type === MODAL_ACTION_CLOSE) {
            toggleModal();
        }
        if (type === MODAL_ACTION_CONFIRM) {
            setIsDeleting(true);
            try {
                await axios.delete(`${apiUrl}/columns/${column.id}`);
                const newColumn = {
                    ...column,
                    _destroy: true
                };
                onUpdateColumn(newColumn);
            } catch (error) {
                console.error('Erro ao deletar coluna:', error);
                alert('Erro ao deletar coluna');
            } finally {
                setIsDeleting(false);
                toggleModal();
            }
        }
    }

    const onClearModalAction = async (type) => {
        if(type === MODAL_ACTION_CLOSE) {
            toggleClearModal();
        }
        if (type === MODAL_ACTION_CONFIRM) {
            setIsClearing(true);
            try {
                await axios.delete(`${apiUrl}/columns/${column.id}/clear`);
                const newColumn = {
                    ...column,
                    cards: [],
                    cardOrder: []
                };
                onUpdateColumn(newColumn);
            } catch (error) {
                console.error('Erro ao limpar coluna:', error);
                alert('Erro ao limpar coluna');
            } finally {
                setIsClearing(false);
                toggleClearModal();
            }
        }
    }

    const handleEditColumn = () => {
        setIsEditing(true);
    }

    const handleClickOutside = (event) => {
        if (isMenuOpen && !event.target.closest('.column-menu')) {
            setIsMenuOpen(false);
        }
    }

    useEffect(() => {
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isMenuOpen]);

    const handleAddNewCard = async () => {
        if(!valueTextArea) {
            alert('Por favor, digite um nome para o card');
            return;
        }

        setIsAddingCard(true);
        try {
            const response = await axios.post(`${apiUrl}/cards`, {
                boardId: column.boardId,
                columnId: column.id,
                title: valueTextArea
            });

            const newCard = response.data;
            let newColumn = {...column};
            newColumn.cards = [...newColumn.cards, newCard];
            newColumn.cardOrder = newColumn.cards.map((card) => card.id);
            onUpdateColumn(newColumn);
            setValueTextArea('');
            setIsShowAddNewCard(false);
        } catch (error) {
            console.error('Erro ao adicionar card:', error);
            alert('Erro ao adicionar card');
        } finally {
            setIsAddingCard(false);
        }
    }

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    }

    const handleEditCard = async (updatedCard) => {
        const newColumn = { ...column };
        const cardIndex = newColumn.cards.findIndex(c => c.id === updatedCard.id);
        if (cardIndex !== -1) {
            newColumn.cards[cardIndex] = updatedCard;
            onUpdateColumn(newColumn);
        }
    };

    const handleDeleteCard = async (cardToDelete) => {
        try {
            await axios.delete(`${apiUrl}/cards/${cardToDelete.id}`);
            const newColumn = { ...column };
            newColumn.cards = newColumn.cards.filter(c => c.id !== cardToDelete.id);
            onUpdateColumn(newColumn);
        } catch (error) {
            console.error('Erro ao deletar card:', error);
            alert('Erro ao deletar card');
        }
    };

    return (
        <>
            <div className="column">
                <header className="column-header">
                    <div className="column-title-container">
                        <div className="column-title">
                            {isEditing ? (
                                <Form.Control
                                    size="sm"
                                    type="text"
                                    value={nomeColumn}
                                    className='customize-input-column'
                                    onChange={(event)=> setNameColumn(event.target.value)}
                                    spellCheck="false"
                                    onBlur={handleClickOutside}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleClickOutside();
                                        }
                                    }}
                                    ref={inputRef}
                                />
                            ) : (
                                <div onClick={handleEditColumn}>
                                    {nomeColumn}
                                </div>
                            )}
                        </div>
                        <div className="column-menu">
                            <button 
                                className="menu-trigger"
                                onClick={toggleMenu}
                                title="Opções da coluna"
                            >
                                <FontAwesomeIcon icon={faEllipsisH} />
                            </button>
                            <div className={`column-actions ${isMenuOpen ? 'show' : ''}`}>
                                <button onClick={handleEditColumn}>
                                    <FontAwesomeIcon icon={faEdit} />
                                    Editar coluna
                                </button>
                                <button onClick={toggleClearModal}>
                                    <FontAwesomeIcon icon={faTrash} />
                                    Limpar coluna
                                </button>
                                <button className="delete" onClick={toggleModal}>
                                    <FontAwesomeIcon icon={faTrashAlt} />
                                    Excluir coluna
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
                
                <Container
                    groupName="col"
                    onDrop={(dropResult) => onCardDrop(dropResult, column.id)}
                    getChildPayload={index => cards[index]}
                    dragClass="card-ghost"
                    dropClass="card-ghost-drop"
                    dropPlaceholder={{                      
                        animationDuration: 150,
                        showOnTop: true,
                        className: 'card-drop-preview' 
                    }}
                    dropPlaceholderAnimationDuration={200}
                >
                    {cards && cards.length > 0 && cards.map((card, index) => {
                        return (
                            <Draggable key={card.id}>
                                <Card
                                    card={card}
                                    index={index}
                                    onEdit={handleEditCard}
                                    onDelete={handleDeleteCard}
                                />
                            </Draggable>
                        )
                    })}
                </Container>
                
                {isShowAddNewCard && (
                    <div className="add-new-card">
                        <textarea
                            rows={2}
                            className='form-control'
                            placeholder="Digite um nome para este card..."
                            ref={textAreaRef}
                            value={valueTextArea}
                            onChange={(event) => setValueTextArea(event.target.value)}
                            disabled={isAddingCard}
                        ></textarea>
                        <div className="group-btn">
                            <button 
                                className='btn btn-primary btn-sm'
                                onClick={() => handleAddNewCard()}
                                disabled={isAddingCard}
                            >
                                {isAddingCard ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin /> Adicionando...
                                    </>
                                ) : (
                                    'Adicionar card'
                                )}
                            </button>
                            <FontAwesomeIcon 
                                icon={faClose}
                                className='add-icon'
                                onClick={() => setIsShowAddNewCard(false)}
                                style={{ cursor: isAddingCard ? 'not-allowed' : 'pointer' }}
                            />
                        </div>
                    </div>
                )}
                
                {!isShowAddNewCard && (
                    <footer>
                        <div 
                            className='footer-action' 
                            onClick={() => !isLoading && setIsShowAddNewCard(true)}
                            style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
                        >
                            <FontAwesomeIcon 
                                icon={faPlus} 
                            /> 
                            Adicionar outro card
                        </div>
                    </footer>
                )}
            </div>
            
            <ConfirmModal
                show={isShowModalDelete}
                title={"Remover coluna"}
                content={`Tem certeza que deseja remover a coluna: <b>${column.name}</b>?`}
                onAction={onModalAction}
                isLoading={isDeleting}
                loadingText="Removendo coluna..."
            />

            <ConfirmModal
                show={isShowModalClear}
                title={"Limpar coluna"}
                content={`Tem certeza que deseja remover todos os cards da coluna: <b>${column.name}</b>?`}
                onAction={onClearModalAction}
                isLoading={isClearing}
                loadingText="Limpando coluna..."
            />
        </>
    )
}

export default Column;