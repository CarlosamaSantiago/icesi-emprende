import * as LabelPrimitive from '@radix-ui/react-label';
import * as React from 'react';
import { cn } from '@/lib/utils';

const fieldBase =
  'w-full rounded-md border-[1.5px] border-border bg-surface px-3.5 py-2.5 text-[13.5px] text-fg ' +
  'placeholder:text-subtle outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/10 ' +
  'disabled:bg-surface-muted disabled:text-muted aria-[invalid=true]:border-danger-solid';

export function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn('mb-1.5 block text-[12.5px] font-semibold text-fg', className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, 'min-h-24 resize-y', className)} {...props} />;
}

export function NativeSelect({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldBase, 'appearance-none pr-8', className)} {...props} />;
}

interface FieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Label + control + hint/error, wired for accessibility.
 * Pass the same id to the control and use `aria-describedby={`${htmlFor}-msg`}` + `aria-invalid`.
 */
export function Field({ label, htmlFor, required, error, hint, className, children }: FieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        )}
      </Label>
      {children}
      {(error || hint) && (
        <p
          id={`${htmlFor}-msg`}
          role={error ? 'alert' : undefined}
          className={cn('mt-1.5 text-xs', error ? 'text-danger' : 'text-muted')}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

/** Banner for form-level errors returned by a server action. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-md border border-danger-soft bg-danger-soft px-4 py-3 text-[13px] font-medium text-danger"
    >
      {message}
    </div>
  );
}
