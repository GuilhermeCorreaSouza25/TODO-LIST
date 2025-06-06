import axios from 'axios';
import imgDesign from '../assets/img-design.png';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api'; // URL de exemplo

/**
 * BUSCA OS DADOS INICIAIS DA API
 */
export const fetchBoardDetails = async (boardId) => {
    try {
        // A lógica de busca pode ser otimizada para uma única chamada de API
        const response = await axios.get(`${apiUrl}/boards/${boardId}`);
        return response.data; // Assumindo que a API retorna o board com colunas e cards aninhados
    } catch (error) {
        console.error("Erro ao carregar dados do board:", error);
        return null;
    }
};

/**
 * CRIA UM NOVO CARD
 * @param {object} cardData - Dados do card a ser criado { title, descricao, data_fim, columnId, boardId }
 */
export const createNewCard = async (cardData) => {
    try {
        const response = await axios.post(`${apiUrl}/cards`, cardData);
        return response.data;
    } catch (error) {
        console.error("Erro ao criar novo card:", error);
        throw error;
    }
};

/**
 * ATUALIZA UM CARD EXISTENTE
 * @param {string} cardId - ID do card a ser atualizado
 * @param {object} updateData - Campos a serem atualizados { title, descricao, data_fim }
 */
export const updateCard = async (cardId, updateData) => {
    try {
        const response = await axios.put(`${apiUrl}/cards/${cardId}`, updateData);
        return response.data;
    } catch (error) {
        console.error("Erro ao atualizar card:", error);
        throw error;
    }
};


/**
 * DADOS MOCKADOS PARA DESENVOLVIMENTO
 * AGORA INCLUINDO OS NOVOS CAMPOS
 */
export const initDataMock = {
    boards: [
        {
            id:'board-1',
            columnOrder: ['column-1', 'column-2', 'column-3'],
            columns: [
                {
                    id: 'column-1',
                    boardId: 'board-1',
                    name: 'A Fazer',
                    cardOrder: ['card-1', 'card-2', 'card-3'],
                    cards:[
                        {
                            id: 'card-1',
                            boardId: 'board-1',
                            columnId: 'column-1',
                            title: 'Desenvolver a interface do usuário',
                            descricao: 'Criar a tela de login e o dashboard principal.',
                            data_fim: '2025-06-20',
                            image: imgDesign
                        },
                        {
                            id: 'card-2',
                            boardId: 'board-1',
                            columnId: 'column-1',
                            title: 'Configurar o banco de dados',
                            descricao: 'Instalar o MySQL e criar as tabelas iniciais.',
                            data_fim: null, // Sem data fim
                            image: null
                        },
                        {
                            id: 'card-3',
                            boardId: 'board-1',
                            columnId: 'column-1',
                            title: 'Reunião de alinhamento',
                            descricao: '', // Descrição vazia
                            data_fim: '2025-06-15',
                            image: null
                        }
                    ]
                },
            ]
        }
    ]
}