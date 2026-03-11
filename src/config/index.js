'use strict';

require('dotenv').config();
const path = require('path');

/**
 * Configuração centralizada da aplicação
 * Lê variáveis de ambiente, com fallbacks sensatos para desenvolvimento
 */
module.exports = {
    api: {
        baseUrl: process.env.RANDOMUSER_API_URL || 'https://randomuser.me/api',
        results: 150,
        timeout: parseInt(process.env.RANDOMUSER_TIMEOUT || '15000', 10),
    },
    database: {
        path: process.env.DATABASE_PATH || path.resolve(__dirname, '../../data/paytrack.db'),
    },
    reports: {
        outputDir: process.env.REPORTS_OUTPUT_DIR || path.resolve(__dirname, '../../reports'),
    },
    env: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
};
