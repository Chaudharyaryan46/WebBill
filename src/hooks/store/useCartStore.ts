import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        const existing = get().items.find((i) => i.id === newItem.id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === newItem.id
                ? { ...i, quantity: i.quantity + newItem.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, newItem] });
        }
      },
      removeItem: (id) =>
        set({ items: get().items.filter((i) => i.id !== id) }),
      updateQuantity: (id, delta) => {
        set({
          items: get().items
            .map((i) =>
              i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
            )
            .filter((i) => i.quantity > 0),
        });
      },
      clearCart: () => set({ items: [] }),
      getTotal: () =>
        get().items.reduce((acc, current) => acc + current.price * current.quantity, 0),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
