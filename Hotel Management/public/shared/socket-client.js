// Shared Socket.io client utilities

const SOCKET_URL = window.location.origin;

function initSocket() {
  const socket = io(SOCKET_URL);

  socket.on('connect', () => {
    console.log('🔌 Connected to server');
  });

  socket.on('disconnect', () => {
    console.log('⚠️ Disconnected from server');
  });

  socket.on('connect_error', () => {
    console.log('❌ Connection error — retrying...');
  });

  return socket;
}

// ─── Toast Notifications ───

function createToastContainer() {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message, type = 'info', duration = 3000) {
  const container = createToastContainer();
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    toast.style.transition = 'all 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─── Formatting Helpers ───

function formatCurrency(amount) {
  return '₹' + parseFloat(amount || 0).toFixed(2);
}

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── API Helper ───

async function api(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  } catch (err) {
    showToast(err.message, 'error');
    throw err;
  }
}

// ─── VegBadge ───

function vegBadge(isVeg) {
  const cls = isVeg ? 'badge-veg' : 'badge-nonveg';
  return `<span class="${cls}">●</span>`;
}
