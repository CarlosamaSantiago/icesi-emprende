'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input, NativeSelect, Textarea } from '@/components/ui/form';
import type { Categoria, EmprendimientoResumen } from '@/lib/api/types';
import { createBusinessAction, updateBusinessAction } from '../actions';
import { type BusinessInput, businessSchema } from '../schemas';

/** Create (HU-05) and edit (HU-07) share one form. */
export function BusinessForm({
  categorias,
  emprendimiento,
}: {
  categorias: Categoria[];
  emprendimiento?: EmprendimientoResumen;
}) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState,
  } = useForm<BusinessInput>({
    resolver: zodResolver(businessSchema),
    defaultValues: emprendimiento
      ? {
          nombre: emprendimiento.nombre,
          categoriaId: emprendimiento.categoria.id,
          descripcion: emprendimiento.descripcion,
        }
      : undefined,
  });
  const e = formState.errors;

  const onSubmit = (values: BusinessInput) =>
    startTransition(async () => {
      setError(undefined);
      const res = emprendimiento
        ? await updateBusinessAction(emprendimiento.id, values)
        : await createBusinessAction(values);
      if (!res.ok) {
        setError(res.error);
        for (const [k, m] of Object.entries(res.fieldErrors ?? {}))
          setFieldError(k as keyof BusinessInput, { message: m });
        return;
      }
      toast.success(res.message);
      if (emprendimiento) reset(values);
      else router.push(`/mi-negocio/${res.data.id}/editar?nuevo=1`);
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field label="Nombre" htmlFor="nombre" required error={e.nombre?.message}>
        <Input id="nombre" aria-invalid={!!e.nombre} {...register('nombre')} />
      </Field>
      <Field label="Categoría" htmlFor="categoriaId" required error={e.categoriaId?.message}>
        <NativeSelect
          id="categoriaId"
          defaultValue=""
          aria-invalid={!!e.categoriaId}
          {...register('categoriaId', { valueAsNumber: true })}
        >
          <option value="" disabled>
            Selecciona…
          </option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Descripción" htmlFor="descripcion" required error={e.descripcion?.message}>
        <Textarea id="descripcion" rows={4} aria-invalid={!!e.descripcion} {...register('descripcion')} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" loading={pending} disabled={!!emprendimiento && !formState.isDirty}>
          {emprendimiento ? 'Guardar cambios' : 'Crear emprendimiento'}
        </Button>
      </div>
    </form>
  );
}
