import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/feedback';
import { ProfileForm } from '@/features/profile/components/profile-form';
import { ProfilePhoto } from '@/features/profile/components/profile-photo';
import { getMyProfile } from '@/features/profile/queries';
import { requireSession } from '@/lib/auth/session';
import { mediaUrl } from '@/lib/media';

export const metadata: Metadata = { title: 'Mi perfil' };

/** HU-03 + HU-04 */
export default async function PerfilPage() {
  await requireSession();
  const perfil = await getMyProfile();

  return (
    <>
      <PageHeader title="Mi perfil" subtitle="Consulta y actualiza tu información personal y académica" />
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card className="h-fit">
          <CardHeader className="block">
            <CardTitle>Foto de perfil</CardTitle>
            <CardDescription>Así te verán compradores y vendedores.</CardDescription>
          </CardHeader>
          <ProfilePhoto currentUrl={mediaUrl(perfil.fotoPerfil)} />
          <div className="mt-6 flex flex-wrap gap-1.5 border-t border-border pt-5">
            {perfil.roles.map((r) => (
              <Badge key={r} tone="primary">
                {r}
              </Badge>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader className="block">
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <ProfileForm perfil={perfil} />
        </Card>
      </div>
    </>
  );
}
