'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, Input, NativeSelect } from '@/components/ui/form';
import { designateBusinessOfMonthAction } from '../actions';

/** HU-46 CA1: choose one ACTIVE business and the month to recognise. */
export function DesignateForm({
  options,
  defaultPeriodo,
}: {
  options: { id: number; nombre: string }[];
  defaultPeriodo: string;
}) {
  const [emprendimientoId, setId] = useState('');
  const [periodo, setPeriodo] = useState(defaultPeriodo);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    startTransition(async () => {
      setError(undefined);
      const res = await designateBusinessOfMonthAction({
        emprendimientoId: Number(emprendimientoId),
        periodo,
      });
      if (res.ok) toast.success(res.message);
      else setError(res.fieldErrors?.periodo ?? res.error);
    });
  };

  return (
    <form onSubmit={submit} className="grid items-end gap-4 sm:grid-cols-[1fr_160px_auto]" noValidate>
      <Field label="Emprendimiento activo" htmlFor="del-mes-emp" required>
        <NativeSelect
          id="del-mes-emp"
          value={emprendimientoId}
          onChange={(e) => setId(e.target.value)}
          required
        >
          <option value="" disabled>
            Selecciona…
          </option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Mes" htmlFor="del-mes-periodo" required error={error}>
        <Input
          id="del-mes-periodo"
          type="month"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          aria-invalid={!!error}
          aria-describedby="del-mes-periodo-msg"
        />
      </Field>
      <Button type="submit" loading={pending} disabled={!emprendimientoId}>
        Designar
      </Button>
    </form>
  );
}
