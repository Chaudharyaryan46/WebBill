// ═══════════════════════════════════════════════════════
//  DINEFLOW v1.2 — BILLING COUNTER JS (LIGHT OLIVE)
//  Optimized for high-precision POS interaction
// ═══════════════════════════════════════════════════════

const socket = initSocket();

// ─── STATE ───
let tables = [];
let menuItems = [];
let currentCart = [];
let currentTableNumber = null;
let currentOrderId = null;
let selectedPaymentMode = null;

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
  loadMenu();
  loadTables(); // This will help identify active orders for sidebar
});

// ─── DATA LOADER ───
async function loadMenu() {
  const data = await api('/api/menu');
  menuItems = data.items;
  renderMenuGrid();
}

async function loadTables() {
  tables = await api('/api/tables');
  // If there's an active order we should show it
}

function renderMenuGrid(items) {
  const grid = document.getElementById('menuItemsGrid');
  const filtered = items || menuItems;
  
  grid.innerHTML = filtered.map(item => `
    <div class="billing-item-card animate-scale" onclick="addToCart(${item.id})">
      <div class="item-img-box">
        <img src="${item.image_url}" class="item-img" onerror="this.src='/images/placeholder-food.jpg'">
      </div>
      <div class="billing-item-name">${item.name}</div>
      <div class="billing-item-price">₹${item.price}</div>
    </div>
  `).join('');
}

// ─── CART LOGIC ───
function addToCart(itemId) {
  const item = menuItems.find(i => i.id === itemId);
  if (!item) return;

  const existing = currentCart.find(c => c.menu_item_id === itemId);
  if (existing) {
    existing.quantity++;
  } else {
    currentCart.push({
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1
    });
  }
  renderCart();
}

function renderCart() {
  const list = document.getElementById('cartItemsList');
  const grandTotalEl = document.getElementById('grandTotal');
  const btnSettle = document.getElementById('btnSettle');

  if (currentCart.length === 0) {
    list.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:50px 0;">Cart is empty</div>';
    grandTotalEl.textContent = '₹0.00';
    btnSettle.style.display = 'none';
    return;
  }

  list.innerHTML = currentCart.map(item => `
    <div class="cart-item-row animate-scale">
      <div class="cart-item-name">
        <span class="cart-qty-pill">${item.quantity}</span> ${item.name}
      </div>
      <div class="cart-row-price">₹${item.price * item.quantity}</div>
    </div>
  `).join('');

  const total = currentCart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  grandTotalEl.textContent = `₹${total}.00`;
  btnSettle.style.display = total > 0 ? 'block' : 'none';
}

// ─── ACTIONS ───
function selectPayment(mode) {
  selectedPaymentMode = mode;
  document.querySelectorAll('.pay-btn').forEach(b => b.classList.toggle('active', b.textContent.includes(mode)));
  document.getElementById('btnSettle').textContent = `Pay via ${mode.toUpperCase()} 🎫`;
}

async function settleBill() {
  if (!selectedPaymentMode) return notifyPOS('Please select payment mode', '#e74c3c');
  const btn = document.getElementById('btnSettle');
  btn.disabled = true;
  btn.innerHTML = 'Settling...';

  try {
    // In actual app, we'd find the table_id or create a direct sale
    // For this build, we'll simulate a quick settlement
    notifyPOS('✅ Bill Settled Successfully!', '#889e48');
    currentCart = [];
    selectedPaymentMode = null;
    renderCart();
  } catch (err) {
    notifyPOS('Error settling bill', '#e74c3c');
  } finally {
    btn.disabled = false;
  }
}

function notifyPOS(msg, color) {
  const toast = document.createElement('div');
  toast.style = `position:fixed; top:20px; left:50%; transform:translateX(-50%); background:${color || '#333'}; color:white; padding:15px 40px; border-radius:10px; font-weight:800; font-size:1rem; box-shadow:0 10px 30px rgba(0,0,0,0.1); z-index:9999;`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Search
document.getElementById('menuSearch').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  const f = menuItems.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
  renderMenuGrid(f);
});
