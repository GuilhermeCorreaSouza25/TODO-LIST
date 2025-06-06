import './Card.scss';
import imgDesign from '../../assets/img-design.png';
import axios from 'axios';
import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCalendarAlt, faAlignLeft } from '@fortawesome/free-solid-svg-icons';
import ConfirmModal from '../Common/ConfirmModal';
import LoadingSpinner from '../Common/LoadingSpinner';
import { MODAL_ACTION_CONFIRM } from '../../utilities/constant';
import { Form } from 'react-bootstrap';
import CardModal from '../Common/cardModal';

const apiUrl = process.env.REACT_APP_API_URL;

const Card = ({ card, isFirstCard, onUpdateCard }) => { 
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(card.title);
    const [isLoading, setIsLoading] = useState(false);
    const [showModalDelete, setShowModalDelete] = useState(false);
    const [showCardEditModal, setShowCardEditModal] = useState(false);
    const [isLoadingCardEdit, setIsLoadingCardEdit] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isEditingTitle) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditingTitle]);

    useEffect(() => {
        setTitle(card.title);
    }, [card.title]);

    const handleSaveTitle = async () => {
        if (!isEditingTitle) return;
        const trimmedTitle = title.trim();
        setIsEditingTitle(false);
        if (trimmedTitle === '' || trimmedTitle === card.title) {
            setTitle(card.title);
            return;
        }
        setIsLoading(true);
        try {
            const response = await axios.put(`${apiUrl}/cards/${card.id}`, { title: trimmedTitle });
            onUpdateCard(response.data); 
        } catch (error) {
            console.error("Erro ao editar título do card:", error);
            setTitle(card.title); 
        } finally {
            setIsLoading(false);
        }
    };
    
    // ==================================================================
    // AQUI ESTÁ A FUNÇÃO CRÍTICA, AGORA NA VERSÃO CORRETA E FINAL
    // ==================================================================
    const handleSubmitCardEditModal = async (formData) => {
        setIsLoadingCardEdit(true);
        try {
            const payloadToUpdate = {
                title: formData.title,
                descricao: formData.descricao,
                data_fim: formData.data_fim || null, // Garante que a propriedade correta (data_fim) seja lida
            };

            const response = await axios.put(`${apiUrl}/cards/${card.id}`, payloadToUpdate);
            
            onUpdateCard(response.data);
            setShowCardEditModal(false);

        } catch (err) {
            console.error("Erro ao atualizar card via modal:", err);
            alert('Erro ao atualizar card. Por favor, tente novamente.');
        } finally {
            setIsLoadingCardEdit(false);
        }
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(`${dateString}T00:00:00`);
        if (isNaN(date.getTime())) return "Data inválida";
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            await axios.delete(`${apiUrl}/cards/${card.id}`);
            onUpdateCard({ ...card, _destroy: true });
        } catch (err) {
            console.error("Erro ao excluir card:", err);
        } finally {
            setIsLoading(false);
            setShowModalDelete(false);
        }
    };
    
    const onConfirmDeleteModalAction = (type) => {
        if (type === MODAL_ACTION_CONFIRM) handleDelete();
        else setShowModalDelete(false);
    };

    return (
        <>
            <div className={`card-item ${isLoading ? 'is-loading-inline' : ''}`}>
                { card.cover && <img src={card.cover} alt='card cover' onMouseDown={e => e.preventDefault()}/> }
                
                <div className="card-main-content">
                    {isEditingTitle ? (
                        <Form.Control
                            size="sm" type="text" value={title} className='customize-input-card'
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleSaveTitle}
                            onKeyPress={(e) => { if (e.key === 'Enter') handleSaveTitle();}}
                            onMouseDown={(e) => e.preventDefault()}
                            ref={inputRef} spellCheck="false"
                        />
                    ) : (
                        <div className="card-title-container"> 
                            <div className="card-title" onClick={() => setIsEditingTitle(true)}> 
                                {card.title}
                            </div>
                            <div className="card-actions-icons">
                                <button className="card-action-icon-button" onClick={() => setShowCardEditModal(true)} disabled={isLoading} title="Editar detalhes">
                                    <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button className="card-action-icon-button delete-card-btn" onClick={(e) => { e.stopPropagation(); setShowModalDelete(true); }} disabled={isLoading} title="Excluir card">
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                
                {!isEditingTitle && (card.descricao || card.data_fim) && (
                    <div className="card-additional-details">
                        {card.descricao && (
                            <div className="card-detail-item" title={card.descricao}>
                                <FontAwesomeIcon icon={faAlignLeft} className="card-detail-icon" />
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
            </div>
            
            <ConfirmModal
                show={showModalDelete}
                title="Excluir Card"
                content={`Tem certeza que deseja excluir o card: <b>${card.title}</b>?`}
                onAction={onConfirmDeleteModalAction}
                isLoading={isLoading} 
            />

            {showCardEditModal && (
                <CardModal
                    show={showCardEditModal}
                    onHide={() => setShowCardEditModal(false)}
                    onSubmit={handleSubmitCardEditModal} // AQUI a função corrigida é passada
                    cardData={card} 
                    isLoading={isLoadingCardEdit}
                    modalTitlePrefix="Editar Card"
                />
            )}
        </>
    );
}

export default Card;