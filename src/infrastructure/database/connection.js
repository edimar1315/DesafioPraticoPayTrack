const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config');

let db = null;

/**
 * Retorna (ou cria) a conexão singleton com o banco SQLite via sql.js (WASM puro).
 * Se o arquivo de banco já existir, carrega os dados do disco.
 * @returns {Promise<import('sql.js').Database>}
 */
async function getConnection() {
    if (db) return db;

    const dbDir = path.dirname(config.database.path);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    const SQL = await initSqlJs();

    if (fs.existsSync(config.database.path)) {
        const fileBuffer = fs.readFileSync(config.database.path);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    return db;
}

/**
 * Persiste o estado atual do banco em disco (serialização WASM → Buffer).
 */
function saveDatabase() {
    if (!db) return;

    const data = db.export();
    const dbDir = path.dirname(config.database.path);

    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    fs.writeFileSync(config.database.path, Buffer.from(data));
}

/**
 * Salva o banco em disco e libera a memória alocada pelo WASM.
 */
function closeConnection() {
    if (db) {
        saveDatabase();
        db.close();
        db = null;
    }
}

module.exports = { getConnection, saveDatabase, closeConnection };
