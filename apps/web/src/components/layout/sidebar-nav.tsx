'use client';

import {
  Briefcase,
  Package,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Store,
  User,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { NavIcon, NavSection } from './nav-config';

const ICONS: Record<NavIcon, LucideIcon> = {
  store: Store,
  cart: ShoppingCart,
  bag: ShoppingBag,
  briefcase: Briefcase,
  package: Package,
  shield: Shield,
  user: User,
};

export function SidebarNav({ sections, onNavigate }: { sections: NavSection[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegación principal" className="flex-1 overflow-y-auto pb-6">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="px-5 pt-5 pb-2 text-[10px] font-bold tracking-[1.2px] text-muted uppercase">
            {section.title}
          </p>
          <ul>
            {section.items.map(({ href, label, icon }) => {
              const Icon = ICONS[icon];
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 px-5 py-2.5 text-[13.5px] font-medium text-sidebar-fg transition-colors',
                      'hover:bg-white/5 hover:text-white',
                      active && 'border-r-3 border-primary-light bg-primary/25 text-white',
                    )}
                  >
                    <Icon
                      className={cn('size-[18px] shrink-0', active ? 'opacity-100' : 'opacity-70')}
                      aria-hidden
                    />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
