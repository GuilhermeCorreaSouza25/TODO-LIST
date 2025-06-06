// src/components/Common/CardModal.js
import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import LoadingSpinner from './LoadingSpinner'; // Adjust path if needed


const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
        return new Date(dateString).toISOString().split('T')[0];
    } catch (e) { return ''; }
};


const CardModal = ({ show, onHide, onSubmit, cardData, isLoading, modalTitlePrefix = "Card" }) => {
    const [title, setTitle] = useState('');
    const [descricao, setDescricao] = useState('');
    const [dataFim, setDataFim] = useState('');
    const titleInputRef = useRef(null);

    useEffect(() => {
        if (show) { // Only update form when modal becomes visible or cardData changes
            if (cardData) {
                setTitle(cardData.title || '');
                setDescricao(cardData.descricao || '');
                // Ensure dataFim from backend (which might be DATETIME) is formatted for <input type="date">
                setDataFim(formatDateForInput(cardData.data_fim));
            }
            // } else {
            //     setTitle('');
            //     setDescricao('');
            //     setDataFim('');
            // }
            // // Focus title input when modal opens
            // setTimeout(() => titleInputRef.current?.focus(), 100);
        }
    }, [cardData, show]);

    const handleDateChange = (e) => {
        console.log('[MODAL-ETAPA 1] Input de data foi alterado. Novo valor:', e.target.value);
        setDataFim(e.target.value);
    };

    const handleSubmitInternal = () => {
        const formData = {
            title: title.trim(),
            descricao: descricao.trim(),
            data_fim: dataFim || null, // Ensure dataFim is null if empty
        }
        console.log('[MODAL-ETAPA 2] Enviando para o componente pai (Card.js):', formData);

        if (!title.trim()) {
            alert('Por favor, insira um título para o card.');
            titleInputRef.current?.focus();
            return;
        }
        // console.log('Valor do estado dataFim:', dataFim);
        onSubmit(formData);
    };

    const handleEnterPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey && title.trim()) {
             // Allow Shift+Enter for new lines in textarea, but Enter in title or single-line inputs submits.
            if (event.target.tagName.toLowerCase() !== 'textarea') {
                event.preventDefault();
                handleSubmitInternal();
            }
        }
    };


    return (
        <Modal show={show} onHide={onHide} backdrop="static" keyboard={false} onKeyDown={handleEnterPress}>
            <Modal.Header closeButton>
                <Modal.Title>{cardData ? `Editar ${modalTitlePrefix}` : `Adicionar Novo ${modalTitlePrefix}`}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3" controlId="cardModalTitle">
                        <Form.Label>Título do Card</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Digite o título do card"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            ref={titleInputRef}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="cardModaldescricao">
                        <Form.Label>Descrição</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            placeholder="Digite a descrição (opcional)"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="cardModaldataFim">
                        <Form.Label>Data de Vencimento</Form.Label>
                        <Form.Control
                            type="date"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={isLoading}>
                    Cancelar
                </Button>
                <Button variant="primary" onClick={handleSubmitInternal} disabled={isLoading || !title.trim()}>
                    {isLoading ? <LoadingSpinner size="sm" /> : (cardData ? 'Salvar Alterações' : 'Adicionar Card')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CardModal;