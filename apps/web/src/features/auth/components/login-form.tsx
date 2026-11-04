'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input } from '@/components/ui/form';
import { loginAction } from '../actions';
import { type LoginInput, loginSchema } from '../schemas';

export function LoginForm({ next }: { next?: string }) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, formState } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const e = formState.errors;

  const onSubmit = (values: LoginInput) =>
    startTransition(async () => {
      setError(undefined);
      const res = await loginAction(values, next);
      if (res && !res.ok) setError(res.error);
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field label="Correo institucional" htmlFor="correo" error={e.correo?.message}>
        <Input
          id="correo"
          type="email"
          autoComplete="username"
          placeholder="tu.nombre@u.icesi.edu.co"
          aria-invalid={!!e.correo}
          aria-describedby="correo-msg"
          {...register('correo')}
        />
      </Field>
      <Field label="Contraseña" htmlFor="clave" error={e.clave?.message}>
        <Input
          id="clave"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!e.clave}
          aria-describedby="clave-msg"
          {...register('clave')}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Iniciar sesión
      </Button>
    </form>
  );
}
