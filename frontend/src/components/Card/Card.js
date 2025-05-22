import './Card.scss';
import imgDesign from '../../assets/img-design.png';

const Card = ({ card, isFirstCard }, props) => {
    return (
        <div className="card-item">
            {isFirstCard && <img src={imgDesign} alt="img-design" />}
            {card.title}
        </div>
    );
}

export default Card;