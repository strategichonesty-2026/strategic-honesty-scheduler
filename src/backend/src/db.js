require("dotenv").config();

let db;

async function initializeDb() {
  if (process.env.DATABASE_URL) {
    // ── Postgres (Railway production) ─────────────────────────────────────
    const { Pool } = require("pg");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    console.log("✅ Connected to Railway Postgres");

    db = {
      async run(sql, params = []) {
        let i = 0;
        const pgSql = sql.replace(/\?/g, () => `$${++i}`);
        const result = await pool.query(pgSql, params);
        return { changes: result.rowCount };
      },
      async get(sql, params = []) {
        let i = 0;
        const pgSql = sql.replace(/\?/g, () => `$${++i}`);
        const result = await pool.query(pgSql, params);
        return result.rows[0] || null;
      },
      async all(sql, params = []) {
        let i = 0;
        const pgSql = sql.replace(/\?/g, () => `$${++i}`);
        const result = await pool.query(pgSql, params);
        return result.rows;
      },
    };
  } else {
    // ── SQLite (local dev) ────────────────────────────────────────────────
    const path = require("path");
    const fs = require("fs");
    const initSqlJs = require("sql.js");
    const DB_PATH = path.join(process.cwd(), "scheduler.db");
    const SQL = await initSqlJs();
    let sqliteDb;
    if (fs.existsSync(DB_PATH)) {
      sqliteDb = new SQL.Database(fs.readFileSync(DB_PATH));
    } else {
      sqliteDb = new SQL.Database();
    }
    const saveDb = () => fs.writeFileSync(DB_PATH, Buffer.from(sqliteDb.export()));

    db = {
      run(sql, params = []) { sqliteDb.run(sql, params); saveDb(); return Promise.resolve({ changes: 1 }); },
      get(sql, params = []) {
        const stmt = sqliteDb.prepare(sql); stmt.bind(params);
        const row = stmt.step() ? stmt.getAsObject() : null; stmt.free();
        return Promise.resolve(row);
      },
      all(sql, params = []) {
        const stmt = sqliteDb.prepare(sql); stmt.bind(params);
        const rows = []; while (stmt.step()) rows.push(stmt.getAsObject()); stmt.free();
        return Promise.resolve(rows);
      },
    };
    console.log("✅ Connected to SQLite (local)");
  }
}

async function initDb() {
  await initializeDb();

  await db.run(`CREATE TABLE IF NOT EXISTS oauth_tokens (
    id TEXT PRIMARY KEY, platform TEXT NOT NULL, user_id TEXT NOT NULL,
    access_token TEXT NOT NULL, refresh_token TEXT, expires_at BIGINT,
    scope TEXT, raw TEXT, created_at BIGINT, updated_at BIGINT,
    UNIQUE(platform, user_id)
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS scheduled_posts (
    id TEXT PRIMARY KEY, platform TEXT NOT NULL, user_id TEXT NOT NULL,
    content TEXT NOT NULL, media_url TEXT, media_type TEXT,
    scheduled_at BIGINT NOT NULL, status TEXT DEFAULT 'pending',
    error TEXT, post_id TEXT, created_at BIGINT, updated_at BIGINT
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS post_log (
    id TEXT PRIMARY KEY, post_id TEXT NOT NULL, platform TEXT NOT NULL,
    action TEXT NOT NULL, detail TEXT, logged_at BIGINT
  )`);

  console.log("✅ Database ready");
}

const dbProxy = {
  run: (...args) => db.run(...args),
  get: (...args) => db.get(...args),
  all: (...args) => db.all(...args),
};

module.exports = { db: dbProxy, initDb };
