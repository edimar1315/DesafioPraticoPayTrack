'use strict';

/**
 * Testes de integração do UserRepository.
 * Usa sql.js com banco em memória (sem arquivo em disco) para isolar
 * cada suite completamente — sem mocks de BD, testando SQL de verdade.
 */
const initSqlJs = require('sql.js');
const UserRepository = require('../../src/infrastructure/database/UserRepository');

// -------------------------------------------------------------------
// Fixture de User (simula instância da entidade de domínio)
// -------------------------------------------------------------------
function makeUser(overrides = {}) {
    return {
        firstName: 'Maria',
        lastName: 'Oliveira',
        fullName: 'Maria Oliveira',
        email: 'maria@exemplo.com',
        gender: 'female',
        age: 28,
        dateOfBirth: '1996-05-10T00:00:00.000Z',
        phone: '11-91111-2222',
        country: 'Brasil',
        city: 'Campinas',
        state: 'SP',
        picture: 'https://randomuser.me/api/portraits/women/5.jpg',
        nationality: 'BR',
        ...overrides,
    };
}

// -------------------------------------------------------------------
// Setup: banco in-memory fresco para cada describe-block
// -------------------------------------------------------------------
let db;
let repo;

beforeEach(async () => {
    const SQL = await initSqlJs();
    db = new SQL.Database();
    repo = new UserRepository(db);
});

afterEach(() => {
    db.close();
});

// -------------------------------------------------------------------
// Schema / Inicialização
// -------------------------------------------------------------------
describe('UserRepository — inicialização', () => {
    it('cria a tabela users automaticamente no construtor', () => {
        const rows = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
        expect(rows).toHaveLength(1);
    });

    it('cria o índice idx_users_email automaticamente', () => {
        const rows = db.exec("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_users_email'");
        expect(rows).toHaveLength(1);
    });
});

// -------------------------------------------------------------------
// insert()
// -------------------------------------------------------------------
describe('UserRepository — insert()', () => {
    it('persiste um usuário e count() retorna 1', () => {
        repo.insert(makeUser());
        expect(repo.count()).toBe(1);
    });

    it('lança erro ao inserir e-mail duplicado (UNIQUE constraint)', () => {
        repo.insert(makeUser());
        expect(() => repo.insert(makeUser())).toThrow();
    });

    it('persiste dois usuários com e-mails distintos sem erro', () => {
        repo.insert(makeUser({ email: 'a@exemplo.com' }));
        repo.insert(makeUser({ email: 'b@exemplo.com' }));
        expect(repo.count()).toBe(2);
    });
});

// -------------------------------------------------------------------
// findByEmail()
// -------------------------------------------------------------------
describe('UserRepository — findByEmail()', () => {
    it('retorna objeto com id quando o e-mail existe', () => {
        repo.insert(makeUser());
        const found = repo.findByEmail('maria@exemplo.com');
        expect(found).not.toBeNull();
        expect(found).toHaveProperty('id');
    });

    it('retorna null quando o e-mail não existe', () => {
        const found = repo.findByEmail('naoexiste@exemplo.com');
        expect(found).toBeNull();
    });

    it('a busca é case-sensitive (e-mail diferente não é encontrado)', () => {
        repo.insert(makeUser());
        const found = repo.findByEmail('MARIA@EXEMPLO.COM');
        // SQLite TEXT comparison é case-sensitive por padrão para ASCII
        expect(found).toBeNull();
    });
});

// -------------------------------------------------------------------
// update()
// -------------------------------------------------------------------
describe('UserRepository — update()', () => {
    it('atualiza os dados de um usuário existente', () => {
        repo.insert(makeUser());
        repo.update(makeUser({ firstName: 'Mariana', age: 29 }));

        // Confirma que ainda há apenas 1 registro
        expect(repo.count()).toBe(1);

        // Verifica os dados atualizados diretamente via SQL
        const rows = db.exec("SELECT first_name, age FROM users WHERE email = 'maria@exemplo.com'");
        const row = rows[0].values[0];
        expect(row[0]).toBe('Mariana');
        expect(row[1]).toBe(29);
    });

    it('não cria novo registro quando o e-mail não existe (UPDATE sem match)', () => {
        repo.update(makeUser({ email: 'fantasma@exemplo.com' }));
        expect(repo.count()).toBe(0);
    });
});

// -------------------------------------------------------------------
// count()
// -------------------------------------------------------------------
describe('UserRepository — count()', () => {
    it('retorna 0 quando a tabela está vazia', () => {
        expect(repo.count()).toBe(0);
    });

    it('retorna o número correto após múltiplas inserções', () => {
        repo.insert(makeUser({ email: 'u1@exemplo.com' }));
        repo.insert(makeUser({ email: 'u2@exemplo.com' }));
        repo.insert(makeUser({ email: 'u3@exemplo.com' }));
        expect(repo.count()).toBe(3);
    });
});
