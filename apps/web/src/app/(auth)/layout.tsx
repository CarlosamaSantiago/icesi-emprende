import { Store } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-sidebar p-12 text-white lg:flex">
        <Link href="/marketplace" className="flex items-center gap-2.5 text-lg font-extrabold">
          <span className="flex size-10 items-center justify-center rounded-md bg-primary">
            <Store className="size-5" aria-hidden />
          </span>
          Emprende ICESI
        </Link>
        <div>
          <h2 className="text-4xl leading-tight font-extrabold">
            El marketplace de los <span className="text-primary-light">emprendedores Icesi</span>
          </h2>
          <p className="mt-4 max-w-md text-sidebar-fg">
            Descubre productos y servicios creados por estudiantes, y haz crecer tu propio emprendimiento.
          </p>
        </div>
        <p className="text-xs text-muted">Universidad Icesi · CIEI</p>
      </aside>
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
