import type { Role } from '@/lib/api/types';

export type NavIcon = 'store' | 'cart' | 'bag' | 'briefcase' | 'package' | 'shield' | 'user';

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
}
export interface NavSection {
  title: string;
  items: NavItem[];
}

/** Navigation is derived from roles. This is UX only — the API enforces authorization. */
export function buildNav(roles: Role[] | null): NavSection[] {
  const sections: NavSection[] = [
    { title: 'Principal', items: [{ href: '/marketplace', label: 'Marketplace', icon: 'store' }] },
  ];
  if (!roles) return sections;

  sections[0].items.push(
    { href: '/carrito', label: 'Carrito', icon: 'cart' },
    { href: '/mis-compras', label: 'Mis compras', icon: 'bag' },
  );
  if (roles.includes('EMPRENDEDOR') || roles.includes('ADMIN')) {
    sections.push({
      title: 'Mi negocio',
      items: [
        { href: '/mi-negocio', label: 'Mis emprendimientos', icon: 'briefcase' },
        { href: '/pedidos-recibidos', label: 'Pedidos recibidos', icon: 'package' },
      ],
    });
  }
  if (roles.includes('ADMIN')) {
    sections.push({
      title: 'Administración',
      items: [{ href: '/admin/emprendimientos', label: 'Emprendimientos', icon: 'shield' }],
    });
  }
  sections.push({ title: 'Cuenta', items: [{ href: '/perfil', label: 'Mi perfil', icon: 'user' }] });
  return sections;
}
