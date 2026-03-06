"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Asset } from "@/types";

export type CartState = {
  items: Asset[];
  addItem: (asset: Asset) => void;
  removeItem: (assetId: string) => void;
  clearCart: () => void;
  isInCart: (assetId: string) => boolean;
};

function dedupeById(items: Asset[], asset: Asset): Asset[] {
  const has = items.some((i) => i.id === asset.id);
  if (has) return items;
  return [...items, asset];
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem(asset) {
        set((state) => ({
          items: dedupeById(state.items, asset),
        }));
      },

      removeItem(assetId) {
        set((state) => ({
          items: state.items.filter((i) => i.id !== assetId),
        }));
      },

      clearCart() {
        set({ items: [] });
      },

      isInCart(assetId) {
        return get().items.some((i) => i.id === assetId);
      },
    }),
    { name: "cart-storage" }
  )
);

/** Selectors for derived state */
export const useCartItemCount = () => useCart((s) => s.items.length);
export const useCartTotalPrice = () =>
  useCart((s) => s.items.reduce((sum, a) => sum + Number(a.price), 0));
