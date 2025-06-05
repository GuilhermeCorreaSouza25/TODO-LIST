// src/components/Common/CardModal.js
import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import LoadingSpinner from './LoadingSpinner'; // Adjust path if needed

const CardModal = ({ show, onHide, onSubmit, cardData, isLoading, modalTitlePrefix = "Card" }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const titleInputRef = useRef(null);

    useEffect(() => {
        if (show) { // Only update form when modal becomes visible or cardData changes
            if (cardData) {
                setTitle(cardData.title || '');
                setDescription(cardData.description || '');
                // Ensure dueDate from backend (which might be DATETIME) is formatted for <input type="date">
                setDueDate(cardData.dueDate ? new Date(cardData.dueDate).toISOString().split('T')[0] : '');
            } else {
                setTitle('');
                setDescription('');
                setDueDate('');
            }
            // Focus title input when modal opens
            setTimeout(() => titleInputRef.current?.focus(), 100);
        }
    }, [cardData, show]);

    const handleSubmitInternal = () => {
        if (!title.trim()) {
            alert('Por favor, insira um título para o card.');
            titleInputRef.current?.focus();
            return;
        }
        onSubmit({ title: title.trim(), description: description.trim(), dueDate: dueDate || null });
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
                    <Form.Group className="mb-3" controlId="cardModalDescription">
                        <Form.Label>Descrição</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            placeholder="Digite a descrição (opcional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="cardModalDueDate">
                        <Form.Label>Data de Vencimento</Form.Label>
                        <Form.Control
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
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