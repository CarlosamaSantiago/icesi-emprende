'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** A cart line keeps the reference price shown when it was added (HU-18 CA2). The API recalculates at checkout. */
export interface CartItem {
  productoId: number;
  nombre: string;
  precio: number;
  imagen: string | null;
  stock: number;
  emprendimiento: { id: number; nombre: string };
  cantidad: number;
}

interface CartState {
  items: CartItem[];
  /** Adds or increments, never above stock (HU-18 CA3). Returns the resulting quantity. */
  add: (item: Omit<CartItem, 'cantidad'>, cantidad?: number) => number;
  /** Sets quantity within 1…stock (HU-19 CA1). */
  setQuantity: (productoId: number, cantidad: number) => void;
  remove: (productoId: number) => void;
  clear: () => void;
}

export const clampQty = (qty: number, stock: number) => Math.max(1, Math.min(Math.floor(qty) || 1, stock));

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, cantidad = 1) => {
        const existing = get().items.find((i) => i.productoId === item.productoId);
        const next = clampQty((existing?.cantidad ?? 0) + cantidad, item.stock);
        set((s) => ({
          items: existing
            ? s.items.map((i) => (i.productoId === item.productoId ? { ...i, ...item, cantidad: next } : i))
            : [...s.items, { ...item, cantidad: next }],
        }));
        return next;
      },
      setQuantity: (productoId, cantidad) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.productoId === productoId ? { ...i, cantidad: clampQty(cantidad, i.stock) } : i,
          ),
        })),
      remove: (productoId) => set((s) => ({ items: s.items.filter((i) => i.productoId !== productoId) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'ei-cart', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);

/** Pure helpers (unit-tested). */
export const cartTotal = (items: CartItem[]) => items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
export const cartCount = (items: CartItem[]) => items.reduce((sum, i) => sum + i.cantidad, 0);

/** Group lines by business — each group becomes one order (HU-20 CA2). */
export function groupByEmprendimiento(items: CartItem[]) {
  const groups = new Map<
    number,
    { emprendimiento: CartItem['emprendimiento']; items: CartItem[]; subtotal: number }
  >();
  for (const it of items) {
    const g = groups.get(it.emprendimiento.id) ?? {
      emprendimiento: it.emprendimiento,
      items: [],
      subtotal: 0,
    };
    g.items.push(it);
    g.subtotal += it.precio * it.cantidad;
    groups.set(it.emprendimiento.id, g);
  }
  return [...groups.values()];
}
