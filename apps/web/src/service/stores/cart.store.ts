"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { shallow } from "zustand/shallow";

export const CART_STORAGE_KEY = "cart_v1";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  maxQuantity?: number;
};

export type AddCartItemInput = Omit<CartItem, "quantity"> & { quantity?: number };

export type CartConflictType = "NOT_FOUND" | "OUT_OF_STOCK" | "QTY_ADJUSTED" | "PRICE_CHANGED";

export type CartConflict = {
  id: string;
  type: CartConflictType;
  message: string;
  previousQuantity?: number;
  newQuantity?: number;
  previousPrice?: number;
  newPrice?: number;
};

export type CartSyncPayload = {
  items: Array<{ id: string; quantity: number; clientPrice: number }>;
};

export type CartSyncResult = {
  ok: boolean;
  items?: CartItem[];
  conflicts?: CartConflict[];
  updatedAt?: number;
};

export type CartSyncAdapter = (payload: CartSyncPayload) => Promise<CartSyncResult>;

export type CartState = {
  items: CartItem[];
  syncing: boolean;
  pendingSync: boolean;
  lastUpdatedAt?: number;
  lastSyncedAt?: number;
  lastConflicts: CartConflict[];
  syncAdapter?: CartSyncAdapter;
};

export type CartActions = {
  addItem: (item: AddCartItemInput) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;

  setItemsFromServer: (items: CartItem[], updatedAt?: number, conflicts?: CartConflict[]) => void;
  setSyncAdapter: (adapter?: CartSyncAdapter) => void;
  sync: () => Promise<CartSyncResult>;
};

export type CartStore = CartState & CartActions;

function clampQuantity(quantity: number, maxQuantity?: number) {
  const clamped = Math.max(1, Math.floor(quantity));
  return typeof maxQuantity === "number" ? Math.min(clamped, maxQuantity) : clamped;
}

function now() {
  return Date.now();
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      syncing: false,
      pendingSync: false,
      lastUpdatedAt: undefined,
      lastSyncedAt: undefined,
      lastConflicts: [],
      syncAdapter: undefined,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          const nextUpdatedAt = now();

          if (existing) {
            const nextQuantity = clampQuantity(
              existing.quantity + (item.quantity ?? 1),
              existing.maxQuantity
            );
            return {
              items: state.items.map((i) => (i.id === item.id ? { ...i, quantity: nextQuantity } : i)),
              pendingSync: true,
              lastUpdatedAt: nextUpdatedAt,
            };
          }

          const nextItem: CartItem = {
            ...item,
            quantity: clampQuantity(item.quantity ?? 1, item.maxQuantity),
          };

          return {
            items: [...state.items, nextItem],
            pendingSync: true,
            lastUpdatedAt: nextUpdatedAt,
          };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
          pendingSync: true,
          lastUpdatedAt: now(),
        })),

      setQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) => {
            if (i.id !== id) return i;
            return { ...i, quantity: clampQuantity(quantity, i.maxQuantity) };
          }),
          pendingSync: true,
          lastUpdatedAt: now(),
        })),

      clear: () =>
        set({
          items: [],
          pendingSync: true,
          lastUpdatedAt: now(),
        }),

      setItemsFromServer: (items, updatedAt, conflicts) =>
        set({
          items,
          syncing: false,
          pendingSync: false,
          lastUpdatedAt: updatedAt,
          lastSyncedAt: now(),
          lastConflicts: conflicts ?? [],
        }),

      setSyncAdapter: (adapter) => set({ syncAdapter: adapter }),

      sync: async () => {
        const adapter = get().syncAdapter;
        if (!adapter) return { ok: false };

        const snapshot = get().items;
        set({ syncing: true });
        try {
          const result = await adapter({
            items: snapshot.map((i) => ({ id: i.id, quantity: i.quantity, clientPrice: i.price })),
          });

          if (!result.ok) {
            set({ syncing: false });
            return result;
          }

          if (result.items) {
            set({
              items: result.items,
              syncing: false,
              pendingSync: false,
              lastSyncedAt: now(),
              lastUpdatedAt: result.updatedAt,
              lastConflicts: result.conflicts ?? [],
            });
          } else {
            set({
              syncing: false,
              pendingSync: false,
              lastSyncedAt: now(),
              lastUpdatedAt: result.updatedAt,
              lastConflicts: result.conflicts ?? [],
            });
          }

          return result;
        } catch {
          set({ syncing: false });
          return { ok: false };
        }
      },
    }),
    {
      name: CART_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export const cartSelectors = {
  items: (state: CartStore) => state.items,
  total: (state: CartStore) => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  count: (state: CartStore) => state.items.reduce((sum, item) => sum + item.quantity, 0),
  itemById: (id: string) => (state: CartStore) => state.items.find((item) => item.id === id),
  pendingSync: (state: CartStore) => state.pendingSync,
  syncing: (state: CartStore) => state.syncing,
  actions: (state: CartStore) => ({
    addItem: state.addItem,
    removeItem: state.removeItem,
    setQuantity: state.setQuantity,
    clear: state.clear,
    sync: state.sync,
    setSyncAdapter: state.setSyncAdapter,
    setItemsFromServer: state.setItemsFromServer,
  }),
};

export function useCartItems() {
  return useCartStore(cartSelectors.items);
}

export function useCartTotal() {
  return useCartStore(cartSelectors.total);
}

export function useCartCount() {
  return useCartStore(cartSelectors.count);
}

export function useCartMeta() {
  return useCartStore(
    (s) => ({ syncing: s.syncing, pendingSync: s.pendingSync, lastConflicts: s.lastConflicts }),
    shallow
  );
}

export function useCartItem(id: string) {
  return useCartStore(cartSelectors.itemById(id));
}

export function useCartActions() {
  return useCartStore(cartSelectors.actions, shallow);
}
