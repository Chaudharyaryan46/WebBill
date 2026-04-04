const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { tables, staff, menuItems } = require('./seed-data');

const DB_PATH = process.env.DATABASE_URL || process.env.DB_PATH || path.join(__dirname, '..', 'restaurant.db');

let db = null;

// Save DB to disk
function saveDatabase() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (e) {
    console.error('DB save error:', e);
  }
}

// Auto-save every 5 seconds
setInterval(saveDatabase, 5000);

async function initializeDatabase() {
  const SQL = await initSqlJs();

  // Load existing DB or create new
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // ─── CREATE TABLES ───
  db.run(`
    CREATE TABLE IF NOT EXISTS tables_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number INTEGER UNIQUE NOT NULL,
      capacity INTEGER DEFAULT 4,
      status TEXT DEFAULT 'free',
      session_id TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      pin TEXT NOT NULL,
      active INTEGER DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      image_url TEXT,
      veg INTEGER DEFAULT 1,
      available INTEGER DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL,
      session_id TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      discount REAL DEFAULT 0,
      tax_rate REAL DEFAULT 5.0,
      tax_amount REAL DEFAULT 0,
      subtotal REAL DEFAULT 0,
      total REAL DEFAULT 0,
      payment_mode TEXT,
      paid_at DATETIME
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      menu_item_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      price REAL NOT NULL,
      source TEXT DEFAULT 'qr',
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      table_number INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total REAL NOT NULL,
      payment_mode TEXT NOT NULL,
      paid_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ─── SEED DATA ───
  const tableCount = scalarQuery("SELECT COUNT(*) FROM tables_info");
  if (tableCount === 0) {
    for (const t of tables) {
      execSql("INSERT INTO tables_info (number, capacity, status) VALUES (?, ?, 'free')", [t.number, t.capacity]);
    }
    console.log(`✓ Seeded ${tables.length} tables`);
  }

  const staffCount = scalarQuery("SELECT COUNT(*) FROM staff");
  if (staffCount === 0) {
    for (const s of staff) {
      execSql("INSERT INTO staff (name, role, pin) VALUES (?, ?, ?)", [s.name, s.role, s.pin]);
    }
    console.log(`✓ Seeded ${staff.length} staff members`);
  }

  const menuCount = scalarQuery("SELECT COUNT(*) FROM menu_items");
  if (menuCount === 0) {
    for (const m of menuItems) {
      execSql("INSERT INTO menu_items (name, category, price, description, image_url, veg) VALUES (?, ?, ?, ?, ?, ?)",
        [m.name, m.category, m.price, m.description, m.image_url, m.veg]);
    }
    console.log(`✓ Seeded ${menuItems.length} menu items`);
  }

  saveDatabase();
  console.log('✓ Database initialized');

  return db;
}

// ═══════════════════════════════════════════════════════
//  QUERY HELPERS — all use prepare/bind/step pattern
// ═══════════════════════════════════════════════════════

// Get a single scalar value (first column of first row)
function scalarQuery(sql, params = []) {
  const stmt = db.prepare(sql);
  try {
    if (params.length > 0) stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.get();
      return row[0];
    }
    return null;
  } finally {
    stmt.free();
  }
}

// Get all rows as array of objects
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  try {
    if (params.length > 0) stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    return results;
  } finally {
    stmt.free();
  }
}

// Get first row as object
function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  try {
    if (params.length > 0) stmt.bind(params);
    if (stmt.step()) {
      return stmt.getAsObject();
    }
    return null;
  } finally {
    stmt.free();
  }
}

// Execute a statement (INSERT/UPDATE/DELETE) — does NOT return lastInsertRowid
function execSql(sql, params = []) {
  const stmt = db.prepare(sql);
  try {
    if (params.length > 0) stmt.bind(params);
    stmt.step();
  } finally {
    stmt.free();
  }
}

// Execute an INSERT and return the new row's ID
function insertSql(sql, params = []) {
  execSql(sql, params);
  const id = scalarQuery("SELECT last_insert_rowid()");
  saveDatabase();
  return id;
}

// Execute an UPDATE/DELETE (no return value needed)
function runSql(sql, params = []) {
  execSql(sql, params);
  saveDatabase();
}

module.exports = { initializeDatabase, queryAll, queryOne, runSql, insertSql, scalarQuery, saveDatabase };
