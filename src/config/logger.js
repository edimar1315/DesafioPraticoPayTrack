'use strict';

const pino = require('pino');

/**
 * Logger centralizado com pino
 * Padrão: structured logging (JSON) com níveis configuráveis
 * 
 * Exemplo de uso:
 * - logger.info('Mensagem')
 * - logger.error('Erro:', err)
 * - logger.debug('Debug com contexto', { userId: 123 })
 */
const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    // Configuração simplificada para desenvolvimento
    // Em produção, usar pino-pretty ou enviar para stack de logs (ELK, DataDog, etc)
});

module.exports = logger;
