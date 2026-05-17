require("dotenv").config();
const path = require("path");
const fs = require("fs");
const initSqlJs = require("sql.js");

let db;
const DB_PATH = path.join(process.cwd(), "scheduler.db");

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

const dbWrapper = {
  async run(sql, params = []) {
    const d = await getDb();
    d.run(sql, params);
    saveDb();
    return { changes: 1 };
  },
  async get(sql, params = []) {
    const d = await getDb();
    const stmt = d.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  },
  async all(sql, params = []) {
    const d = await getDb();
    const stmt = d.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  },
};

async function initDb() {
  await dbWrapper.run(`CREATE TABLE IF NOT EXISTS oauth_tokens (id TEXT PRIMARY KEY, platform TEXT NOT NULL, user_id TEXT NOT NULL, access_token TEXT NOT NULL, refresh_token TEXT, expires_at INTEGER, scope TEXT, raw TEXT, created_at INTEGER, updated_at INTEGER, UNIQUE(platform, user_id))`);
  await dbWrapper.run(`CREATE TABLE IF NOT EXISTS scheduled_posts (id TEXT PRIMARY KEY, platform TEXT NOT NULL, user_id TEXT NOT NULL, content TEXT NOT NULL, media_url TEXT, media_type TEXT, scheduled_at INTEGER NOT NULL, status TEXT DEFAULT 'pending', error TEXT, post_id TEXT, created_at INTEGER, updated_at INTEGER)`);
  await dbWrapper.run(`CREATE TABLE IF NOT EXISTS post_log (id TEXT PRIMARY KEY, post_id TEXT NOT NULL, platform TEXT NOT NULL, action TEXT NOT NULL, detail TEXT, logged_at INTEGER)`);
  console.log("✅ Database ready");
}

module.exports = { db: dbWrapper, initDb };
