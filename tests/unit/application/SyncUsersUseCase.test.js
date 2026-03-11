'use strict';

const SyncUsersUseCase = require('../../../src/application/SyncUsersUseCase');

// -------------------------------------------------------------------
// Fixture: dado bruto válido de usuário adulto
// -------------------------------------------------------------------
const validRaw = {
    name: { first: 'Carlos', last: 'Ferreira' },
    email: 'carlos@exemplo.com',
    gender: 'male',
    dob: { age: 30, date: '1994-01-01T00:00:00.000Z' },
    phone: '21-98888-7777',
    location: { country: 'Brasil', city: 'RJ', state: 'RJ' },
    picture: { large: 'https://randomuser.me/api/portraits/men/1.jpg' },
    nat: 'BR',
};

const menorRaw = { ...validRaw, email: 'menor@exemplo.com', dob: { age: 17, date: '2009-01-01T00:00:00.000Z' } };
const invalidRaw = { ...validRaw, email: 'email-invalido', name: undefined };

// -------------------------------------------------------------------
// Helpers para criar mocks isolados por teste
// -------------------------------------------------------------------
function makeDeps(overrides = {}) {
    const apiClient = {
        fetchUsers: jest.fn().mockResolvedValue([]),
        ...overrides.apiClient,
    };
    const userRepository = {
        findByEmail: jest.fn().mockReturnValue(null),
        insert: jest.fn(),
        update: jest.fn(),
        ...overrides.userRepository,
    };
    return { apiClient, userRepository };
}

// -------------------------------------------------------------------
// Testes
// -------------------------------------------------------------------
describe('SyncUsersUseCase — execute()', () => {
    beforeEach(() => jest.clearAllMocks());

    // ---- Estrutura do resultado -----------------------------------
    it('retorna a estrutura completa de SyncResult', async () => {
        const { apiClient, userRepository } = makeDeps();
        apiClient.fetchUsers.mockResolvedValue([]);

        const useCase = new SyncUsersUseCase({ apiClient, userRepository });
        const result = await useCase.execute();

        expect(result).toMatchObject({
            total: expect.any(Number),
            added: expect.any(Number),
            updated: expect.any(Number),
            ignored: expect.any(Number),
            errors: expect.any(Array),
            startedAt: expect.any(String),
            finishedAt: expect.any(String),
        });
    });

    it('define total igual ao número de usuários retornados pela API', async () => {
        const { apiClient, userRepository } = makeDeps();
        apiClient.fetchUsers.mockResolvedValue([validRaw, validRaw]);

        const result = await new SyncUsersUseCase({ apiClient, userRepository }).execute();

        expect(result.total).toBe(2);
    });

    // ---- Inserção ------------------------------------------------
    it('insere usuário válido novo e incrementa added', async () => {
        const { apiClient, userRepository } = makeDeps();
        apiClient.fetchUsers.mockResolvedValue([validRaw]);
        userRepository.findByEmail.mockReturnValue(null); // não existe

        const result = await new SyncUsersUseCase({ apiClient, userRepository }).execute();

        expect(userRepository.insert).toHaveBeenCalledTimes(1);
        expect(userRepository.update).not.toHaveBeenCalled();
        expect(result.added).toBe(1);
        expect(result.updated).toBe(0);
    });

    // ---- Atualização ---------------------------------------------
    it('atualiza usuário existente e incrementa updated', async () => {
        const { apiClient, userRepository } = makeDeps();
        apiClient.fetchUsers.mockResolvedValue([validRaw]);
        userRepository.findByEmail.mockReturnValue({ id: 42 }); // já existe

        const result = await new SyncUsersUseCase({ apiClient, userRepository }).execute();

        expect(userRepository.update).toHaveBeenCalledTimes(1);
        expect(userRepository.insert).not.toHaveBeenCalled();
        expect(result.updated).toBe(1);
        expect(result.added).toBe(0);
    });

    // ---- Ignorados — menor de 18 ---------------------------------
    it('ignora menor de 18 anos sem registrar erro', async () => {
        const { apiClient, userRepository } = makeDeps();
        apiClient.fetchUsers.mockResolvedValue([menorRaw]);

        const result = await new SyncUsersUseCase({ apiClient, userRepository }).execute();

        expect(result.ignored).toBe(1);
        expect(result.errors).toHaveLength(0);
        expect(userRepository.insert).not.toHaveBeenCalled();
    });

    // ---- Ignorados — dados inválidos -----------------------------
    it('ignora usuário com dados inválidos e registra erro com motivo', async () => {
        const { apiClient, userRepository } = makeDeps();
        apiClient.fetchUsers.mockResolvedValue([invalidRaw]);

        const result = await new SyncUsersUseCase({ apiClient, userRepository }).execute();

        expect(result.ignored).toBe(1);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toMatchObject({
            email: expect.any(String),
            reason: expect.any(String),
        });
        expect(userRepository.insert).not.toHaveBeenCalled();
    });

    // ---- Erros de repositório ------------------------------------
    it('captura exceção do repositório, incrementa ignored e registra no errors', async () => {
        const { apiClient, userRepository } = makeDeps();
        apiClient.fetchUsers.mockResolvedValue([validRaw]);
        userRepository.findByEmail.mockReturnValue(null);
        userRepository.insert.mockImplementation(() => {
            throw new Error('Falha simulada no banco');
        });

        const result = await new SyncUsersUseCase({ apiClient, userRepository }).execute();

        expect(result.ignored).toBe(1);
        expect(result.errors[0].reason).toBe('Falha simulada no banco');
        expect(result.added).toBe(0);
    });

    // ---- Falha na API -------------------------------------------
    it('propaga erro quando a API falha (rejeita a promise)', async () => {
        const { apiClient, userRepository } = makeDeps();
        apiClient.fetchUsers.mockRejectedValue(new Error('Timeout de rede'));

        await expect(
            new SyncUsersUseCase({ apiClient, userRepository }).execute()
        ).rejects.toThrow('Timeout de rede');
    });

    // ---- Mix de casos -------------------------------------------
    it('processa corretamente um lote misto (válido + menor + inválido)', async () => {
        const { apiClient, userRepository } = makeDeps();
        apiClient.fetchUsers.mockResolvedValue([validRaw, menorRaw, invalidRaw]);
        userRepository.findByEmail.mockReturnValue(null);

        const result = await new SyncUsersUseCase({ apiClient, userRepository }).execute();

        expect(result.total).toBe(3);
        expect(result.added).toBe(1);
        expect(result.ignored).toBe(2);
        expect(result.errors).toHaveLength(1); // apenas o inválido gera erro
    });

    // ---- Timestamps ---------------------------------------------
    it('registra startedAt antes de finishedAt', async () => {
        const { apiClient, userRepository } = makeDeps();
        apiClient.fetchUsers.mockResolvedValue([]);

        const result = await new SyncUsersUseCase({ apiClient, userRepository }).execute();

        expect(new Date(result.startedAt).getTime()).toBeLessThanOrEqual(
            new Date(result.finishedAt).getTime()
        );
    });
});
