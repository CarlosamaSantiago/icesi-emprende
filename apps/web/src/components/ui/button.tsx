import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition-all ' +
    'hover:-translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white shadow-primary hover:bg-primary-hover',
        secondary: 'border-[1.5px] border-border bg-surface-muted text-fg hover:bg-border',
        success: 'bg-success-solid text-white hover:bg-success',
        danger: 'bg-danger-solid text-white hover:bg-danger',
        soft: 'bg-primary-soft text-primary hover:bg-primary hover:text-white',
        'soft-danger': 'bg-danger-soft text-danger hover:bg-danger-solid hover:text-white',
        ghost: 'text-muted hover:bg-surface-muted hover:text-fg hover:translate-y-0',
        link: 'text-primary underline-offset-4 hover:underline hover:translate-y-0',
      },
      size: {
        sm: 'h-8 px-3.5 text-xs',
        md: 'h-10 px-[18px] text-[13px]',
        lg: 'h-12 px-6 text-sm',
        icon: 'size-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Render as the child element (e.g. a Next <Link>) keeping button styles. */
  asChild?: boolean;
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 className="animate-spin" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  );
}
