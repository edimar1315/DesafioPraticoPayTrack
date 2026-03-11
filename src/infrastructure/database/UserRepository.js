/**
 * Repositório responsável pelas operações de persistência de usuários.
 * Recebe a instância do banco via construtor (Dependency Injection).
 * Utiliza prepared statements para prevenir SQL Injection (OWASP A03).
 */
class UserRepository {
    /**
     * @param {import('sql.js').Database} db - Instância sql.js já inicializada
     */
    constructor(db) {
        this.db = db;
        this._initSchema();
    }

    _initSchema() {
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id            INTEGER  PRIMARY KEY AUTOINCREMENT,
                first_name    TEXT     NOT NULL,
                last_name     TEXT     NOT NULL,
                full_name     TEXT     NOT NULL,
                email         TEXT     NOT NULL UNIQUE,
                gender        TEXT,
                age           INTEGER,
                date_of_birth TEXT,
                phone         TEXT,
                country       TEXT,
                city          TEXT,
                state         TEXT,
                picture       TEXT,
                nationality   TEXT,
                created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        this.db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)');
    }

    _queryOne(sql, params) {
        const stmt = this.db.prepare(sql);
        if (params) stmt.bind(params);
        const row = stmt.step() ? stmt.getAsObject() : null;
        stmt.free();
        return row;
    }

    findByEmail(email) {
        return this._queryOne('SELECT id FROM users WHERE email = ?', [email]);
    }

    insert(user) {
        const stmt = this.db.prepare(`
            INSERT INTO users
                (first_name, last_name, full_name, email, gender, age,
                 date_of_birth, phone, country, city, state, picture, nationality)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run([
            user.firstName, user.lastName, user.fullName, user.email,
            user.gender, user.age, user.dateOfBirth, user.phone,
            user.country, user.city, user.state, user.picture, user.nationality,
        ]);
        stmt.free();
    }

    update(user) {
        const stmt = this.db.prepare(`
            UPDATE users SET
                first_name    = ?,
                last_name     = ?,
                full_name     = ?,
                gender        = ?,
                age           = ?,
                date_of_birth = ?,
                phone         = ?,
                country       = ?,
                city          = ?,
                state         = ?,
                picture       = ?,
                nationality   = ?,
                updated_at    = CURRENT_TIMESTAMP
            WHERE email = ?
        `);
        stmt.run([
            user.firstName, user.lastName, user.fullName,
            user.gender, user.age, user.dateOfBirth, user.phone,
            user.country, user.city, user.state, user.picture, user.nationality,
            user.email,
        ]);
        stmt.free();
    }

    count() {
        const row = this._queryOne('SELECT COUNT(*) AS total FROM users');
        return row ? row.total : 0;
    }
}

module.exports = UserRepository;
