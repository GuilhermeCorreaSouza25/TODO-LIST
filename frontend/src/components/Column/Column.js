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
import LoadingSpinner from '../Common/LoadingSpinner';

const Column = (props) => {
    const { column, onCardDrop, onUpdateColumn } = props; // onCardDrop continua não utilizado neste componente
    const [cards, setCards] = useState([]);
    const [isLoadingCards, setIsLoadingCards] = useState(true);

    const [isShowModalDelete, setShowModalDelete] = useState(false);
    const [nomeColumn, setNameColumn] = useState(column.name);
    const [isEditing, setIsEditing] = useState(false);
    const [isFirstClick, setIsFirstClick] = useState(true); // Lógica de clique para seleção de texto no nome da coluna
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef(null);
    const [isShowAddNewCard, setIsShowAddNewCard] = useState(false);
    const [valueTextArea, setValueTextArea] = useState('');
    const textAreaRef = useRef(null);

    // Estados de loading para cada ação
    const [isLoadingClear, setIsLoadingClear] = useState(false);
    const [isLoadingDelete, setIsLoadingDelete] = useState(false);
    const [isLoadingAdd, setIsLoadingAdd] = useState(false);
    const [isLoadingEdit, setIsLoadingEdit] = useState(false);

    const apiUrl = process.env.REACT_APP_API_URL;

    // Este fetchTasks parece ser para uma lista geral de tarefas, não usado diretamente para os cards da coluna.
    // Mantido conforme o original.
    const [tasks, setTasks] = useState([]); // Estado para tasks gerais, se necessário
    const [loading, setLoading] = useState(true); // Loading para tasks gerais
    const [error, setError] = useState(null); // Erro para tasks gerais

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
            console.error("Erro ao buscar tarefas gerais:", err);
            setError("Falha ao carregar tarefas gerais. Verifique a conexão com o backend.");
            setTasks([]);
        } finally {
            setLoading(false);
        }
    }, [apiUrl]);

    useEffect(() => {
        // Se esta busca de tarefas gerais não for necessária neste componente, pode ser removida.
        fetchTasks();
    }, [fetchTasks]);


    useEffect(() => {
        if (isShowAddNewCard && textAreaRef && textAreaRef.current) {
            textAreaRef.current.focus();
        }
    }, [isShowAddNewCard]);

    useEffect(() => {
        if (column && column.name) {
            setNameColumn(column.name);
        }
    }, [column]);

    // Fetch cards para esta coluna específica
    useEffect(() => {
        const fetchCardsForColumn = async () => {
            if (!column || !column.id) {
                console.log('Coluna ou ID da coluna não disponível para fetchCardsForColumn:', column);
                setIsLoadingCards(false);
                setCards([]); // Define cards como vazio se não houver coluna
                return;
            }

            try {
                setIsLoadingCards(true);
                // console.log('Buscando cards para coluna:', column.id); // Log original
                const response = await axios.get(`${apiUrl}/tasks/column/${column.id}`);
                
                // Garante que column.cardOrder seja um array para mapOrder
                let cardOrderArray = column.cardOrder || [];
                if (typeof cardOrderArray === 'string') {
                    try {
                        cardOrderArray = JSON.parse(cardOrderArray);
                    } catch (e) {
                        console.error("Erro ao fazer parse do column.cardOrder vindo das props:", e, column.cardOrder);
                        cardOrderArray = [];
                    }
                }
                if (!Array.isArray(cardOrderArray)) cardOrderArray = [];

                const sortedCards = mapOrder(response.data, cardOrderArray, 'id');
                setCards(sortedCards);
            } catch (error) {
                console.error(`Erro ao buscar cards para a coluna ${column.id}:`, error);
                setCards([]); // Define cards como vazio em caso de erro
            } finally {
                setIsLoadingCards(false);
            }
        };

        fetchCardsForColumn();
    }, [column, apiUrl]); // Re-executa se a prop column mudar (ex: cardOrder atualizado pelo pai)

    const toggleModal = () => {
        setShowModalDelete(!isShowModalDelete);
    };

    const onModalAction = (type) => {
        if (type === MODAL_ACTION_CLOSE) {
            setShowModalDelete(false);
        }
        if (type === MODAL_ACTION_CONFIRM) {
            handleDeleteColumn();
        }
    };

    const selectAllText = (event) => { // Lógica para nome da coluna
        setIsFirstClick(false);
        if (isFirstClick) {
            event.target.select();
        } else {
            inputRef.current.setSelectionRange(nomeColumn.length, nomeColumn.length);
        }
    };

    const handleClickOutside = () => { // Lógica para nome da coluna (quando não está editando via Enter/Blur direto no input)
        setIsFirstClick(false); // reset

        setIsEditing(false); // Garante que saia do modo de edição
    };

    const handleEditClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(true);
        setShowDropdown(false);
        // Garantir que o input receba foco após o dropdown fechar
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.select();
            }
        }, 100);
    };

    const handleEditColumn = async () => {
        if (!isEditing) return;

        const trimmedName = nomeColumn.trim();
        if (trimmedName === '') {
            setNameColumn(column.name);
            setIsEditing(false);
            return;
        }

        setIsLoadingEdit(true);
        try {
            await axios.put(`${apiUrl}/columns/${column.id}`, { name: trimmedName });
            const newColumn = {
                ...column,
                name: trimmedName
            };
            onUpdateColumn(newColumn);
        } catch (err) {
            console.error("Erro ao editar coluna:", err);
            setNameColumn(column.name);
        } finally {
            setIsLoadingEdit(false);
            setIsEditing(false);
        }
    };

    const handleClearColumn = async () => {
        setIsLoadingClear(true);
        try {
            await axios.delete(`${apiUrl}/columns/${column.id}/clear`);
            setCards([]); // Atualiza a UI localmente
            // Notifica o pai que a coluna foi limpa (cardOrder e cards vazios)
            onUpdateColumn({ ...column, cards: [], cardOrder: [] });
        } catch (err) {
            console.error("Erro ao limpar coluna:", err);
        } finally {
            setIsLoadingClear(false);
        }
    };

    const handleDeleteColumn = async () => {
        setIsLoadingDelete(true);
        try {
            await axios.delete(`${apiUrl}/columns/${column.id}`);
            const newColumn = {
                ...column,
                _destroy: true // Sinaliza para o componente pai remover esta coluna
            };
            onUpdateColumn(newColumn);
        } catch (err) {
            console.error("Erro ao excluir coluna:", err);
        } finally {
            setIsLoadingDelete(false);
            setShowModalDelete(false);
        }
    };

    const handleAddNewCard = async () => {
        if (!valueTextArea.trim()) {
            alert('Por favor, digite um nome para o card');
            return;
        }

        if (!column || !column.id || !column.boardId) {
            console.error('Informações da coluna incompletas:', column);
            alert('Não foi possível adicionar o card. Por favor, atualize a página e tente novamente.');
            return;
        }

        setIsLoadingAdd(true);
        try {
            const newCardData = {
                // id: uuidv4(), // O backend deve gerar o ID
                boardId: column.boardId,
                columnId: column.id,
                title: valueTextArea.trim(),
                // image: null // Se não houver imagem
            };

            const response = await axios.post(`${apiUrl}/tasks`, newCardData);
            const createdCard = response.data; // Assume que o backend retorna o card criado com seu ID

            if (!createdCard || !createdCard.id) {
                throw new Error('Resposta inválida do servidor ao criar card');
            }
            
            const newCards = [...cards, createdCard];
            setCards(newCards);

            const newCardOrder = newCards.map(card => card.id);
            await axios.put(`${apiUrl}/columns/${column.id}`, { cardOrder: newCardOrder }); // Backend espera array ou string? Se string: JSON.stringify(newCardOrder)

            onUpdateColumn({
                ...column,
                cards: newCards, // Opcional: se o pai gerencia a lista de cards também
                cardOrder: newCardOrder
            });

            setValueTextArea('');
            setIsShowAddNewCard(false);
        } catch (err) {
            console.error("Erro ao adicionar card:", err.response ? err.response.data : err.message);
            alert('Erro ao adicionar card. Por favor, tente novamente.');
        } finally {
            setIsLoadingAdd(false);
        }
    };
    
    const handleUpdateCard = (updatedCard) => { // Chamado pelo componente Card
        if (updatedCard._destroy) {
            const newCards = cards.filter(card => card.id !== updatedCard.id);
            setCards(newCards);
            const newCardOrder = newCards.map(c => c.id);
            // Atualizar cardOrder da coluna no backend e no pai
            axios.put(`${apiUrl}/columns/${column.id}`, { cardOrder: newCardOrder }) // ou JSON.stringify
                 .then(() => {
                    onUpdateColumn({ ...column, cardOrder: newCardOrder, cards: newCards });
                 })
                 .catch(err => console.error("Erro ao atualizar cardOrder após deletar card:", err));
        } else {
            setCards(prevCards => prevCards.map(card =>
                card.id === updatedCard.id ? updatedCard : card
            ));
            // Se a atualização do card (ex: título) não afeta a ordem,
            // onUpdateColumn pode não precisar ser chamado, a menos que o pai precise saber do conteúdo do card.
        }
    };

    const handleCardDrop = async (dropResult) => {
        // Adicionando logs para debugging, conforme sugerido
        console.log(`--- Coluna ${column.name} (ID: ${column.id}) onDrop disparado ---`);
        console.log('dropResult:', JSON.parse(JSON.stringify(dropResult))); // Log profundo do dropResult
        if (dropResult.payload) {
            console.log('payload do card:', JSON.parse(JSON.stringify(dropResult.payload)));
            console.log('payload.columnId (origem):', dropResult.payload.columnId);
        }
        console.log('------------------------------------------------');


        if (dropResult.removedIndex === null && dropResult.addedIndex === null) {
            return; // Nenhum card foi movido ou adicionado a esta coluna
        }

        const currentCards = [...cards]; // Copia o estado atual dos cards desta coluna
        let newCards = [...currentCards];
        let cardMoved = dropResult.payload;

        // Card movido DESTA coluna
        if (dropResult.removedIndex !== null) {
            cardMoved = newCards.splice(dropResult.removedIndex, 1)[0];
        }

        // Card adicionado A ESTA coluna (seja da própria coluna ou de outra)
        if (dropResult.addedIndex !== null) {
            // Se o card veio de outra coluna, seu payload já é o cardMoved.
            // Se foi reordenado na mesma coluna, cardMoved foi pego do splice acima.
            // Precisamos garantir que o objeto cardMoved tenha o columnId correto se for de outra coluna.
            if (dropResult.payload && dropResult.payload.columnId !== column.id) { // Veio de outra coluna
                 cardMoved = { ...dropResult.payload, columnId: column.id };
            }
            newCards.splice(dropResult.addedIndex, 0, cardMoved);
        }
        
        setCards(newCards); // Atualiza o estado local dos cards imediatamente para feedback visual

        try {
            // Se o card foi movido para uma coluna diferente
            if (dropResult.payload && dropResult.payload.columnId && dropResult.payload.columnId !== column.id) {
                // 1. Atualizar o columnId do card no backend para o ID desta coluna (destino)
                console.log(`Atualizando card ${cardMoved.id} para columnId ${column.id}`);
                await axios.put(`${apiUrl}/tasks/${cardMoved.id}`, {
                    columnId: column.id
                });

                // 2. (Opcional, mas no código original) Tentar atualizar o cardOrder da COLUNA DE ORIGEM
                // Esta parte é delicada e pode ser melhor gerenciada centralizadamente ou pelo próprio manipulador onDrop da coluna de origem.
                // Mantendo a lógica original com correções:
                const sourceColumnId = dropResult.payload.columnId; // ID da coluna de onde o card veio
                if (sourceColumnId) {
                    console.log(`Tentando atualizar cardOrder da coluna de origem ${sourceColumnId}`);
                    try {
                        const sourceColumnResponse = await axios.get(`${apiUrl}/columns/${sourceColumnId}`);
                        const sourceColumnData = sourceColumnResponse.data; // Modo correto de obter os dados

                        if (sourceColumnData && sourceColumnData.cardOrder) {
                            let currentSourceCardOrder = sourceColumnData.cardOrder;
                            // Parse se for string
                            if (typeof currentSourceCardOrder === 'string') {
                                try {
                                    currentSourceCardOrder = JSON.parse(currentSourceCardOrder);
                                } catch (e) {
                                    console.error(`Erro ao fazer parse do cardOrder da coluna de origem ${sourceColumnId}:`, e, sourceColumnData.cardOrder);
                                    currentSourceCardOrder = []; // Fallback
                                }
                            }
                            // Garante que é um array
                            if (!Array.isArray(currentSourceCardOrder)) {
                                console.warn(`cardOrder da coluna de origem ${sourceColumnId} não é um array após o parse:`, currentSourceCardOrder);
                                currentSourceCardOrder = []; // Fallback
                            }

                            const updatedSourceCardOrder = currentSourceCardOrder.filter(id => id !== cardMoved.id);
                            await axios.put(`${apiUrl}/columns/${sourceColumnId}`, {
                                cardOrder: JSON.stringify(updatedSourceCardOrder) // Backend espera string JSON
                            });
                            console.log(`cardOrder da coluna de origem ${sourceColumnId} atualizado.`);
                        } else {
                            console.warn(`Coluna de origem ${sourceColumnId} não encontrada ou não possui cardOrder.`);
                        }
                    } catch (err) {
                        console.error(`Erro ao buscar ou atualizar a coluna de origem ${sourceColumnId}:`, err.response ? err.response.data : err.message);
                    }
                }
            }

            // 3. Atualizar o cardOrder DESTA coluna (seja ela origem ou destino) no backend
            const finalCardOrderForThisColumn = newCards.map(c => c.id);
            console.log(`Atualizando cardOrder da coluna ${column.id} para:`, finalCardOrderForThisColumn);
            await axios.put(`${apiUrl}/columns/${column.id}`, {
                cardOrder: JSON.stringify(finalCardOrderForThisColumn) // Backend espera string JSON
            });

            // 4. Notificar o componente pai sobre a atualização desta coluna
            onUpdateColumn({
                ...column,
                cards: newCards,
                cardOrder: finalCardOrderForThisColumn
            });

        } catch (error) {
            console.error('Erro ao processar o drop do card:', error.response ? error.response.data : error.message);
            // Reverter para o estado anterior dos cards DESTA coluna em caso de erro na API.
            setCards(currentCards); 
            // Seria ideal também notificar o pai para reverter, ou o pai ter uma cópia do estado anterior.
            // Exemplo: onUpdateColumn({ ...column, cardOrder: currentCards.map(c=>c.id), cards: currentCards });
        }
    };


    return (
        <>
            <div className="column">
                <header className="column-drag-handle" onClick={handleClickOutside}>
                    <div className="column-name">
                        {isEditing ? (
                            <Form.Control
                                size="sm"
                                type="text"
                                value={nomeColumn}
                                className='customize-input-column'
                                onChange={(event) => setNameColumn(event.target.value)}
                                onBlur={handleEditColumn}
                                onKeyPress={(e) => e.key === 'Enter' && handleEditColumn()}
                                spellCheck="false"
                                ref={inputRef}
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <div className="column-title" onClick={(e) => {e.stopPropagation(); handleEditClick(e);}}>
                                {nomeColumn}
                                {isLoadingEdit && <LoadingSpinner size="sm" />}
                            </div>
                        )}
                    </div>
                    <div className="column-dropdown">
                        <Dropdown show={showDropdown} onToggle={(isOpen) => {
                            setShowDropdown(isOpen);
                        }}>
                            <Dropdown.Toggle
                                variant=""
                                id="dropdown-basic"
                                size='sm'
                                className="dropdown-btn-customize"
                            >
                                <FontAwesomeIcon icon={faEllipsisH} />
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item onClick={(e) => handleEditClick(e)} disabled={isLoadingEdit}>
                                    {isLoadingEdit ? <LoadingSpinner size="sm" /> : 'Editar coluna'}
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
                    <Container
                        groupName="cards" // Essencial para drag-and-drop entre colunas
                        onDrop={handleCardDrop}
                        getChildPayload={index => cards[index]} 
                        dragClass="card-ghost"
                        dropClass="card-ghost-drop"
                        dropPlaceholder={{
                            animationDuration: 150,
                            showOnTop: true,
                            className: 'card-drop-preview'
                        }}
                        autoScrollEnabled={true}
                    >
                        {isLoadingCards ? (
                            <div className="loading-cards">
                                <LoadingSpinner />
                            </div>
                        ) : (
                            cards && cards.length > 0 && cards.map((card, index) => (
                                <Draggable key={card.id}>
                                    <Card
                                        card={card}
                                        isFirstCard={index === 0} // só se quiser que apareça a imagem no primeiro card
                                        onUpdateCard={handleUpdateCard} // Para o Card atualizar/deletar a si mesmo
                                    />
                                </Draggable>
                            ))
                        )}
                         {!isLoadingCards && cards.length === 0 && !isShowAddNewCard && (
                            <div className="no-cards-message">Nenhum card nesta coluna.</div>
                        )}
                    </Container>
                    {isShowAddNewCard && (
                        <div className="add-new-card">
                            <textarea
                                rows={3} // Aumentado para melhor usabilidade
                                className='form-control'
                                placeholder="Digite um nome para este card..."
                                ref={textAreaRef}
                                value={valueTextArea}
                                onChange={(event) => setValueTextArea(event.target.value)}
                                disabled={isLoadingAdd}
                            />
                            <div className="group-btn">
                                <button
                                    className='btn btn-primary btn-sm'
                                    onClick={handleAddNewCard}
                                    disabled={isLoadingAdd || !valueTextArea.trim()}
                                >
                                    {isLoadingAdd ? <LoadingSpinner size="sm" /> : 'Adicionar card'}
                                </button>
                                <FontAwesomeIcon
                                    icon={faClose}
                                    className='add-icon'
                                    onClick={() => {
                                        if (!isLoadingAdd) {
                                            setIsShowAddNewCard(false);
                                            setValueTextArea('');
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
                {!isShowAddNewCard && (
                    <footer>
                        <div
                            className='footer-action'
                            onClick={() => setIsShowAddNewCard(true)}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            Adicionar outro card
                        </div>
                    </footer>
                )}
            </div>
            <ConfirmModal
                show={isShowModalDelete}
                title="Excluir Coluna"
                content={`Tem certeza que deseja excluir a coluna: <strong>${column.name}</strong>? Todos os cards contidos nela também serão excluídos. Esta ação não pode ser desfeita.`}
                onAction={onModalAction}
            />
            {/* Mensagens de loading/error para tasks gerais, se relevantes para este componente */}
            {/* {loading && <p className="text-center text-gray-600">Carregando tarefas gerais...</p>} */}
            {/* {error && <p className="text-center text-red-500 bg-red-100 p-3 rounded-md">{error}</p>} */}
        </>
    )
}

export default Column;