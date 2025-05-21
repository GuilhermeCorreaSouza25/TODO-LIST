import './Card.scss';
import imgDesign from '../../assets/img-design.png';

const Card = ({ card, isFirstCard }) => {
    return (
        <li className="card-item">
            {isFirstCard && <img src={imgDesign} alt="img-design" />}
            {card.title}
        </li>
    );
}

export default Card;