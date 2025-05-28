import React, { useState, useRef, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faPaperclip, faEllipsisH, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import Form from 'react-bootstrap/Form';
import axios from 'axios';
import './Card.scss';

const Card = ({ card, index, onEdit, onDelete }) => {
    const [isActionsExpanded, setIsActionsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(card.title);
    const inputRef = useRef(null);
    const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();
    const isDueSoon = card.dueDate && !isOverdue && new Date(card.dueDate) - new Date() < 24 * 60 * 60 * 1000;
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleActionsClick = (e) => {
        e.stopPropagation();
        setIsActionsExpanded(!isActionsExpanded);
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        setIsActionsExpanded(false);
        setIsEditing(true);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        setIsActionsExpanded(false);
        onDelete(card);
    };

    const handleTitleChange = (e) => {
        setEditedTitle(e.target.value);
    };

    const handleTitleSubmit = async () => {
        if (editedTitle.trim() === '') {
            setEditedTitle(card.title);
            setIsEditing(false);
            return;
        }

        if (editedTitle !== card.title) {
            try {
                const response = await axios.put(`${apiUrl}/cards/${card.id}`, {
                    title: editedTitle
                });
                onEdit(response.data);
            } catch (error) {
                console.error('Erro ao atualizar título do card:', error);
                setEditedTitle(card.title);
            }
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleTitleSubmit();
        } else if (e.key === 'Escape') {
            setEditedTitle(card.title);
            setIsEditing(false);
        }
    };

    return (
        <Draggable draggableId={card.id} index={index}>
            {(provided) => (
                <div
                    className="card"
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                >
                    <div className="card-content">
                        <div className="card-header">
                            <div className="card-title">
                                {isEditing ? (
                                    <Form.Control
                                        size="sm"
                                        type="text"
                                        value={editedTitle}
                                        onChange={handleTitleChange}
                                        onBlur={handleTitleSubmit}
                                        onKeyDown={handleKeyDown}
                                        ref={inputRef}
                                        className="card-title-input"
                                    />
                                ) : (
                                    <div onClick={handleEdit}>{card.title}</div>
                                )}
                            </div>
                            <div className="card-actions">
                                <button onClick={handleActionsClick}>
                                    <FontAwesomeIcon icon={faEllipsisH} />
                                </button>
                                {isActionsExpanded && (
                                    <div className="card-actions-expanded">
                                        <button onClick={handleEdit}>
                                            <FontAwesomeIcon icon={faEdit} />
                                            Editar
                                        </button>
                                        <button onClick={handleDelete} className="delete">
                                            <FontAwesomeIcon icon={faTrash} />
                                            Deletar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {card.description && (
                            <div className="card-description">{card.description}</div>
                        )}
                        
                        <div className="card-footer">
                            {card.dueDate && (
                                <div className={`card-date ${isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : ''}`}>
                                    <FontAwesomeIcon icon={faClock} />
                                    <span>{new Date(card.dueDate).toLocaleDateString()}</span>
                                </div>
                            )}
                            {card.attachments && card.attachments.length > 0 && (
                                <div className="card-attachments">
                                    <FontAwesomeIcon icon={faPaperclip} />
                                    <span>{card.attachments.length}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default Card;