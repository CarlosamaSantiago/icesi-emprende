import { Badge, type BadgeProps } from './badge';

/** Single source of truth for how a domain status is displayed. */
const STATUS: Record<string, { label: string; tone: NonNullable<BadgeProps['tone']> }> = {
  ACTIVO: { label: 'Activo', tone: 'success' },
  INACTIVO: { label: 'Inactivo', tone: 'neutral' },
  PENDIENTE: { label: 'Pendiente', tone: 'warning' },
  CONFIRMADO: { label: 'Confirmado', tone: 'info' },
  PREPARANDO: { label: 'Preparando', tone: 'accent' },
  ENTREGADO: { label: 'Entregado', tone: 'success' },
  CANCELADO: { label: 'Cancelado', tone: 'danger' },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = STATUS[status] ?? { label: status, tone: 'neutral' as const };
  return (
    <Badge tone={s.tone} className={className}>
      {s.label}
    </Badge>
  );
}
