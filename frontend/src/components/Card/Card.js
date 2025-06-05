import './Card.scss';
import imgDesign from '../../assets/img-design.png';
import axios from 'axios';
import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCalendarAlt, faAlignLeft } from '@fortawesome/free-solid-svg-icons'; // Adicionei ícones para data e descrição
import ConfirmModal from '../Common/ConfirmModal';
import LoadingSpinner from '../Common/LoadingSpinner';
import { MODAL_ACTION_CLOSE, MODAL_ACTION_CONFIRM } from '../../utilities/constant';
import { Form } from 'react-bootstrap';
import CardModal from '../Common/cardModal';

const apiUrl = process.env.REACT_APP_API_URL;

const Card = ({ card, isFirstCard, onUpdateCard, onEditRequest }) => { 
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(card.title); // Para edição inline do título
    const [isLoading, setIsLoading] = useState(false);
    const [showModalDelete, setShowModalDelete] = useState(false);
    const [showCardEditModal, setShowCardEditModal] = useState(false);
    const [isLoadingCardEdit, setIsLoadingCardEdit] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isEditingTitle && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditingTitle]);

    // Atualiza o estado 'title' se a prop 'card.title' mudar externamente
    useEffect(() => {
        setTitle(card.title);
    }, [card.title]);

    const handleSaveTitle = async () => {
        if (!isEditingTitle) return;
        const trimmedTitle = title.trim();
        if (trimmedTitle === '' || trimmedTitle === card.title) {
            setTitle(card.title);
            setIsEditingTitle(false);
            return;
        }
        setIsLoading(true);
        try {
            const response = await axios.put(`${apiUrl}/tasks/${card.id}`, { title: trimmedTitle });
            onUpdateCard({ ...card, title: response.data.title || trimmedTitle }); 
        } catch (error) {
            console.error("Erro ao editar título do card:", error);
            setTitle(card.title);
        } finally {
            setIsLoading(false);
            setIsEditingTitle(false);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            await axios.delete(`${apiUrl}/tasks/${card.id}`);
            onUpdateCard({ ...card, _destroy: true });
        } catch (err) {
            console.error("Erro ao excluir card:", err);
        } finally {
            setIsLoading(false);
            setShowModalDelete(false);
        }
    };

    const handleEnableEditTitle = (e) => {
        e.stopPropagation();
        setIsEditingTitle(true);
    };

    const handleRequestDelete = (e) => {
        e.stopPropagation();
        setShowModalDelete(true);
    };

    const onConfirmDeleteModalAction = (type) => {
        if (type === MODAL_ACTION_CLOSE) setShowModalDelete(false);
        if (type === MODAL_ACTION_CONFIRM) handleDelete();
    };

    const handleOpenCardEditModal = (e) => {
        if (e) e.stopPropagation(); // e pode não existir se chamado de outro lugar
        setShowCardEditModal(true);
    };

    const handleCloseCardEditModal = () => {
        setShowCardEditModal(false);
    };

    const handleSubmitCardEditModal = async (formData) => {
        setIsLoadingCardEdit(true);
        try {
            const payloadToUpdate = {
                title: formData.title,
                // Corrigido para 'descricao' como é mais comum, e 'data_fim'
                descricao: formData.descricao, // Assumindo que o CardModal usa 'descricao'
                data_fim: formData.data_fim || null,      // Assumindo que o CardModal usa 'data_fim'
            };
            // Se seu backend usa 'descricao' e 'data_fim', ajuste aqui:
            // descricao: formData.descricao,
            // data_fim: formData.data_fim || null,


            const response = await axios.put(`${apiUrl}/tasks/${card.id}`, payloadToUpdate);
            const updatedCardFromApi = response.data;

            const finalUpdatedCard = {
                ...card,
                ...updatedCardFromApi,
                title: updatedCardFromApi.title !== undefined ? updatedCardFromApi.title : formData.title,
                descricao: updatedCardFromApi.descricao !== undefined ? updatedCardFromApi.descricao : formData.descricao,
                data_fim: updatedCardFromApi.data_fim !== undefined ? updatedCardFromApi.data_fim : (formData.data_fim || null),
            };
            
            onUpdateCard(finalUpdatedCard);
            // Atualiza o estado local do título também, caso tenha sido alterado no modal
            if (finalUpdatedCard.title !== title) {
                setTitle(finalUpdatedCard.title);
            }
            handleCloseCardEditModal();
        } catch (err) {
            console.error("Erro ao atualizar card via modal:", err.response ? err.response.data : err.message);
            alert('Erro ao atualizar card. Por favor, tente novamente.');
        } finally {
            setIsLoadingCardEdit(false);
        }
    };

    // Função para formatar a data
    const formatDate = (dateString) => {
        if (!dateString) return null;
        // Adicionar + 'T00:00:00' se a data for apenas YYYY-MM-DD para evitar problemas de fuso horário com toLocaleDateString
        // ou usar uma biblioteca de datas para formatação mais robusta.
        // Se a data já incluir informações de hora/fuso, isso pode não ser necessário.
        const date = new Date(dateString);
         // Verifica se a data é válida antes de formatar
        if (isNaN(date.getTime())) {
            return "Data inválida";
        }
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <>
            <div className={`card-item ${isLoading ? 'is-loading-inline' : ''}`}>
                { card.cover ?
                    <img src={card.cover} alt='card cover' onMouseDown={event => event.preventDefault()}/>
                    : (isFirstCard && imgDesign && <img src={imgDesign} alt='default design' onMouseDown={event => event.preventDefault()}/>)
                }
                <div className="card-main-content"> {/* Renomeado para diferenciar da área de detalhes */}
                    {isEditingTitle ? (
                        <Form.Control
                            size="sm"
                            type="text"
                            value={title} // Usa o estado 'title' para edição
                            className='customize-input-card'
                            onChange={(event) => setTitle(event.target.value)}
                            onBlur={handleSaveTitle}
                            onKeyPress={(e) => { if (e.key === 'Enter') handleSaveTitle();}}
                            onMouseDown={(event) => event.preventDefault()}
                            ref={inputRef}
                            spellCheck="false"
                        />
                    ) : (
                        <>  
                            <div className="card-title" onClick={handleEnableEditTitle}> 
                                {card.title} {/* Exibe card.title (prop) */}
                            </div>
                                    
                            <div className="card-actions-icons">
                                <button 
                                    className="card-action-icon-button" 
                                    onClick={handleOpenCardEditModal}
                                    disabled={isLoading || isEditingTitle} 
                                    title="Editar card (detalhes)"
                                >
                                    <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button 
                                    className="card-action-icon-button delete-card-btn" 
                                    onClick={handleRequestDelete} 
                                    disabled={isLoading || isEditingTitle}
                                    title="Excluir card"
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
                
                {!isEditingTitle && (card.descricao || card.data_fim) && (
                    <div className="card-additional-details">
                        {card.descricao && (
                            <div className="card-detail-item card-descricao-text">
                                <FontAwesomeIcon icon={faAlignLeft} className="card-detail-icon" />
                                <p>{card.descricao}</p>
                            </div>
                        )}
                        {card.data_fim && (
                            <div className="card-detail-item card-due-date">
                                <FontAwesomeIcon icon={faCalendarAlt} className="card-detail-icon"/>
                                <p>{formatDate(card.data_fim)}</p>
                            </div>
                        )}
                    </div>
                )}
                
                {isLoading && isEditingTitle && <div className="card-loading-overlay"><LoadingSpinner size="sm" /></div>}
            </div>
            
            <ConfirmModal
                show={showModalDelete}
                title="Excluir Card"
                content={`Tem certeza que deseja excluir o card: <b>${card.title}</b>? Esta ação não pode ser desfeita.`}
                onAction={onConfirmDeleteModalAction}
                isLoading={isLoading} 
            />

            {showCardEditModal && (
                <CardModal
                    show={showCardEditModal}
                    onHide={handleCloseCardEditModal}
                    onSubmit={handleSubmitCardEditModal}
                    cardData={card} 
                    isLoading={isLoadingCardEdit}
                    modalTitlePrefix="Editar Card"
                />
            )}
        </>
    );
}

export default Card;