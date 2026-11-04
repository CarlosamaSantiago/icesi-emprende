import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase',
  {
    variants: {
      tone: {
        primary: 'bg-primary-soft text-primary',
        success: 'bg-success-soft text-success',
        danger: 'bg-danger-soft text-danger',
        warning: 'bg-warning-soft text-warning',
        info: 'bg-info-soft text-info',
        accent: 'bg-accent-soft text-accent',
        neutral: 'bg-surface-muted text-muted',
        solid: 'bg-primary text-white',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
