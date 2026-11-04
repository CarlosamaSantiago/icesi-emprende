'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input, NativeSelect } from '@/components/ui/form';
import { registerAction } from '../actions';
import { type RegisterInput, registerSchema } from '../schemas';

export function RegisterForm() {
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { rol: 'COMPRADOR' },
  });
  const e = formState.errors;

  const onSubmit = (values: RegisterInput) =>
    startTransition(async () => {
      setError(undefined);
      const res = await registerAction(values);
      if (res.ok) return setSuccess(res.message);
      setError(res.error);
      for (const [k, msg] of Object.entries(res.fieldErrors ?? {}))
        setFieldError(k as keyof RegisterInput, { message: msg });
    });

  if (success) {
    return (
      <div className="space-y-5 text-center" role="status">
        <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden />
        <p className="text-[14px] font-medium">{success}</p>
        <Button asChild size="lg" className="w-full">
          <Link href="/login">Ir a iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  const aria = (k: keyof RegisterInput) => ({ 'aria-invalid': !!e[k], 'aria-describedby': `${k}-msg` });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <p className="text-xs text-muted">
        Los campos marcados con <span className="text-danger">*</span> son obligatorios.
      </p>
      <FormError message={error} />
      <Field label="Nombre completo" htmlFor="nombreCompleto" required error={e.nombreCompleto?.message}>
        <Input
          id="nombreCompleto"
          autoComplete="name"
          {...aria('nombreCompleto')}
          {...register('nombreCompleto')}
        />
      </Field>
      <Field
        label="Correo institucional"
        htmlFor="correo"
        required
        error={e.correo?.message}
        hint="@u.icesi.edu.co o @icesi.edu.co"
      >
        <Input id="correo" type="email" autoComplete="email" {...aria('correo')} {...register('correo')} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <Field
          label="Programa académico"
          htmlFor="programaAcademico"
          required
          error={e.programaAcademico?.message}
        >
          <Input id="programaAcademico" {...aria('programaAcademico')} {...register('programaAcademico')} />
        </Field>
        <Field label="Semestre" htmlFor="semestreAcademico" required error={e.semestreAcademico?.message}>
          <NativeSelect
            id="semestreAcademico"
            defaultValue=""
            {...aria('semestreAcademico')}
            {...register('semestreAcademico', { valueAsNumber: true })}
          >
            <option value="" disabled>
              —
            </option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <Field label="Contraseña" htmlFor="clave" required error={e.clave?.message} hint="Mínimo 8 caracteres">
        <Input
          id="clave"
          type="password"
          autoComplete="new-password"
          {...aria('clave')}
          {...register('clave')}
        />
      </Field>
      <fieldset>
        <legend className="mb-1.5 text-[12.5px] font-semibold">Quiero</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['COMPRADOR', 'Comprar'],
            ['EMPRENDEDOR', 'Vender mis productos'],
          ].map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 rounded-md border-[1.5px] border-border px-3 py-2.5 text-[13px] has-checked:border-primary has-checked:bg-primary-soft has-checked:text-primary"
            >
              <input type="radio" value={value} className="accent-primary" {...register('rol')} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Crear cuenta
      </Button>
    </form>
  );
}
