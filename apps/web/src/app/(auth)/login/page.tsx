import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = { title: 'Iniciar sesión' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; expired?: string }>;
}) {
  const { next, expired } = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-extrabold">Bienvenido de nuevo</h1>
      <p className="mt-1 mb-7 text-[13.5px] text-muted">Ingresa con tu correo institucional.</p>
      {expired && (
        <p role="status" className="mb-4 rounded-md bg-warning-soft px-4 py-3 text-[13px] text-warning">
          Tu sesión expiró. Inicia sesión de nuevo.
        </p>
      )}
      <LoginForm next={next} />
      <p className="mt-6 text-center text-[13px] text-muted">
        ¿No tienes cuenta?{' '}
        <Link href="/registro" className="font-semibold text-primary hover:underline">
          Regístrate
        </Link>
      </p>
    </>
  );
}
