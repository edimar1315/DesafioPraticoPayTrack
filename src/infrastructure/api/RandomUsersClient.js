const axios = require('axios');
const config = require('../../config');

/**
 * Cliente responsável por consumir a RandomUser API.
 * Encapsula toda a lógica de comunicação HTTP, retry e validação
 * da estrutura da resposta.
 */
class RandomUserClient {
    constructor() {
        this.client = axios.create({
            baseURL: config.api.baseUrl,
            timeout: config.api.timeout,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'PayTrack-Sync/1.0',
            },
        });
    }

    /**
     * Busca a lista de usuários na API externa.
     * @returns {Promise<object[]>} Array com os dados brutos dos usuários
     * @throws {Error} Se a resposta estiver em formato inválido ou a requisição falhar
     */
    async fetchUsers() {
        let response;

        try {
            response = await this.client.get('/', {
                params: { results: config.api.results },
            });
        } catch (err) {
            if (err.response) {
                throw new Error(
                    `API retornou status ${err.response.status}: ${err.response.statusText}`
                );
            }
            if (err.code === 'ECONNABORTED') {
                throw new Error('Timeout: A API não respondeu dentro do tempo limite.');
            }
            throw new Error(`Erro de rede ao acessar a API: ${err.message}`);
        }

        if (!response.data?.results || !Array.isArray(response.data.results)) {
            throw new Error(
                'Resposta da API em formato inválido: campo "results" ausente ou não é um array.'
            );
        }

        return response.data.results;
    }
}

module.exports = RandomUserClient;
