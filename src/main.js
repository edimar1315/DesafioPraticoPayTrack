'use strict';

const RandomUsersClient = require('./infrastructure/api/RandomUsersClient');
const UserRepository = require('./infrastructure/database/UserRepository');
const SyncUsersUseCase = require('./application/SyncUsersUseCase');
const ReportGenerator = require('./infrastructure/report/ReportGenerator');
const { closeConnection, getConnection } = require('./infrastructure/database/connection');
const logger = require('./config/logger');
const config = require('./config');

/**
 * Entry point da aplicação PayTrack.
 * Compõe as dependências (Composition Root) e executa a sincronização.
 */
async function main() {
    logger.info('');
    logger.info('======================================================');
    logger.info('   PayTrack — Sincronização de Usuários/RH');
    logger.info('======================================================');
    logger.info('');

    try {
        logger.info('[0/3] Inicializando banco de dados SQLite...');
        const db = await getConnection();

        // --- Composition Root: injeção de dependências manual ---
        const apiClient = new RandomUsersClient();
        const userRepository = new UserRepository(db);
        const syncUseCase = new SyncUsersUseCase({ apiClient, userRepository });
        const reportGen = new ReportGenerator();

        logger.info(`[1/3] Consultando RandomUser API (${config.api.results} registros)...`);
        const result = await syncUseCase.execute();

        logger.info('[2/3] Sincronização concluída:');
        logger.info(`      ✔  Adicionados : ${result.added}`);
        logger.info(`      ↻  Atualizados : ${result.updated}`);
        logger.info(`      ✗  Ignorados   : ${result.ignored}`);
        logger.info(`      ⚠  Erros       : ${result.errors.length}`);

        logger.info('[3/3] Gerando relatório...');
        const { jsonPath, txtPath } = reportGen.generate(result);

        logger.info('');
        logger.info('  Relatórios gerados com sucesso:');
        logger.info(`    - TXT  : ${txtPath}`);
        logger.info(`    - JSON : ${jsonPath}`);
        logger.info('');
        logger.info('======================================================');
        logger.info('   Processo finalizado com sucesso!');
        logger.info('======================================================');
        logger.info('');

        process.exitCode = 0;
    } catch (err) {
        logger.error('');
        logger.error('[ERRO FATAL] A sincronização foi interrompida:');
        logger.error(`  ${err.message}`);
        logger.error('');
        process.exitCode = 1;
    } finally {
        closeConnection();
    }
}

main();
