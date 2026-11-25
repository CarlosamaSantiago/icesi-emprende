import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { buildNav } from '@/components/layout/nav-config';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/features/auth/components/user-menu';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { CartButton } from '@/features/cart/components/cart-button';
import { getMyProfile } from '@/features/profile/queries';
import { getSession } from '@/lib/auth/session';
import { mediaUrl } from '@/lib/media';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const perfil = session ? await getMyProfile() : null;

  const topbar = (
    <div className="ml-auto flex items-center gap-2">
      {session && perfil ? (
        <>
          <NotificationBell roles={session!.roles} />
          <CartButton />
          <UserMenu
            nombre={perfil.nombreCompleto}
            email={perfil.correoInstitucional}
            foto={mediaUrl(perfil.fotoPerfil)}
          />
        </>
      ) : (
        <>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/registro">Crear cuenta</Link>
          </Button>
        </>
      )}
    </div>
  );

  return (
    <AppShell sections={buildNav(session?.roles ?? null)} topbar={topbar}>
      {children}
    </AppShell>
  );
}
