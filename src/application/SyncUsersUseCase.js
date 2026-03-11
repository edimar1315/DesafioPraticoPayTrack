const User = require('../domain/Users');

/**
 * Caso de uso principal: orquestra a busca de usuários na API,
 * aplica as regras de negócio e persiste os dados no banco.
 *
 * Segue o princípio da Inversão de Dependências (DIP): recebe
 * as dependências via injeção, sem acoplamento concreto.
 */

class SyncUsersUseCase {
    /**
      * @param {{ apiClient: object, userRepository: object }} deps
      */
    constructor({ apiClient, userRepository }) {
        this.apiClient = apiClient;
        this.userRepository = userRepository;
    }
    /**
     * Executa a sincronização completa.
     * @returns {Promise<SyncResult>}
     */
    async execute() {
        /** @type {SyncResult} */
        const result = {
            total: 0,
            added: 0,
            updated: 0,
            ignored: 0,
            errors: [],
            startedAt: new Date().toISOString(),
            finishedAt: null,
        };
        const rawUsers = await this.apiClient.fetchUsers();
        result.total = rawUsers.length;
        for (const rawUser of rawUsers) {
            try {
                const user = new User(rawUser);

                // Regra 1: dados mínimos válidos
                if (!user.isValid()) {
                    result.ignored++;
                    result.errors.push({
                        email: user.email || '(sem e-mail)',
                        reason: 'Dados inválidos ou ausentes (e-mail, nome ou idade).',
                    });
                    continue;
                }

                // Regra 2: apenas maiores de 18 anos (baseado em dob.age)
                if (!user.isAdult()) {
                    result.ignored++;
                    continue;
                }

                const existing = this.userRepository.findByEmail(user.email);

                if (existing) {
                    this.userRepository.update(user);
                    result.updated++;
                } else {
                    this.userRepository.insert(user);
                    result.added++;
                }
            } catch (err) {
                result.ignored++;
                result.errors.push({
                    email: rawUser?.email ?? '(desconhecido)',
                    reason: err.message,
                });
            }
        }
        result.finishedAt = new Date().toISOString();
        return result;
    }
}

/**
 * @typedef {object} SyncResult
 * @property {number}   total      
 * @property {number}   added      
 * @property {number}   updated    
 * @property {number}   ignored    
 * @property {Array}    errors     
 * @property {string}   startedAt  
 * @property {string}   finishedAt 
 */

module.exports = SyncUsersUseCase;