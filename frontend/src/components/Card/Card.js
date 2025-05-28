import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faPaperclip, faEllipsisH, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import './Card.scss';

const Card = ({ card, index, onEdit, onDelete }) => {
    const [isActionsExpanded, setIsActionsExpanded] = useState(false);
    const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();
    const isDueSoon = card.dueDate && !isOverdue && new Date(card.dueDate) - new Date() < 24 * 60 * 60 * 1000;

    const handleActionsClick = (e) => {
        e.stopPropagation();
        setIsActionsExpanded(!isActionsExpanded);
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        setIsActionsExpanded(false);
        onEdit(card);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        setIsActionsExpanded(false);
        onDelete(card);
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
                            <div className="card-title">{card.title}</div>
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