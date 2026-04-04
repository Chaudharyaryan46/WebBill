// ═══════════════════════════════════════════════
//  DINEFLOW WAITER v1.2 — Fixed & Working JS
// ═══════════════════════════════════════════════

const socket = initSocket();

let staff = { name: 'Waiter', role: 'Staff' }, tables = [], menuItems = [], categories = [];
let currentTable = null, currentOrder = null, currentOrderItems = [];
let pendingItems = [];
let activeCat = 'All';
let pin = '';

// Load data immediately
window.onload = () => {
    loadTables();
    loadMenu();
};



// ─── TABLES ───
async function loadTables() {
  tables = await api('/api/tables');
  renderTables();
}

function renderTables() {
  const grid = document.getElementById('tablesGrid');
  grid.innerHTML = tables.map(t => `
    <div class="table-card ${t.status} anim" onclick="openTable(${t.number})">
      <div class="table-num">${t.number}</div>
      <div class="table-status">${t.status}</div>
      ${t.activeOrder ? `<div class="table-amt">${formatCurrency(t.activeOrder.total)}</div>` : ''}
    </div>
  `).join('');
}

async function openTable(num) {
  try {
    const data = await api('/api/waiter/open-table', { method: 'POST', body: { tableNumber: num } });
    currentTable = num;
    currentOrder = data.order;
    currentOrderItems = data.items || [];
    pendingItems = [];
    showOrderView();
  } catch (err) {
    showToast(`Could not open table ${num}`, 'error');
  }
}

// ─── VIEWS ───
function showTableView() {
  document.getElementById('tableView').style.display = 'block';
  document.getElementById('orderView').style.display = 'none';
  document.getElementById('backBtn').style.display = 'none';
  currentTable = null;
  loadTables();
}

function showOrderView() {
  document.getElementById('tableView').style.display = 'none';
  document.getElementById('orderView').style.display = 'block';
  document.getElementById('backBtn').style.display = 'block';
  document.getElementById('orderTableLabel').textContent = `Table ${currentTable}`;
  renderCats();
  renderMenuItems();
  updateCart();
}

// ─── MENU ───
async function loadMenu() {
  const data = await api('/api/menu');
  menuItems = data.items;
  categories = data.categories;
  if (document.getElementById('orderView').style.display !== 'none') {
    renderCats();
    renderMenuItems();
  }
}

function renderCats() {
  const row = document.getElementById('catRow');
  row.innerHTML = `
    <div class="cat-chip ${activeCat === 'All' ? 'active' : ''}" onclick="setCat('All')">All</div>
    ${categories.map(c => `
      <div class="cat-chip ${activeCat === c ? 'active' : ''}" onclick="setCat('${c}')">${c}</div>
    `).join('')}
  `;
}

function setCat(cat) {
  activeCat = cat;
  renderCats();
  renderMenuItems();
}

function renderMenuItems(overrideItems) {
  const filtered = overrideItems || (activeCat === 'All'
    ? menuItems
    : menuItems.filter(i => i.category === activeCat));
  
  const grid = document.getElementById('itemsGrid');
  grid.innerHTML = filtered.map(item => `
    <div class="item-card anim" onclick="addItem(${item.id})">
      <div class="item-img-wrap">
        <img class="item-img" src="${item.image_url}" loading="lazy"
             onerror="this.style.display='none'; this.parentElement.style.background='#f0f4e8'">
        <div class="item-add-btn">+</div>
      </div>
      <div class="item-body">
        <div class="item-name">
          <span class="item-veg">${item.veg ? '🟢' : '🔴'}</span>${item.name}
        </div>
        <div class="item-price">${formatCurrency(item.price)}</div>
      </div>
    </div>
  `).join('');
}

function searchMenu(q) {
  if (!q.trim()) return renderMenuItems();
  const lower = q.toLowerCase();
  renderMenuItems(menuItems.filter(i =>
    i.name.toLowerCase().includes(lower) || i.category.toLowerCase().includes(lower)
  ));
}

// ─── CART ───
function addItem(itemId) {
  const item = menuItems.find(m => m.id === itemId);
  if (!item) return;

  const existing = pendingItems.find(p => p.menu_item_id === itemId);
  if (existing) {
    existing.quantity++;
  } else {
    pendingItems.unshift({
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1
    });
  }

  // Flash the add button briefly
  updateCart();
  showToast(`+ ${item.name}`, 'success');
}

function updateCart() {
  const allItems = [...pendingItems, ...currentOrderItems];
  const total = allItems.reduce((s, i) => s + (i.price * i.quantity), 0);
  const count = allItems.reduce((s, i) => s + i.quantity, 0);

  document.getElementById('cartTotal').textContent = formatCurrency(total);
  document.getElementById('cartCount').textContent = `${count} items`;

  const btn = document.getElementById('kotBtn');
  if (pendingItems.length > 0) {
    btn.textContent = `🚀 Send ${pendingItems.length} item(s) to Kitchen`;
    btn.onclick = sendKOT;
    btn.disabled = false;
  } else {
    btn.textContent = '← Back when done';
    btn.onclick = showTableView;
    btn.disabled = false;
  }
}

// ─── KOT ───
async function sendKOT() {
  if (pendingItems.length === 0) return;

  const btn = document.getElementById('kotBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Sending...';

  try {
    const itemsToSend = pendingItems.map(p => ({
      menuItemId: p.menu_item_id,
      quantity: p.quantity
    }));

    const result = await api(`/api/orders/${currentOrder.id}/items`, {
      method: 'POST',
      body: { items: itemsToSend, source: 'waiter' }
    });

    currentOrderItems = result.items || currentOrderItems;
    pendingItems = [];
    updateCart();
    showToast('✅ KOT sent to Kitchen!', 'success');
  } catch (err) {
    btn.disabled = false;
    btn.textContent = '🚀 Retry Send to Kitchen';
  }
}

// ─── SOCKETS ───
socket.on('table:updated', (data) => {
  const idx = tables.findIndex(t => t.number === data.number);
  if (idx !== -1) { tables[idx] = { ...tables[idx], ...data }; }
  if (document.getElementById('tableView').style.display !== 'none') renderTables();
});
