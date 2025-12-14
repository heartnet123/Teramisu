"use client";

import { create } from "zustand";
import type React from "react";
import { getServerUrl } from "@/lib/server-url";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  maxQuantity?: number;
};

type AddItemPayload = Omit<CartItem, "quantity"> & { quantity?: number };

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

interface CartState {
  items: CartItem[];
  syncing: boolean;
  lastConflicts: CartConflict[];
  lastUpdatedAt?: number;
  addItem: (item: AddItemPayload) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, quantity: number) => void;
  clearCart: () => void;
  syncWithServer: () => Promise<{ ok: boolean; conflicts: CartConflict[] }>; 
  getTotal: () => number;
  itemCount: () => number;
}

export const STORAGE_KEY = "cart_v1";
export const useCartStore = create<CartState>((set, get) => {
  const initialItems: CartItem[] =
    typeof window !== "undefined"
      ? (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as CartItem[]) ?? []
      : [];
  return {
    items: initialItems,
    syncing: false,
    lastConflicts: [],
    lastUpdatedAt: undefined,
    addItem: (item: AddItemPayload) =>
      set((state) => {
        const exists = state.items.find((i) => i.id === item.id);
        if (exists) {
          const max = exists.maxQuantity;
          const nextQty = exists.quantity + (item.quantity ?? 1);
          const clampedQty = typeof max === "number" ? Math.min(nextQty, max) : nextQty;
          return {
            items: state.items.map((i) => (i.id === item.id ? { ...i, quantity: clampedQty } : i)),
          };
        }
        return { items: [...state.items, { ...item, quantity: item.quantity ?? 1 }] };
      }),

    removeItem: (id: string) =>
      set((state) => ({
        items: state.items.filter((i) => i.id !== id),
      })),

    updateQty: (id: string, quantity: number) =>
      set((state) => ({
        items: state.items.map((i) => {
          if (i.id !== id) return i;
          const max = i.maxQuantity;
          const clamped =
            typeof max === "number"
              ? Math.min(Math.max(1, quantity), max)
              : Math.max(1, quantity);
          return { ...i, quantity: clamped };
        }),
      })),

    clearCart: () => set({ items: [] }),

    syncWithServer: async () => {
      const current = get().items;
      set({ syncing: true });
      try {
        const res = await fetch(`${getServerUrl()}/api/cart/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: current.map((i) => ({ id: i.id, quantity: i.quantity, clientPrice: i.price })),
          }),
        });

        if (!res.ok) {
          set({ syncing: false });
          return { ok: false, conflicts: [] };
        }

        const data = (await res.json()) as {
          items: Array<{
            id: string;
            name: string;
            image: string;
            price: number;
            quantity: number;
            maxQuantity: number;
          }>;
          conflicts: CartConflict[];
          total: number;
          updatedAt?: number;
        };

        set({
          items: data.items.map((i) => ({
            id: i.id,
            name: i.name,
            image: i.image,
            price: i.price,
            quantity: i.quantity,
            maxQuantity: i.maxQuantity,
          })),
          syncing: false,
          lastConflicts: data.conflicts ?? [],
          lastUpdatedAt: data.updatedAt,
        });

        return { ok: true, conflicts: data.conflicts ?? [] };
      } catch {
        set({ syncing: false });
        return { ok: false, conflicts: [] };
      }
    },

    getTotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
    itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
  };
});

// persist items to localStorage on changes
if (typeof window !== "undefined") {
  useCartStore.subscribe((state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {}
  });
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return children;
}
