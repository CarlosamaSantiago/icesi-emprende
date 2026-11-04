'use client';

import { Minus, Plus } from 'lucide-react';
import { clampQty } from '../store';

/** Stepper bounded to 1…max (HU-19 CA1). */
export function QuantityInput({
  value,
  max,
  onChange,
  label = 'Cantidad',
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  label?: string;
}) {
  const btn =
    'flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-primary-soft hover:text-primary disabled:opacity-40';
  return (
    <div
      className="inline-flex items-center rounded-full border-[1.5px] border-border bg-surface p-0.5"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Disminuir"
      >
        <Minus className="size-3.5" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(clampQty(Number(e.target.value), max))}
        className="w-10 bg-transparent text-center text-sm font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Aumentar"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
