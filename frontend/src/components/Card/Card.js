import './Card.scss';
import imgDesign from '../../assets/img-design.png';
import axios from 'axios';
import { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import Dropdown from 'react-bootstrap/Dropdown';
import ConfirmModal from '../Common/ConfirmModal';
import LoadingSpinner from '../Common/LoadingSpinner';
import { MODAL_ACTION_CLOSE, MODAL_ACTION_CONFIRM } from '../../utilities/constant';
import { Form } from 'react-bootstrap';

const apiUrl = process.env.REACT_APP_API_URL;

const Card = ({ card, isFirstCard, onUpdateCard }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(card.title);
    const [isLoading, setIsLoading] = useState(false);
    const [showModalDelete, setShowModalDelete] = useState(false);
    const inputRef = useRef(null);

    const handleEdit = async () => {
        if (title.trim() === '') {
            setTitle(card.title);
            setIsEditing(false);
            return;
        }

        setIsLoading(true);
        try {
            await axios.put(`${apiUrl}/tasks/${card.id}`, { title });
            onUpdateCard({ ...card, title });
        } catch (error) {
            console.error("Erro ao editar card:", error);
        } finally {
            setIsLoading(false);
            setIsEditing(false);
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

    const handleEditClick = () => {
        setIsEditing(true);
        // Usar setTimeout para garantir que o input esteja renderizado antes de focar
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 0);
    };

    const onModalAction = (type) => {
        if (type === MODAL_ACTION_CLOSE) {
            setShowModalDelete(false);
        }
        if (type === MODAL_ACTION_CONFIRM) {
            handleDelete();
        }
    };

    return (
        <>
            <div className="card-item">
                {isFirstCard && <img src={imgDesign} alt="img-design" onMouseDown={event => event.preventDefault()}/>}
                <div className="card-content">
                    {isEditing ? (
                        <Form.Control
                            size="sm"
                            type="text"
                            value={title}
                            className='customize-input-card'
                            onClick={handleEditClick}
                            onChange={(event) => setTitle(event.target.value)}
                            spellCheck="false"
                            onBlur={handleEdit}
                            onMouseDown={(event) => event.preventDefault()}
                            ref={inputRef}
                        />
                    ) : (
                        <div className="card-title" onClick={handleEditClick}>{card.title}</div>
                    )}
                    <div className="card-actions">
                        <Dropdown>
                            <Dropdown.Toggle
                                variant=""
                                id="dropdown-basic"
                                size='sm'
                            >
                                <FontAwesomeIcon icon={faEllipsisH} />
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item onClick={handleEditClick} disabled={isLoading}>
                                    <FontAwesomeIcon icon={faEdit} /> Editar
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => setShowModalDelete(true)} disabled={isLoading}>
                                    {isLoading ? <LoadingSpinner /> : 'Excluir card'}
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </div>
            </div>
            <ConfirmModal
                show={showModalDelete}
                title="Excluir Card"
                content={`Tem certeza que deseja excluir o card: <b>${card.title}</b>? Esta ação não pode ser desfeita.`}
                onAction={onModalAction}
            />
        </>
    );
}

export default Card;