'use client';

import { Check, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button, type ButtonProps } from '@/components/ui/button';
import type { ProductoResumen } from '@/lib/api/types';
import { useCart } from '../store';

interface Props extends Pick<ButtonProps, 'size' | 'className'> {
  producto: ProductoResumen;
  cantidad?: number;
  /** Whether the visitor is logged in (HU-18: only authenticated buyers). */
  authenticated: boolean;
}

export function AddToCartButton({ producto, cantidad = 1, authenticated, size = 'sm', className }: Props) {
  const add = useCart((s) => s.add);
  const inCart = useCart((s) => s.items.find((i) => i.productoId === producto.id)?.cantidad ?? 0);
  const [added, setAdded] = useState(false);

  const available = producto.estado === 'ACTIVO' && producto.stockDisponible > 0; // HU-18 CA1
  if (!available) {
    return (
      <Button size={size} variant="secondary" disabled className={className}>
        No disponible
      </Button>
    );
  }
  if (!authenticated) {
    return (
      <Button size={size} variant="soft" className={className} asChild>
        <a href={`/login?next=/productos/${producto.id}`}>Inicia sesión para comprar</a>
      </Button>
    );
  }

  const atLimit = inCart >= producto.stockDisponible;
  return (
    <Button
      size={size}
      className={className}
      disabled={atLimit}
      onClick={() => {
        const qty = add(
          {
            productoId: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagenPrincipal,
            stock: producto.stockDisponible,
            emprendimiento: { id: producto.emprendimiento.id, nombre: producto.emprendimiento.nombre },
          },
          cantidad,
        );
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
        toast.success(`${producto.nombre} en el carrito (${qty})`);
      }}
    >
      {added ? <Check aria-hidden /> : <ShoppingCart aria-hidden />}
      {atLimit ? 'Máximo disponible' : added ? 'Agregado' : 'Agregar'}
    </Button>
  );
}
