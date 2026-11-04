import { SearchX } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/feedback';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <EmptyState
        icon={SearchX}
        title="Página no encontrada"
        description="El recurso no existe o no tienes acceso a él."
        action={
          <Button asChild>
            <Link href="/marketplace">Ir al marketplace</Link>
          </Button>
        }
        className="max-w-md"
      />
    </main>
  );
}
