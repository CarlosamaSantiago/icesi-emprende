'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input, NativeSelect } from '@/components/ui/form';
import type { Perfil } from '@/lib/api/types';
import { updateProfileAction } from '../actions';
import { type ProfileInput, profileSchema } from '../schemas';

export function ProfileForm({ perfil }: { perfil: Perfil }) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const defaults: ProfileInput = {
    nombreCompleto: perfil.nombreCompleto,
    programaAcademico: perfil.programaAcademico,
    semestreAcademico: perfil.semestreAcademico,
  };
  const { register, handleSubmit, reset, formState } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaults,
  });
  const e = formState.errors;

  const onSubmit = (values: ProfileInput) =>
    startTransition(async () => {
      setError(undefined);
      const res = await updateProfileAction(values);
      if (res.ok) {
        toast.success(res.message);
        reset(values); // new baseline
      } else {
        setError(res.error); // HU-03 CA3: form keeps the values, server data untouched
      }
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field label="Correo institucional" htmlFor="correo" hint="El correo no se puede modificar">
        <Input id="correo" value={perfil.correoInstitucional} disabled readOnly />
      </Field>
      <Field label="Nombre completo" htmlFor="nombreCompleto" required error={e.nombreCompleto?.message}>
        <Input id="nombreCompleto" aria-invalid={!!e.nombreCompleto} {...register('nombreCompleto')} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <Field
          label="Programa académico"
          htmlFor="programaAcademico"
          required
          error={e.programaAcademico?.message}
        >
          <Input
            id="programaAcademico"
            aria-invalid={!!e.programaAcademico}
            {...register('programaAcademico')}
          />
        </Field>
        <Field label="Semestre" htmlFor="semestreAcademico" required error={e.semestreAcademico?.message}>
          <NativeSelect id="semestreAcademico" {...register('semestreAcademico', { valueAsNumber: true })}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => reset(defaults)}
          disabled={!formState.isDirty || pending}
        >
          Descartar
        </Button>
        <Button type="submit" loading={pending} disabled={!formState.isDirty}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
