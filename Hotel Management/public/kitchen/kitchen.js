// ═══════════════════════════════════════════════════════
//  DINEFLOW v1.2 — KITCHEN KDS JS (LIGHT OLIVE)
//  Optimized for high-speed item fulfillment
// ═══════════════════════════════════════════════════════

const socket = initSocket();

// ─── STATE ───
let kotOrders = [];
let currentCategory = 'Requests';

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
  loadPendingOrders();
  setInterval(updateTimers, 60000);
});

// ─── TABS ───
function switchTab(tab) {
  currentCategory = tab === 'requests' ? 'Requests' : 'Preparing';
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.textContent.toLowerCase() === tab));
  renderKOTGrid();
}

// ─── LOAD ORDERS ───
async function loadPendingOrders() {
  kotOrders = await api('/api/kitchen/pending');
  renderKOTGrid();
}

function renderKOTGrid() {
  const grid = document.getElementById('kotGrid');
  const empty = document.getElementById('kitchenEmpty');
  const countEl = document.getElementById('pendingCount');

  // Filter based on TAB
  let filtered = [];
  if (currentCategory === 'Requests') {
    filtered = kotOrders.filter(k => k.items.some(i => i.status === 'pending'));
  } else {
    filtered = kotOrders.filter(k => k.items.some(i => i.status === 'preparing'));
  }

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    countEl.textContent = '0 PENDING';
    return;
  }

  empty.style.display = 'none';
  countEl.textContent = `${filtered.length} ACTIVE ORDERS`;

  grid.innerHTML = filtered.map(kot => {
    const elapsed = getElapsedMinutes(kot.createdAt);
    return `
      <div class="kds-card animate-scale">
        <div class="card-header">
          <div>
            <div class="kds-table-num">Order T${kot.tableNumber}</div>
            <div class="kds-time">${formatTime(kot.createdAt)}</div>
          </div>
          <div class="kds-elapsed">${elapsed}m elapsed</div>
        </div>

        <div class="kds-items">
          ${kot.items.map(item => {
            const isMatch = (currentCategory === 'Requests' && item.status === 'pending') || (currentCategory === 'Preparing' && item.status === 'preparing');
            if (!isMatch) return '';
            
            return `
              <div class="kds-item">
                <img src="${item.image_url}" class="kds-item-img" onerror="this.src='/images/placeholder-food.jpg'">
                <div class="kds-item-info">
                  <div class="kds-item-name">${item.name}</div>
                  <div class="kds-item-qty">x${item.quantity}</div>
                </div>
                <button class="kds-status-btn ${item.status}" 
                        onclick="cycleItemStatus(${item.id}, '${item.status}')">
                  ${item.status === 'ready' ? '✅' : '🍳'}
                </button>
              </div>
            `;
          }).join('')}
        </div>

        <div class="status-stepper">
          <div class="step-dot active">R</div>
          <div class="step-line"></div>
          <div class="step-dot ${kot.items.some(i => i.status === 'preparing') ? 'active' : ''}">P</div>
          <div class="step-line"></div>
          <div class="step-dot">F</div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── STATUS MANAGEMENT ───
async function cycleItemStatus(itemId, current) {
  const next = current === 'pending' ? 'preparing' : 'ready';
  try {
    await api(`/api/order-items/${itemId}/status`, { method: 'PATCH', body: { status: next } });
    
    // Refresh local
    kotOrders.forEach(k => k.items.forEach(i => { if (i.id === itemId) i.status = next; }));
    
    // Clear out served/ready items if needed or just re-render
    renderKOTGrid();
    notifyKitchen(`Item marked as ${next.toUpperCase()}`);
  } catch (err) {
    notifyKitchen('Sync error', '#f44336');
  }
}

// ─── UTILS ───
function getElapsedMinutes(time) {
  return Math.floor((new Date() - new Date(time)) / 60000);
}

function updateTimers() { renderKOTGrid(); }

function notifyKitchen(msg, color) {
  const toast = document.createElement('div');
  toast.className = 'toast animate-scale';
  toast.style = `position:fixed; top:20px; right:20px; padding:15px 30px; border-radius:12px; background:${color || '#889e48'}; color:white; font-weight:900; z-index:9999; box-shadow:0 10px 30px rgba(0,0,0,0.1)`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ─── SOCKETS ───
socket.on('kitchen:kot', data => {
  console.log('🍽️ NEW KOT RECEIVED:', data);
  
  // Find existing order for the same table to merge if possible
  const existingOrder = kotOrders.find(o => o.orderId === data.orderId);
  if (existingOrder) {
    existingOrder.items = [...existingOrder.items, ...data.items];
  } else {
    kotOrders.push({
      orderId: data.orderId,
      tableNumber: data.tableNumber,
      items: data.items,
      createdAt: data.timestamp
    });
  }
  
  renderKOTGrid();
  notifyKitchen(`🔔 New Request for Table ${data.tableNumber}!`);
  playNotification();
});

function playNotification() {
  const audio = document.getElementById('notifSound');
  if (audio) audio.play().catch(e => {});
}
