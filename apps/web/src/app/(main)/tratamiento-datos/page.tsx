import type { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/feedback';
import { api } from '@/lib/api/client';
import type { PoliticaDatos } from '@/lib/api/types';

export const metadata: Metadata = { title: 'Tratamiento de datos personales' };

/** HU-45 CA3: public page with the policy the user accepts at registration. */
export default async function TratamientoDatosPage() {
  const politica = await api<PoliticaDatos>('/legal/tratamiento-datos', { auth: false });
  return (
    <>
      <PageHeader title={politica.titulo} subtitle={`Versión ${politica.version}`} />
      <Card className="max-w-3xl space-y-5 p-6">
        {politica.secciones.map((s) => (
          <section key={s.titulo}>
            <h2 className="text-[15px] font-bold">{s.titulo}</h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{s.texto}</p>
          </section>
        ))}
      </Card>
    </>
  );
}
