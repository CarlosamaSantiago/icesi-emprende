import type { Role } from '@/lib/api/types';

export type NavIcon =
  | 'store'
  | 'cart'
  | 'bag'
  | 'briefcase'
  | 'package'
  | 'shield'
  | 'user'
  | 'chart'
  | 'star'
  | 'users'
  | 'tag'
  | 'calendar'
  | 'trophy'
  | 'gauge'
  | 'wallet'
  | 'award';

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
    { href: '/mis-calificaciones', label: 'Mis calificaciones', icon: 'star' },
  );
  if (roles.includes('EMPRENDEDOR') || roles.includes('ADMIN')) {
    sections.push({
      title: 'Mi negocio',
      items: [
        { href: '/mi-negocio', label: 'Mis emprendimientos', icon: 'briefcase' },
        { href: '/pedidos-recibidos', label: 'Pedidos recibidos', icon: 'package' },
        { href: '/metricas', label: 'Métricas de ventas', icon: 'chart' },
      ],
    });
  }
  if (roles.includes('ADMIN')) {
    sections.push({
      title: 'Administración',
      items: [
        { href: '/admin/emprendimientos', label: 'Emprendimientos', icon: 'shield' },
        { href: '/admin/usuarios', label: 'Usuarios y roles', icon: 'users' },
        { href: '/admin/categorias', label: 'Categorías', icon: 'tag' },
        { href: '/admin/semestres', label: 'Por semestre', icon: 'calendar' },
        { href: '/admin/ranking', label: 'Ranking', icon: 'trophy' },
        { href: '/admin/indicadores', label: 'Indicadores', icon: 'gauge' },
        { href: '/admin/pagos', label: 'Pagos y comisiones', icon: 'wallet' },
        { href: '/admin/emprendimiento-del-mes', label: 'Emprendimiento del Mes', icon: 'award' },
      ],
    });
  }
  sections.push({ title: 'Cuenta', items: [{ href: '/perfil', label: 'Mi perfil', icon: 'user' }] });
  return sections;
}
