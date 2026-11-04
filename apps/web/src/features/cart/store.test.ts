import { beforeEach, describe, expect, it } from 'vitest';
import { cartCount, cartTotal, clampQty, groupByEmprendimiento, useCart } from './store';

const item = (productoId: number, empId: number, precio = 1000, stock = 5) => ({
  productoId,
  nombre: `P${productoId}`,
  precio,
  imagen: null,
  stock,
  emprendimiento: { id: empId, nombre: `E${empId}` },
});

describe('cart store', () => {
  beforeEach(() => useCart.getState().clear());

  it('adds and increments the same product (HU-18 CA3)', () => {
    useCart.getState().add(item(1, 1));
    useCart.getState().add(item(1, 1), 2);
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].cantidad).toBe(3);
  });

  it('never exceeds stock', () => {
    expect(useCart.getState().add(item(1, 1, 1000, 2), 10)).toBe(2);
    useCart.getState().setQuantity(1, 99);
    expect(useCart.getState().items[0].cantidad).toBe(2);
  });

  it('never goes below 1 (HU-19 CA1)', () => {
    useCart.getState().add(item(1, 1));
    useCart.getState().setQuantity(1, 0);
    expect(useCart.getState().items[0].cantidad).toBe(1);
  });

  it('removes a line and clears the cart (HU-19 CA3)', () => {
    useCart.getState().add(item(1, 1));
    useCart.getState().add(item(2, 1));
    useCart.getState().remove(1);
    expect(useCart.getState().items.map((i) => i.productoId)).toEqual([2]);
    useCart.getState().clear();
    expect(useCart.getState().items).toEqual([]);
  });

  it('computes totals (HU-19 CA2) and groups one order per business (HU-20 CA2)', () => {
    useCart.getState().add(item(1, 1, 1000), 2);
    useCart.getState().add(item(2, 2, 500), 3);
    useCart.getState().add(item(3, 1, 250), 1);
    const { items } = useCart.getState();
    expect(cartTotal(items)).toBe(3750);
    expect(cartCount(items)).toBe(6);
    const groups = groupByEmprendimiento(items);
    expect(groups).toHaveLength(2);
    expect(groups.find((g) => g.emprendimiento.id === 1)?.subtotal).toBe(2250);
  });

  it('clampQty handles garbage input', () => {
    expect(clampQty(Number.NaN, 5)).toBe(1);
    expect(clampQty(2.7, 5)).toBe(2);
  });
});
