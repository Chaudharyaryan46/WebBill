const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { initializeDatabase, queryAll, queryOne, runSql, insertSql, scalarQuery, saveDatabase } = require('./db/database');

// Auto-save every 5 seconds
setInterval(() => {
  try {
    saveDatabase();
  } catch (e) {
    console.error('Auto-save failed:', e);
  }
}, 5000);

// ─── INIT ───
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════

function getTableByNumber(num) {
  return queryOne('SELECT * FROM tables_info WHERE number = ?', [num]);
}

function getTableById(id) {
  return queryOne('SELECT * FROM tables_info WHERE id = ?', [id]);
}

function getActiveOrderForTable(tableId) {
  return queryOne("SELECT * FROM orders WHERE table_id = ? AND status = 'active'", [tableId]);
}

function getOrderItems(orderId) {
  return queryAll(`
    SELECT oi.*, mi.name, mi.category, mi.veg, mi.image_url
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    WHERE oi.order_id = ?
    ORDER BY oi.created_at ASC
  `, [orderId]);
}

function recalcOrderTotals(orderId) {
  const order = queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!order) return null;

  const items = queryOne(
    "SELECT COALESCE(SUM(price * quantity), 0) as subtotal FROM order_items WHERE order_id = ? AND status != 'cancelled'",
    [orderId]
  );

  const subtotal = items.subtotal || 0;
  const discountAmount = (subtotal * order.discount) / 100;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = (afterDiscount * order.tax_rate) / 100;
  const total = afterDiscount + taxAmount;

  runSql(
    'UPDATE orders SET subtotal = ?, tax_amount = ?, total = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [subtotal, taxAmount, total, orderId]
  );

  return { subtotal, tax_amount: taxAmount, total, discount: order.discount, tax_rate: order.tax_rate };
}

function getAllTables() {
  return queryAll('SELECT * FROM tables_info ORDER BY number ASC');
}

// ═══════════════════════════════════════════════════════
//  API ROUTES — TABLES
// ═══════════════════════════════════════════════════════

app.get('/api/tables', (req, res) => {
  const tables = getAllTables();
  const enriched = tables.map((t) => {
    const order = getActiveOrderForTable(t.id);
    return {
      ...t,
      activeOrder: order
        ? {
            id: order.id,
            itemCount: queryOne("SELECT COUNT(*) as c FROM order_items WHERE order_id = ? AND status != 'cancelled'", [order.id]).c,
            total: order.total,
          }
        : null,
    };
  });
  res.json(enriched);
});

app.post('/api/tables/:number/status', (req, res) => {
  const { status } = req.body;
  const table = getTableByNumber(parseInt(req.params.number));
  if (!table) return res.status(404).json({ error: 'Table not found' });

  runSql('UPDATE tables_info SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, table.id]);
  const updated = getTableByNumber(parseInt(req.params.number));
  io.emit('table:updated', updated);
  res.json(updated);
});

// Reset table status (admin/counter only)
app.post('/api/tables/:number/reset', (req, res) => {
  const table = getTableByNumber(parseInt(req.params.number));
  if (!table) return res.status(404).json({ error: 'Table not found' });

  console.log(`🧹 Resetting table ${table.number} manually`);
  runSql("UPDATE tables_info SET status = 'free', session_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [table.id]);
  
  const updated = getTableByNumber(parseInt(req.params.number));
  io.emit('table:updated', updated);
  res.json(updated);
});

// ═══════════════════════════════════════════════════════
//  API ROUTES — MENU
// ═══════════════════════════════════════════════════════

app.get('/api/menu', (req, res) => {
  const items = queryAll('SELECT * FROM menu_items WHERE available = 1 ORDER BY category, name');
  const categories = [...new Set(items.map((i) => i.category))];
  res.json({ items, categories });
});

app.get('/api/menu/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  const items = queryAll(
    "SELECT * FROM menu_items WHERE available = 1 AND (name LIKE ? OR category LIKE ?) ORDER BY name",
    [`%${q}%`, `%${q}%`]
  );
  res.json(items);
});

// ═══════════════════════════════════════════════════════
//  API ROUTES — QR / SESSION
// ═══════════════════════════════════════════════════════

app.post('/api/session/start', (req, res) => {
  const { tableNumber } = req.body;
  const table = getTableByNumber(tableNumber);
  if (!table) return res.status(404).json({ error: 'Table not found' });

  // If table already has an active session, return existing order
  if (table.status === 'occupied' && table.session_id) {
    const order = getActiveOrderForTable(table.id);
    if (order) {
      const items = getOrderItems(order.id);
      return res.json({ sessionId: table.session_id, orderId: order.id, order, items, existing: true });
    }
  }

  // If table is billed, don't allow new orders
  if (table.status === 'billed') {
    return res.status(400).json({ error: 'Table is currently being billed. Please wait.' });
  }

  // Create new session
  const sessionId = uuidv4();
  runSql('UPDATE tables_info SET status = ?, session_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    ['occupied', sessionId, table.id]);

  // Create new order
  const newOrderId = insertSql(
    'INSERT INTO orders (table_id, session_id, status) VALUES (?, ?, ?)',
    [table.id, sessionId, 'active']
  );

  const order = queryOne('SELECT * FROM orders WHERE id = ?', [newOrderId]);
  if (!order) {
    return res.status(500).json({ error: 'Failed to create order' });
  }

  io.emit('table:updated', { ...table, status: 'occupied', session_id: sessionId });
  io.emit('order:new', { tableNumber, orderId: order.id });

  res.json({ sessionId, orderId: order.id, order, items: [], existing: false });
});

app.get('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const table = queryOne('SELECT * FROM tables_info WHERE session_id = ?', [sessionId]);
  if (!table) return res.status(404).json({ error: 'Invalid or expired session' });

  const order = getActiveOrderForTable(table.id);
  if (!order) return res.status(404).json({ error: 'No active order for this session' });

  const items = getOrderItems(order.id);
  const totals = recalcOrderTotals(order.id);

  res.json({ table, order: { ...order, ...totals }, items });
});

// ═══════════════════════════════════════════════════════
//  API ROUTES — ORDERS
// ═══════════════════════════════════════════════════════

app.get('/api/orders/active', (req, res) => {
  const orders = queryAll(`
    SELECT o.*, t.number as table_number
    FROM orders o
    JOIN tables_info t ON o.table_id = t.id
    WHERE o.status = 'active'
    ORDER BY o.created_at DESC
  `);

  const enriched = orders.map((o) => ({
    ...o,
    items: getOrderItems(o.id),
  }));

  res.json(enriched);
});

// Get order by table number (for billing counter) — MUST be before /:id
app.get('/api/orders/table/:number', (req, res) => {
  const table = getTableByNumber(parseInt(req.params.number));
  if (!table) return res.status(404).json({ error: 'Table not found' });

  const order = queryOne(
    "SELECT o.*, t.number as table_number FROM orders o JOIN tables_info t ON o.table_id = t.id WHERE o.table_id = ? AND o.status IN ('active', 'billed') ORDER BY o.created_at DESC LIMIT 1",
    [table.id]
  );

  if (!order) return res.status(404).json({ error: 'No active order for this table' });

  const items = getOrderItems(order.id);
  const totals = recalcOrderTotals(order.id);

  res.json({ ...order, ...totals, items });
});

app.get('/api/orders/:id', (req, res) => {
  const order = queryOne(`
    SELECT o.*, t.number as table_number
    FROM orders o
    JOIN tables_info t ON o.table_id = t.id
    WHERE o.id = ?
  `, [req.params.id]);

  if (!order) return res.status(404).json({ error: 'Order not found' });

  const items = getOrderItems(order.id);
  const totals = recalcOrderTotals(order.id);

  res.json({ ...order, ...totals, items });
});

// ─── ADD ITEMS TO ORDER ───

app.post('/api/orders/:id/items', (req, res) => {
  const { items, source } = req.body;
  const orderId = parseInt(req.params.id);
  const order = queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);

  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 'active') return res.status(400).json({ error: 'Order is not active' });

  const addedItems = [];
  for (const item of items) {
    const menuItem = queryOne('SELECT * FROM menu_items WHERE id = ?', [item.menuItemId]);
    if (!menuItem) continue;

    const newItemId = insertSql(
      'INSERT INTO order_items (order_id, menu_item_id, quantity, price, source, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [orderId, item.menuItemId, item.quantity || 1, menuItem.price, source || 'qr', item.notes || null]
    );

    addedItems.push({
      id: newItemId,
      order_id: orderId,
      menu_item_id: item.menuItemId,
      name: menuItem.name,
      category: menuItem.category,
      quantity: item.quantity || 1,
      price: menuItem.price,
      source: source || 'qr',
      status: 'pending',
      notes: item.notes || null,
      veg: menuItem.veg,
    });
  }

  const totals = recalcOrderTotals(orderId);
  const table = getTableById(order.table_id);

  // Emit to all clients
  io.emit('order:items-added', {
    orderId,
    tableNumber: table.number,
    items: addedItems,
    totals,
    source: source || 'qr',
  });

  // Emit KOT to kitchen
  io.emit('kitchen:kot', {
    orderId,
    tableNumber: table.number,
    items: addedItems,
    timestamp: new Date().toISOString(),
  });

  res.json({ items: addedItems, totals });
});

// ─── UPDATE ITEM STATUS ───

app.patch('/api/order-items/:id/status', (req, res) => {
  const { status } = req.body;
  const itemId = parseInt(req.params.id);

  runSql('UPDATE order_items SET status = ? WHERE id = ?', [status, itemId]);

  const item = queryOne(`
    SELECT oi.*, mi.name, mi.category, o.table_id
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    JOIN orders o ON oi.order_id = o.id
    WHERE oi.id = ?
  `, [itemId]);

  if (item) {
    const table = getTableById(item.table_id);
    const totals = recalcOrderTotals(item.order_id);
    io.emit('order:item-updated', { item, tableNumber: table.number, totals });
  }

  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════
//  API ROUTES — BILLING
// ═══════════════════════════════════════════════════════

app.post('/api/orders/:id/generate-bill', (req, res) => {
  const orderId = parseInt(req.params.id);
  const { discount } = req.body;
  const order = queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);

  if (!order) return res.status(404).json({ error: 'Order not found' });

  // Apply discount if provided
  if (discount !== undefined) {
    runSql('UPDATE orders SET discount = ? WHERE id = ?', [discount, orderId]);
  }

  runSql("UPDATE orders SET status = 'billed', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [orderId]);

  const table = getTableById(order.table_id);
  runSql("UPDATE tables_info SET status = 'billed', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [table.id]);

  const totals = recalcOrderTotals(orderId);
  const items = getOrderItems(orderId);
  const updatedOrder = queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);

  io.emit('table:updated', { ...table, status: 'billed' });
  io.emit('order:billed', { orderId, tableNumber: table.number, totals });

  res.json({ ...updatedOrder, ...totals, items, table_number: table.number });
});

app.post('/api/orders/:id/pay', (req, res) => {
  const orderId = parseInt(req.params.id);
  const { paymentMode } = req.body;
  const order = queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);

  if (!order) return res.status(404).json({ error: 'Order not found' });

  const totals = recalcOrderTotals(orderId);

  // Update order to paid
  runSql(
    "UPDATE orders SET status = 'paid', payment_mode = ?, paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [paymentMode, orderId]
  );

  // Save transaction
  const table = getTableById(order.table_id);
  insertSql(
    'INSERT INTO transactions (order_id, table_number, subtotal, discount, tax_amount, total, payment_mode) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [orderId, table.number, totals.subtotal, totals.discount, totals.tax_amount, totals.total, paymentMode]
  );

  // Reset table to free - ESSENTIAL for clearing the 'billed' lock
  console.log(`✅ Settling payment for Table ${table.number}, Order ${orderId}`);
  
  runSql("UPDATE tables_info SET status = 'free', session_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [table.id]);

  const updatedTable = getTableById(table.id);
  io.emit('table:updated', updatedTable);
  io.emit('order:paid', { orderId, tableNumber: table.number, paymentMode });

  res.json({ success: true, message: `Payment received via ${paymentMode}` });
});

// ─── BILL REQUEST ───

app.post('/api/orders/:id/request-bill', (req, res) => {
  const orderId = parseInt(req.params.id);
  const order = queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
  
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const table = getTableById(order.table_id);

  // Emit event to the counter
  io.emit('order:bill-requested', { orderId, tableNumber: table.number });
  
  res.json({ success: true, message: 'Bill requested' });
});

// ─── TRANSACTION HISTORY ───

app.get('/api/transactions', (req, res) => {
  const { date } = req.query;
  let sql = 'SELECT * FROM transactions';
  let params = [];

  if (date) {
    sql += ' WHERE DATE(paid_at) = ?';
    params.push(date);
  }

  sql += ' ORDER BY paid_at DESC';
  const transactions = queryAll(sql, params);
  res.json(transactions);
});

app.get('/api/transactions/summary', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const summary = queryOne(`
    SELECT
      COUNT(*) as total_orders,
      COALESCE(SUM(total), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN payment_mode = 'cash' THEN total ELSE 0 END), 0) as cash_total,
      COALESCE(SUM(CASE WHEN payment_mode = 'upi' THEN total ELSE 0 END), 0) as upi_total,
      COALESCE(SUM(CASE WHEN payment_mode = 'card' THEN total ELSE 0 END), 0) as card_total,
      COALESCE(SUM(tax_amount), 0) as total_tax,
      COALESCE(SUM(discount), 0) as total_discount
    FROM transactions
    WHERE DATE(paid_at) = ?
  `, [today]);

  res.json({ date: today, ...summary });
});

// ═══════════════════════════════════════════════════════
//  API ROUTES — STAFF AUTH
// ═══════════════════════════════════════════════════════

app.post('/api/staff/login', (req, res) => {
  const { pin } = req.body;
  const staffMember = queryOne('SELECT id, name, role FROM staff WHERE pin = ? AND active = 1', [pin]);
  if (!staffMember) return res.status(401).json({ error: 'Invalid PIN' });
  res.json(staffMember);
});

// ═══════════════════════════════════════════════════════
//  API ROUTES — WAITER: OPEN TABLE
// ═══════════════════════════════════════════════════════

app.post('/api/waiter/open-table', (req, res) => {
  const { tableNumber } = req.body;
  const table = getTableByNumber(tableNumber);
  if (!table) return res.status(404).json({ error: 'Table not found' });

  if (table.status === 'occupied') {
    const order = getActiveOrderForTable(table.id);
    if (order) {
      const items = getOrderItems(order.id);
      return res.json({ orderId: order.id, order, items, existing: true });
    }
  }

  if (table.status === 'billed') {
    return res.status(400).json({ error: 'Table is currently being billed' });
  }

  // Open new session for waiter
  const sessionId = uuidv4();
  runSql('UPDATE tables_info SET status = ?, session_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    ['occupied', sessionId, table.id]);

  const newOrderId = insertSql(
    'INSERT INTO orders (table_id, session_id, status) VALUES (?, ?, ?)',
    [table.id, sessionId, 'active']
  );

  const order = queryOne('SELECT * FROM orders WHERE id = ?', [newOrderId]);
  if (!order) {
    return res.status(500).json({ error: 'Failed to create order' });
  }

  io.emit('table:updated', { ...table, status: 'occupied', session_id: sessionId });
  io.emit('order:new', { tableNumber, orderId: order.id });

  res.json({ orderId: order.id, order, items: [], existing: false });
});

// ═══════════════════════════════════════════════════════
//  API ROUTES — KITCHEN: PENDING ITEMS
// ═══════════════════════════════════════════════════════

app.get('/api/kitchen/pending', (req, res) => {
  const items = queryAll(`
    SELECT oi.*, mi.name, mi.category, mi.veg, t.number as table_number, o.id as order_id
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    JOIN orders o ON oi.order_id = o.id
    JOIN tables_info t ON o.table_id = t.id
    WHERE oi.status IN ('pending', 'preparing')
    AND o.status = 'active'
    ORDER BY oi.created_at ASC
  `);

  // Group by order
  const grouped = {};
  for (const item of items) {
    if (!grouped[item.order_id]) {
      grouped[item.order_id] = {
        orderId: item.order_id,
        tableNumber: item.table_number,
        items: [],
        createdAt: item.created_at,
      };
    }
    grouped[item.order_id].items.push(item);
  }

  res.json(Object.values(grouped));
});

// ═══════════════════════════════════════════════════════
//  PAGE ROUTES
// ═══════════════════════════════════════════════════════

app.get('/waiter', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'waiter', 'index.html'));
});

app.get('/counter', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'counter', 'index.html'));
});

app.get('/kitchen', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kitchen', 'index.html'));
});

// ═══════════════════════════════════════════════════════
//  WEBSOCKET
// ═══════════════════════════════════════════════════════

io.on('connection', (socket) => {
  console.log(`⚡ Client connected: ${socket.id}`);

  socket.on('join:room', (room) => {
    socket.join(room);
    console.log(`📌 ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`⛔ Client disconnected: ${socket.id}`);
  });
});

// ═══════════════════════════════════════════════════════
//  START SERVER (after DB init)
// ═══════════════════════════════════════════════════════

async function start() {
  await initializeDatabase();

  server.listen(PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════════════╗');
    console.log('  ║   🍽️  Restaurant Management System           ║');
    console.log('  ╠══════════════════════════════════════════════╣');
    console.log(`  ║   Server running on http://localhost:${PORT}    ║`);
    console.log('  ║                                              ║');
    console.log(`  ║   📋 Waiter:    http://localhost:${PORT}/waiter  ║`);
    console.log(`  ║   💰 Counter:   http://localhost:${PORT}/counter ║`);
    console.log(`  ║   🍳 Kitchen:   http://localhost:${PORT}/kitchen ║`);
    console.log('  ╚══════════════════════════════════════════════╝');
    console.log('');
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
