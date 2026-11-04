'use client';

import { Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import type { Categoria } from '@/lib/api/types';
import { cn } from '@/lib/utils';

/** HU-16: search term + category chips, state kept in the URL (shareable, back-button friendly). */
export function CatalogFilters({ categorias }: { categorias: Categoria[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const q = params.get('q') ?? '';
  const categoriaId = params.get('categoria');

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete('page');
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  return (
    <div className={cn('mb-6 space-y-4', pending && 'opacity-70')}>
      <form
        role="search"
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const value = new FormData(e.currentTarget).get('q');
          update({ q: typeof value === 'string' ? value.trim().slice(0, 100) : null });
        }}
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle"
            aria-hidden
          />
          <Input
            key={q}
            name="q"
            defaultValue={q}
            placeholder="Busca productos, servicios o emprendimientos…"
            aria-label="Buscar"
            maxLength={100}
            className="pl-10"
          />
        </div>
        <Button type="submit" loading={pending}>
          Buscar
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por categoría">
        <Chip active={!categoriaId} onClick={() => update({ categoria: null })}>
          Todas
        </Chip>
        {categorias.map((c) => (
          <Chip
            key={c.id}
            active={categoriaId === String(c.id)}
            onClick={() => update({ categoria: String(c.id) })}
          >
            {c.nombre}
          </Chip>
        ))}
        {(q || categoriaId) && (
          <Button variant="ghost" size="sm" onClick={() => update({ q: null, categoria: null })}>
            <X aria-hidden /> Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border-[1.5px] px-3.5 py-1.5 text-xs font-semibold transition',
        active
          ? 'border-primary bg-primary text-white'
          : 'border-border bg-surface text-muted hover:border-primary hover:text-primary',
      )}
    >
      {children}
    </button>
  );
}
