import './Task.scss';
import imgDesign from '../../assets/img-design.png';

const Task = () => {
    
    return (
        <>
            <li className="task-item">
                <img src={imgDesign} alt="img-design" />
                Design & Research
            </li>
        </>
    )
}

export default Task;