'use client';

import { Menu, Store, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { NavSection } from './nav-config';
import { SidebarNav } from './sidebar-nav';

/**
 * Layout v1: fixed dark sidebar (260px) + sticky topbar. On mobile the sidebar becomes a drawer.
 * `topbar` is rendered by the server layout and slotted in here.
 */
export function AppShell({
  sections,
  topbar,
  children,
}: {
  sections: NavSection[];
  topbar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {open && (
        <div className="fixed inset-0 z-40 bg-fg/40 md:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-sidebar flex-col bg-sidebar transition-transform md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border px-5 py-6">
          <Link href="/marketplace" className="flex items-center gap-2.5 font-extrabold text-white">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary">
              <Store className="size-5" aria-hidden />
            </span>
            Emprende ICESI
          </Link>
          <button
            className="text-sidebar-fg md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="size-5" />
          </button>
        </div>
        <SidebarNav sections={sections} onNavigate={() => setOpen(false)} />
      </aside>

      <div className="flex min-h-screen flex-col md:ml-sidebar">
        <header className="sticky top-0 z-30 flex h-topbar items-center gap-4 border-b border-border bg-surface px-4 shadow-sm md:px-8">
          <button className="text-muted md:hidden" onClick={() => setOpen(true)} aria-label="Abrir menú">
            <Menu className="size-5" />
          </button>
          {topbar}
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
