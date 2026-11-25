'use client';

import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Notificacion, NotificacionesResponse, Role } from '@/lib/api/types';
import { cn, formatDate } from '@/lib/utils';
import { markAllReadAction, markReadAction } from '../actions';

const POLL_MS = 20_000;

function hrefFor(n: Notificacion, roles: Role[]) {
  switch (n.tipo) {
    case 'PEDIDO':
      return roles.includes('EMPRENDEDOR') || roles.includes('ADMIN') ? '/pedidos-recibidos' : '/mis-compras';
    case 'PAGO':
      return '/mis-compras';
    case 'RECONOCIMIENTO':
      return n.referenciaId ? `/emprendimientos/${n.referenciaId}` : '/marketplace';
    default:
      return '/mi-negocio';
  }
}

/**
 * HU-41 / HU-42: unread counter + list. The BFF cannot hold a WebSocket (serverless web tier), so the bell polls
 * `/notificaciones/feed` and raises a toast when new unread items arrive. Counters are per user (API-scoped).
 */
export function NotificationBell({ roles }: { roles: Role[] }) {
  const [data, setData] = useState<NotificacionesResponse>({ noLeidas: 0, items: [] });
  const [open, setOpen] = useState(false);
  const lastSeen = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/notificaciones/feed', { cache: 'no-store' });
      if (!res.ok) return;
      const next = (await res.json()) as NotificacionesResponse;
      const newest = next.items.find((i) => !i.leida);
      if (lastSeen.current !== null && newest && newest.id > lastSeen.current) toast.info(newest.contenido);
      lastSeen.current = Math.max(lastSeen.current ?? 0, ...next.items.map((i) => i.id));
      setData(next);
    } catch {
      /* network blip: keep the last known state */
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const read = async (n: Notificacion) => {
    if (n.leida) return;
    setData((d) => ({
      noLeidas: Math.max(0, d.noLeidas - 1),
      items: d.items.map((i) => (i.id === n.id ? { ...i, leida: true } : i)),
    }));
    await markReadAction({ id: n.id });
  };
  const readAll = async () => {
    setData((d) => ({ noLeidas: 0, items: d.items.map((i) => ({ ...i, leida: true })) }));
    await markAllReadAction();
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        className="relative flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-surface-muted hover:text-fg"
        aria-label={`Notificaciones${data.noLeidas ? `, ${data.noLeidas} sin leer` : ''}`}
      >
        <Bell className="size-5" aria-hidden />
        {data.noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-danger-solid px-1 text-[10px] font-bold text-white">
            {data.noLeidas > 99 ? '99+' : data.noLeidas}
          </span>
        )}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-[13.5px] font-bold">Notificaciones</p>
            {data.noLeidas > 0 && (
              <button onClick={readAll} className="text-xs font-semibold text-primary hover:underline">
                Marcar todas como leídas
              </button>
            )}
          </div>
          {data.items.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-muted">No tienes notificaciones.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-border overflow-y-auto">
              {data.items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={hrefFor(n, roles)}
                    onClick={() => {
                      void read(n);
                      setOpen(false);
                    }}
                    className={cn(
                      'block px-4 py-3 text-[13px] hover:bg-surface-muted',
                      !n.leida && 'bg-primary-soft/40',
                    )}
                  >
                    <span className="flex items-start gap-2">
                      {!n.leida && (
                        <span
                          className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                          aria-label="Sin leer"
                        />
                      )}
                      <span>
                        <span className="block">{n.contenido}</span>
                        <span className="text-xs text-muted">{formatDate(n.fecha)}</span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
