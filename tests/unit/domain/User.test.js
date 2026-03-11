'use strict';

const User = require('../../../src/domain/Users');

// -------------------------------------------------------------------
// Fixture: dados brutos válidos simulando resposta do RandomUser API
// -------------------------------------------------------------------
const validRaw = {
    name: { first: 'Ana', last: 'Silva' },
    email: 'ana.silva@exemplo.com',
    gender: 'female',
    dob: { age: 25, date: '1999-03-01T00:00:00.000Z' },
    phone: '11-99999-9999',
    location: { country: 'Brasil', city: 'São Paulo', state: 'SP' },
    picture: { large: 'https://randomuser.me/api/portraits/women/1.jpg' },
    nat: 'BR',
};

// -------------------------------------------------------------------
// Construção da entidade
// -------------------------------------------------------------------
describe('User — construção', () => {
    it('normaliza o e-mail para letras minúsculas e sem espaços', () => {
        const raw = { ...validRaw, email: '  ANA.SILVA@EXEMPLO.COM  ' };
        const user = new User(raw);
        expect(user.email).toBe('ana.silva@exemplo.com');
    });

    it('compõe fullName a partir de first e last', () => {
        const user = new User(validRaw);
        expect(user.fullName).toBe('Ana Silva');
    });

    it('usa string vazia como fallback quando name está ausente', () => {
        const user = new User({ ...validRaw, name: undefined });
        expect(user.firstName).toBe('');
        expect(user.lastName).toBe('');
        expect(user.fullName).toBe('');
    });

    it('usa 0 como fallback de age quando dob está ausente', () => {
        const user = new User({ ...validRaw, dob: undefined });
        expect(user.age).toBe(0);
    });

    it('mapeia todos os campos esperados corretamente', () => {
        const user = new User(validRaw);
        expect(user.gender).toBe('female');
        expect(user.phone).toBe('11-99999-9999');
        expect(user.country).toBe('Brasil');
        expect(user.city).toBe('São Paulo');
        expect(user.state).toBe('SP');
        expect(user.nationality).toBe('BR');
        expect(user.picture).toBe('https://randomuser.me/api/portraits/women/1.jpg');
        expect(user.dateOfBirth).toBe('1999-03-01T00:00:00.000Z');
    });
});

// -------------------------------------------------------------------
// isValid()
// -------------------------------------------------------------------
describe('User — isValid()', () => {
    it('retorna true para dados completos e válidos', () => {
        expect(new User(validRaw).isValid()).toBe(true);
    });

    it('retorna false quando e-mail está ausente', () => {
        const user = new User({ ...validRaw, email: undefined });
        expect(user.isValid()).toBe(false);
    });

    it('retorna false quando e-mail está em formato inválido', () => {
        const user = new User({ ...validRaw, email: 'nao-e-um-email' });
        expect(user.isValid()).toBe(false);
    });

    it('retorna false quando e-mail está vazio', () => {
        const user = new User({ ...validRaw, email: '' });
        expect(user.isValid()).toBe(false);
    });

    it('retorna false quando age é 0 (dob ausente)', () => {
        const user = new User({ ...validRaw, dob: { age: 0, date: null } });
        expect(user.isValid()).toBe(false);
    });

    it('retorna false quando fullName está vazio (name ausente)', () => {
        const user = new User({ ...validRaw, name: undefined });
        expect(user.isValid()).toBe(false);
    });
});

// -------------------------------------------------------------------
// isAdult()
// -------------------------------------------------------------------
describe('User — isAdult()', () => {
    it('retorna true para usuário com exatamente 18 anos', () => {
        const user = new User({ ...validRaw, dob: { age: 18, date: '2008-03-01T00:00:00.000Z' } });
        expect(user.isAdult()).toBe(true);
    });

    it('retorna true para usuário com mais de 18 anos', () => {
        const user = new User(validRaw); // age: 25
        expect(user.isAdult()).toBe(true);
    });

    it('retorna false para usuário com 17 anos', () => {
        const user = new User({ ...validRaw, dob: { age: 17, date: '2009-03-01T00:00:00.000Z' } });
        expect(user.isAdult()).toBe(false);
    });

    it('retorna false para usuário com 0 anos (dob ausente)', () => {
        const user = new User({ ...validRaw, dob: undefined });
        expect(user.isAdult()).toBe(false);
    });
});
