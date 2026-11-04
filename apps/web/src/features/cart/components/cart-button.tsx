'use client';

import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cartCount, useCart } from '../store';

export function CartButton() {
  const items = useCart((s) => s.items);
  // Avoid hydration mismatch: the persisted cart only exists on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = mounted ? cartCount(items) : 0;

  return (
    <Link
      href="/carrito"
      className="relative inline-flex size-10 items-center justify-center rounded-full text-muted transition hover:bg-primary-soft hover:text-primary"
      aria-label={`Carrito, ${count} productos`}
    >
      <ShoppingCart className="size-5" aria-hidden />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
