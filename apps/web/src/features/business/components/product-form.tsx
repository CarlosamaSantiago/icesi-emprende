'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input, Textarea } from '@/components/ui/form';
import type { ProductoResumen } from '@/lib/api/types';
import { createProductAction, updateProductAction } from '../actions';
import { type ProductInput, productSchema } from '../schemas';

/** HU-11 (create) / HU-12 (edit). */
export function ProductForm({ businessId, producto }: { businessId: number; producto?: ProductoResumen }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState,
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: producto
      ? {
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precio: producto.precio,
          stockDisponible: producto.stockDisponible,
        }
      : undefined,
  });
  const e = formState.errors;

  const onSubmit = (values: ProductInput) =>
    startTransition(async () => {
      setError(undefined);
      const res = producto
        ? await updateProductAction(producto.id, values)
        : await createProductAction(businessId, values);
      if (!res.ok) {
        setError(res.error);
        for (const [k, m] of Object.entries(res.fieldErrors ?? {}))
          setFieldError(k as keyof ProductInput, { message: m });
        return;
      }
      toast.success(res.message);
      if (producto) reset(values);
      else router.push(`/mi-negocio/productos/${res.data.id}`); // continue to add images
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field label="Nombre del producto o servicio" htmlFor="nombre" required error={e.nombre?.message}>
        <Input id="nombre" aria-invalid={!!e.nombre} {...register('nombre')} />
      </Field>
      <Field label="Descripción" htmlFor="descripcion" required error={e.descripcion?.message}>
        <Textarea id="descripcion" rows={4} aria-invalid={!!e.descripcion} {...register('descripcion')} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Precio (COP)" htmlFor="precio" required error={e.precio?.message}>
          <Input
            id="precio"
            type="number"
            inputMode="numeric"
            min={1}
            step="any"
            aria-invalid={!!e.precio}
            {...register('precio', { valueAsNumber: true })}
          />
        </Field>
        <Field
          label="Cantidad disponible"
          htmlFor="stockDisponible"
          required
          error={e.stockDisponible?.message}
        >
          <Input
            id="stockDisponible"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            aria-invalid={!!e.stockDisponible}
            {...register('stockDisponible', { valueAsNumber: true })}
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={pending} disabled={!!producto && !formState.isDirty}>
          {producto ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </div>
    </form>
  );
}
