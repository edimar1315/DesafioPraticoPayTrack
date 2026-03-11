'use strict';

// Mockamos o axios ANTES de importar o módulo que o usa
jest.mock('axios');
const axios = require('axios');
const RandomUsersClient = require('../../../src/infrastructure/api/RandomUsersClient');

// -------------------------------------------------------------------
// Fixture: resposta válida da API
// -------------------------------------------------------------------
const apiPayload = {
    data: {
        results: [
            { name: { first: 'Test', last: 'User' }, email: 'test@exemplo.com' },
        ],
    },
};

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------
function makeClient() {
    // axios.create() precisa retornar um objeto com método get
    const mockGet = jest.fn();
    axios.create.mockReturnValue({ get: mockGet });
    const client = new RandomUsersClient();
    return { client, mockGet };
}

// -------------------------------------------------------------------
// Testes
// -------------------------------------------------------------------
describe('RandomUsersClient — fetchUsers()', () => {
    beforeEach(() => jest.clearAllMocks());

    it('retorna o array de resultados da API em caso de sucesso', async () => {
        const { client, mockGet } = makeClient();
        mockGet.mockResolvedValue(apiPayload);

        const users = await client.fetchUsers();

        expect(users).toEqual(apiPayload.data.results);
        expect(users).toHaveLength(1);
    });

    it('passa os params corretos (results = config.api.results) para o GET', async () => {
        const { client, mockGet } = makeClient();
        mockGet.mockResolvedValue(apiPayload);

        await client.fetchUsers();

        expect(mockGet).toHaveBeenCalledWith('/', expect.objectContaining({
            params: expect.objectContaining({ results: expect.any(Number) }),
        }));
    });

    it('lança erro descritivo quando a API retorna status HTTP de erro', async () => {
        const { client, mockGet } = makeClient();
        const httpError = new Error('Request failed');
        httpError.response = { status: 503, statusText: 'Service Unavailable' };
        mockGet.mockRejectedValue(httpError);

        await expect(client.fetchUsers()).rejects.toThrow('API retornou status 503');
    });

    it('lança erro de timeout quando code === ECONNABORTED', async () => {
        const { client, mockGet } = makeClient();
        const timeoutError = new Error('timeout');
        timeoutError.code = 'ECONNABORTED';
        mockGet.mockRejectedValue(timeoutError);

        await expect(client.fetchUsers()).rejects.toThrow('Timeout');
    });

    it('lança erro de rede genérico para outros erros sem response', async () => {
        const { client, mockGet } = makeClient();
        mockGet.mockRejectedValue(new Error('ENOTFOUND'));

        await expect(client.fetchUsers()).rejects.toThrow('Erro de rede ao acessar a API');
    });

    it('lança erro quando response.data.results está ausente', async () => {
        const { client, mockGet } = makeClient();
        mockGet.mockResolvedValue({ data: {} }); // sem "results"

        await expect(client.fetchUsers()).rejects.toThrow('formato inválido');
    });

    it('lança erro quando response.data.results não é um array', async () => {
        const { client, mockGet } = makeClient();
        mockGet.mockResolvedValue({ data: { results: 'não é array' } });

        await expect(client.fetchUsers()).rejects.toThrow('formato inválido');
    });
});
