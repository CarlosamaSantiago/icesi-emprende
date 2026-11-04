'use client';

import { useState } from 'react';
import { AddToCartButton } from '@/features/cart/components/add-to-cart-button';
import { QuantityInput } from '@/features/cart/components/quantity-input';
import { clampQty } from '@/features/cart/store';
import type { ProductoResumen } from '@/lib/api/types';

export function ProductPurchase({
  producto,
  authenticated,
}: {
  producto: ProductoResumen;
  authenticated: boolean;
}) {
  const [qty, setQty] = useState(1);
  const canBuy = authenticated && producto.estado === 'ACTIVO' && producto.stockDisponible > 0;
  return (
    <div className="flex flex-wrap items-center gap-3">
      {canBuy && (
        <QuantityInput
          value={qty}
          max={producto.stockDisponible}
          onChange={(v) => setQty(clampQty(v, producto.stockDisponible))}
        />
      )}
      <AddToCartButton producto={producto} cantidad={qty} authenticated={authenticated} size="lg" />
    </div>
  );
}
