/**
 * Entidade de domínio que representa um colaborador (usuário).
 * Responsável por encapsular os dados brutos da API e expor
 * regras de negócio puras, sem dependências externas.
 */

class User {
    /**
     * @param {object} data - Dados brutos da API.
     * Estrutura esperada:
     */
    constructor(rawData) {
        this.firstName = rawData.name?.first ?? '';
        this.lastName = rawData.name?.last ?? '';
        this.fullName = `${this.firstName} ${this.lastName}`.trim();
        this.email = (rawData.email ?? '').toLowerCase().trim();
        this.gender = rawData.gender ?? '';
        this.age = rawData.dob?.age ?? 0;
        this.dateOfBirth = rawData.dob?.date ?? null;
        this.phone = rawData.phone ?? '';
        this.country = rawData.location?.country ?? '';
        this.city = rawData.location?.city ?? '';
        this.state = rawData.location?.state ?? '';
        this.picture = rawData.picture?.large ?? '';
        this.nationality = rawData.nat ?? '';
    }

    /**
    * Verifica se o colaborador tem 18 anos ou mais (regra de negócio).
    * @returns {boolean}
    */
    isAdult() {
        return this.age >= 18;
    }

    /**
     * Verifica se os dados mínimos necessários estão presentes e são válidos.
     * @returns {boolean}
     */
    isValid() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return (
            emailRegex.test(this.email) &&
            this.age > 0 &&
            this.fullName.length > 0
        );
    }
}

module.exports = User;