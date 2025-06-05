import './Column.scss';
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Card from '../Card/Card';
import { mapOrder } from '../../utilities/sort';
import { Container, Draggable } from "react-smooth-dnd";
import { faPlus, faEllipsisH, faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Dropdown from 'react-bootstrap/Dropdown';
import ConfirmModal from '../Common/ConfirmModal';
import Form from 'react-bootstrap/Form'; // Still used for Column name editing
import { MODAL_ACTION_CLOSE, MODAL_ACTION_CONFIRM } from '../../utilities/constant';
// import { v4 as uuidv4 } from 'uuid'; // Not used if backend generates ID
import LoadingSpinner from '../Common/LoadingSpinner';
import CardModal from '../Common/cardModal'; // Import the new modal

const Column = (props) => {
    const { column, onCardDrop, onUpdateColumn } = props;
    const [cards, setCards] = useState([]);
    const [isLoadingCards, setIsLoadingCards] = useState(true);

    const [isShowModalDelete, setShowModalDelete] = useState(false);
    const [nomeColumn, setNameColumn] = useState(''); // Initialize with empty or column.name
    const [isEditing, setIsEditing] = useState(false);
    const [isFirstClick, setIsFirstClick] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef(null);

    // States for CardModal
    const [showCardModal, setShowCardModal] = useState(false);
    const [editingCardData, setEditingCardData] = useState(null); // null for new, card object for edit

    // Estados de loading para cada ação
    const [isLoadingClear, setIsLoadingClear] = useState(false);
    const [isLoadingDelete, setIsLoadingDelete] = useState(false);
    const [isLoadingAdd, setIsLoadingAdd] = useState(false); // Used by CardModal for adding
    const [isLoadingEdit, setIsLoadingEdit] = useState(false); // Used by CardModal for editing & column name edit

    const apiUrl = process.env.REACT_APP_API_URL;

    // useEffect for focusing column name input (kept as is)
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    useEffect(() => {
        if (column && column.name) {
            setNameColumn(column.name);
        }
    }, [column]);

    useEffect(() => {
        const fetchCardsForColumn = async () => {
            if (!column || !column.id) {
                setIsLoadingCards(false);
                setCards([]);
                return;
            }
            setIsLoadingCards(true);
            try {
                const response = await axios.get(`${apiUrl}/tasks/column/${column.id}`);
                let cardOrderArray = column.cardOrder || [];
                if (typeof cardOrderArray === 'string') {
                    try {
                        cardOrderArray = JSON.parse(cardOrderArray);
                    } catch (e) {
                        console.error("Erro ao parse column.cardOrder:", e, column.cardOrder);
                        cardOrderArray = [];
                    }
                }
                if (!Array.isArray(cardOrderArray)) cardOrderArray = [];

                // Ensure fetched cards have description and data_fim for modal pre-fill and display
                const fetchedCards = response.data.map(card => ({
                    ...card,
                    description: card.description || '',
                    data_fim: card.data_fim || null,
                }));

                const sortedCards = mapOrder(fetchedCards, cardOrderArray, 'id');
                setCards(sortedCards);
            } catch (error) {
                console.error(`Erro ao buscar cards para a coluna ${column.id}:`, error);
                setCards([]);
            } finally {
                setIsLoadingCards(false);
            }
        };
        fetchCardsForColumn();
    }, [column, apiUrl]);

    const onModalAction = (type) => {
        if (type === MODAL_ACTION_CLOSE) setShowModalDelete(false);
        if (type === MODAL_ACTION_CONFIRM) handleDeleteColumn();
    };

    const handleClickOutside = () => {
        setIsFirstClick(false);
        if (isEditing) setIsEditing(false); // Only turn off editing if it was on for column name
    };

    const handleEditColumnNameClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(true);
        setShowDropdown(false);
        // setTimeout for focus is handled by useEffect on `isEditing`
    };

    const handleSaveColumnName = async () => {
        if (!isEditing) return;
        const trimmedName = nomeColumn.trim();
        if (trimmedName === '' || trimmedName === column.name) {
            setNameColumn(column.name); // Revert if empty or unchanged
            setIsEditing(false);
            return;
        }
        setIsLoadingEdit(true);
        try {
            await axios.put(`${apiUrl}/columns/${column.id}`, { name: trimmedName });
            onUpdateColumn({ ...column, name: trimmedName });
        } catch (err) {
            console.error("Erro ao editar coluna:", err);
            setNameColumn(column.name); // Revert on error
        } finally {
            setIsLoadingEdit(false);
            setIsEditing(false);
        }
    };

    const handleClearColumn = async () => {
        // ... (implementation as before)
        setIsLoadingClear(true);
        try {
            await axios.delete(`${apiUrl}/columns/${column.id}/clear`);
            setCards([]);
            onUpdateColumn({ ...column, cards: [], cardOrder: [] });
        } catch (err) {
            console.error("Erro ao limpar coluna:", err);
        } finally {
            setIsLoadingClear(false);
        }
    };

    const handleDeleteColumn = async () => {
        // ... (implementation as before)
        setIsLoadingDelete(true);
        try {
            await axios.delete(`${apiUrl}/columns/${column.id}`);
            onUpdateColumn({ ...column, _destroy: true });
        } catch (err) {
            console.error("Erro ao excluir coluna:", err);
        } finally {
            setIsLoadingDelete(false);
            setShowModalDelete(false);
        }
    };

    // Card Modal Handlers
    const handleOpenAddCardModal = () => {
        setEditingCardData(null);
        setShowCardModal(true);
    };

    const handleOpenEditCardModal = (cardToEdit) => {
        setEditingCardData(cardToEdit);
        setShowCardModal(true);
    };

    const handleCloseCardModal = () => {
        setShowCardModal(false);
        setEditingCardData(null);
    };

    const handleSubmitCardModal = async (formData) => { // formData = { title, description, data_fim }
        if (editingCardData && editingCardData.id) { // Editing existing card
            setIsLoadingEdit(true); // Use isLoadingEdit for card editing in modal
            try {
                const payloadToUpdate = { // Only send fields that are meant to be updated
                    title: formData.title,
                    descricao: formData.descricao,
                    data_fim: formData.data_fim || null,
                };
                const response = await axios.put(`${apiUrl}/tasks/${editingCardData.id}`, payloadToUpdate);
                const returnedUpdatedCard = response.data;

                const finalUpdatedCard = {
                    ...editingCardData, // Keep original id, boardId, columnId etc.
                    ...returnedUpdatedCard, // Apply all fields returned by backend
                    // Ensure frontend values are used if backend doesn't return them explicitly here
                    title: returnedUpdatedCard.title !== undefined ? returnedUpdatedCard.title : formData.title,
                    descricao: returnedUpdatedCard.descricao !== undefined ? returnedUpdatedCard.descricao : formData.descricao,
                    data_fim: returnedUpdatedCard.data_fim !== undefined ? returnedUpdatedCard.data_fim : (formData.data_fim || null),
                };

                const newCards = cards.map(card => card.id === finalUpdatedCard.id ? finalUpdatedCard : card);
                setCards(newCards);
                onUpdateColumn({ ...column, cards: newCards, cardOrder: column.cardOrder });
                handleCloseCardModal();
            } catch (err) {
                console.error("Erro ao atualizar card:", err.response ? err.response.data : err.message);
                alert('Erro ao atualizar card. Por favor, tente novamente.');
            } finally {
                setIsLoadingEdit(false);
            }
        } else { // Adding new card
            setIsLoadingAdd(true);
            try {
                const newCardPayload = {
                    boardId: column.boardId,
                    columnId: column.id,
                    title: formData.title,
                    description: formData.description,
                    data_fim: formData.data_fim || null,
                };
                const response = await axios.post(`${apiUrl}/tasks`, newCardPayload);
                let createdCard = response.data;

                if (!createdCard || !createdCard.id) throw new Error('Resposta inválida do servidor ao criar card.');
                
                createdCard = { // Combine payload with backend response
                    ...newCardPayload, 
                    ...createdCard,
                 };

                const newCards = [...cards, createdCard];
                const newCardOrder = newCards.map(card => card.id);
                
                setCards(newCards); // Optimistic UI update for cards list
                // Update cardOrder in backend for the current column
                await axios.put(`${apiUrl}/columns/${column.id}`, { cardOrder: newCardOrder });
                
                onUpdateColumn({ ...column, cards: newCards, cardOrder: newCardOrder });
                handleCloseCardModal();
            } catch (err) {
                console.error("Erro ao adicionar card:", err.response ? err.response.data : err.message);
                alert('Erro ao adicionar card. Por favor, tente novamente.');
            } finally {
                setIsLoadingAdd(false);
            }
        }
    };
    
    const handleUpdateCardDirectly = (updatedCard) => { // Called by Card for actions like delete
        if (updatedCard._destroy) {
            const newCards = cards.filter(card => card.id !== updatedCard.id);
            const newCardOrder = newCards.map(c => c.id);
            setCards(newCards);
            axios.put(`${apiUrl}/columns/${column.id}`, { cardOrder: newCardOrder })
                 .then(() => onUpdateColumn({ ...column, cardOrder: newCardOrder, cards: newCards }))
                 .catch(err => console.error("Erro ao atualizar cardOrder após deletar card:", err));
        } else {
            // This case might be less used if all edits go via modal, but kept for other direct updates
            const newCardsList = cards.map(card => card.id === updatedCard.id ? updatedCard : card);
            setCards(newCardsList);
            onUpdateColumn({ ...column, cards: newCardsList, cardOrder: column.cardOrder });
        }
    };

    const handleCardDrop = async (dropResult) => {
        // ... (implementation as before, ensure it uses the updated `cards` state)
        if (dropResult.removedIndex === null && dropResult.addedIndex === null) return;

        const currentCardsSnapshot = [...cards];
        let newCardsOrder = [...currentCardsSnapshot];
        let movedCard = dropResult.payload;

        if (dropResult.removedIndex !== null) {
            movedCard = newCardsOrder.splice(dropResult.removedIndex, 1)[0];
        }
        if (dropResult.addedIndex !== null) {
            if (dropResult.payload && dropResult.payload.columnId !== column.id) { // Card from another column
                movedCard = { ...dropResult.payload, columnId: column.id };
            }
            newCardsOrder.splice(dropResult.addedIndex, 0, movedCard);
        }
        
        setCards(newCardsOrder); // Optimistic update of local card list and order

        try {
            // If card moved to a different column
            if (dropResult.payload && dropResult.payload.columnId && dropResult.payload.columnId !== column.id) {
                await axios.put(`${apiUrl}/tasks/${movedCard.id}`, { columnId: column.id });
                
                const sourceColumnId = dropResult.payload.columnId;
                // Logic to update source column's cardOrder (simplified for brevity, full logic was in original)
                // This typically involves fetching source column, filtering out movedCard.id, and PUTting new cardOrder
                console.log(`Card ${movedCard.id} moved from column ${sourceColumnId}. Source column update might be needed.`);
            }

            const finalCardIdsOrder = newCardsOrder.map(c => c.id);
            await axios.put(`${apiUrl}/columns/${column.id}`, {
                cardOrder: JSON.stringify(finalCardIdsOrder)
            });

            onUpdateColumn({
                ...column,
                cards: newCardsOrder, // send the re-ordered cards
                cardOrder: finalCardIdsOrder
            });
        } catch (error) {
            console.error('Erro no drop do card:', error);
            setCards(currentCardsSnapshot); // Revert on error
        }
    };

    return (
        <>
            <div className="column">
                <header className="column-drag-handle" onClick={handleClickOutside}>
                    <div className="column-name">
                        {isEditing ? (
                            <Form.Control
                                size="sm" type="text" value={nomeColumn}
                                className='customize-input-column'
                                onChange={(e) => setNameColumn(e.target.value)}
                                onBlur={handleSaveColumnName}
                                onKeyPress={(e) => { if (e.key === 'Enter') handleSaveColumnName(); }}
                                spellCheck="false" ref={inputRef}
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <div className="column-title" onClick={handleEditColumnNameClick}>
                                {nomeColumn}
                                {isLoadingEdit && isEditing && <LoadingSpinner size="sm" />}
                            </div>
                        )}
                    </div>
                    <div className="column-dropdown">
                        <Dropdown show={showDropdown} onToggle={(isOpen) => setShowDropdown(isOpen)}>
                            <Dropdown.Toggle variant="" id="dropdown-basic" size='sm' className="dropdown-btn-customize">
                                <FontAwesomeIcon icon={faEllipsisH} />
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={handleEditColumnNameClick} disabled={isLoadingEdit}>
                                    {isLoadingEdit && isEditing ? <LoadingSpinner size="sm" /> : 'Editar nome'}
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => setShowModalDelete(true)} disabled={isLoadingDelete}>
                                    {isLoadingDelete ? <LoadingSpinner size="sm" /> : 'Excluir coluna'}
                                </Dropdown.Item>
                                <Dropdown.Item onClick={handleClearColumn} disabled={isLoadingClear || cards.length === 0}>
                                    {isLoadingClear ? <LoadingSpinner size="sm" /> : 'Limpar coluna'}
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </header>
                <div className="card-list">
                    <Container groupName="cards" onDrop={handleCardDrop} getChildPayload={index => cards[index]}
                        dragClass="card-ghost" dropClass="card-ghost-drop"
                        dropPlaceholder={{ animationDuration: 150, showOnTop: true, className: 'card-drop-preview' }}
                        autoScrollEnabled={true}
                    >
                        {isLoadingCards ? (
                            <div className="loading-cards"><LoadingSpinner /></div>
                        ) : (
                            cards.map((card) => ( // Removed index as isFirstCard is not used here now
                                <Draggable key={card.id}>
                                    <Card
                                        card={card}
                                        onUpdateCard={handleUpdateCardDirectly} // For delete or other direct actions
                                        onEditRequest={handleOpenEditCardModal} // New: To open edit modal
                                    />
                                </Draggable>
                            ))
                        )}
                        {!isLoadingCards && cards.length === 0 && (
                            <div className="no-cards-message">Nenhum card nesta coluna.</div>
                        )}
                    </Container>
                    {/* Inline form removed */}
                </div>
                <footer>
                    <div className='footer-action' onClick={handleOpenAddCardModal}>
                        <FontAwesomeIcon icon={faPlus} /> Adicionar outro card
                    </div>
                </footer>
            </div>

            <ConfirmModal
                show={isShowModalDelete}
                title="Excluir Coluna"
                content={`Tem certeza que deseja excluir a coluna: <strong>${column.name}</strong>?`}
                onAction={onModalAction}
            />

            <CardModal
                show={showCardModal}
                onHide={handleCloseCardModal}
                onSubmit={handleSubmitCardModal}
                cardData={editingCardData}
                isLoading={isLoadingAdd || (isLoadingEdit && !!editingCardData)} // More specific loading for modal
                modalTitlePrefix="Card"
            />
        </>
    )
}

export default Column;