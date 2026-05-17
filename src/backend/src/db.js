require("dotenv").config();
const Database = require("better-sqlite3");
const sqliteDb = new Database("scheduler.db");
sqliteDb.pragma("journal_mode = WAL");

const db = {
  run(sql, params = []) { return Promise.resolve(sqliteDb.prepare(sql).run(...params)); },
  get(sql, params = []) { return Promise.resolve(sqliteDb.prepare(sql).get(...params) || null); },
  all(sql, params = []) { return Promise.resolve(sqliteDb.prepare(sql).all(...params)); },
};

async function initDb() {
  await db.run(`CREATE TABLE IF NOT EXISTS oauth_tokens (id TEXT PRIMARY KEY, platform TEXT NOT NULL, user_id TEXT NOT NULL, access_token TEXT NOT NULL, refresh_token TEXT, expires_at INTEGER, scope TEXT, raw TEXT, created_at INTEGER DEFAULT (strftime('%s','now') * 1000), updated_at INTEGER DEFAULT (strftime('%s','now') * 1000), UNIQUE(platform, user_id))`);
  await db.run(`CREATE TABLE IF NOT EXISTS scheduled_posts (id TEXT PRIMARY KEY, platform TEXT NOT NULL, user_id TEXT NOT NULL, content TEXT NOT NULL, media_url TEXT, media_type TEXT, scheduled_at INTEGER NOT NULL, status TEXT DEFAULT 'pending', error TEXT, post_id TEXT, created_at INTEGER DEFAULT (strftime('%s','now') * 1000), updated_at INTEGER DEFAULT (strftime('%s','now') * 1000))`);
  await db.run(`CREATE TABLE IF NOT EXISTS post_log (id TEXT PRIMARY KEY, post_id TEXT NOT NULL, platform TEXT NOT NULL, action TEXT NOT NULL, detail TEXT, logged_at INTEGER DEFAULT (strftime('%s','now') * 1000))`);
  console.log("✅ Database ready");
}

module.exports = { db, initDb };
