'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/feedback';

/** Route-level error boundary. Never renders error details (they may contain internals). */
export default function MainError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Algo salió mal"
      description="No pudimos cargar esta sección. Intenta de nuevo en unos segundos."
      action={<Button onClick={reset}>Reintentar</Button>}
    />
  );
}
