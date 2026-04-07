'use client';

/**
 * Sync Utility for saving 'Pending Orders' to IndexedDB if the network is offline.
 * Automatically pushes to the server once online.
 */
export class SyncUtility {
  static async saveOfflineOrder(orderData: any) {
    if (!('indexedDB' in window)) {
      console.error('IndexedDB not supported');
      return;
    }

    const openRequest = window.indexedDB.open('HotelSaaS_OfflineOrders', 1);

    openRequest.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pending_orders')) {
        db.createObjectStore('pending_orders', { keyPath: 'tempId', autoIncrement: true });
      }
    };

    openRequest.onsuccess = (e: any) => {
      const db = e.target.result;
      const transaction = db.transaction('pending_orders', 'readwrite');
      const store = transaction.objectStore('pending_orders');
      store.add({ ...orderData, createdAt: new Date() });
    };
  }

  static async syncOfflineOrders() {
    if (!navigator.onLine) return;

    const openRequest = window.indexedDB.open('HotelSaaS_OfflineOrders', 1);

    openRequest.onsuccess = (e: any) => {
      const db = e.target.result;
      const transaction = db.transaction('pending_orders', 'readwrite');
      const store = transaction.objectStore('pending_orders');
      const request = store.getAll();

      request.onsuccess = async () => {
        const pending = request.result;
        for (const order of pending) {
          try {
            const res = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(order),
            });
            if (res.ok) {
              store.delete(order.tempId);
              console.log('Successfully synced offline order:', order.tempId);
            }
          } catch (err) {
            console.error('Sync failed for order:', order.tempId, err);
          }
        }
      };
    };
  }
}

// Global Listener for recovery
if (typeof window !== 'undefined') {
  window.addEventListener('online', SyncUtility.syncOfflineOrders);
}
