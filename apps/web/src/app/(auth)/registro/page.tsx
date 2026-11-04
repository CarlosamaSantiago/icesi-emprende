import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/features/auth/components/register-form';

export const metadata: Metadata = { title: 'Crear cuenta' };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-extrabold">Crea tu cuenta</h1>
      <p className="mt-1 mb-6 text-[13.5px] text-muted">Únete al ecosistema de emprendimientos Icesi.</p>
      <RegisterForm />
      <p className="mt-6 text-center text-[13px] text-muted">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </>
  );
}
