import 'server-only';
import { notFound } from 'next/navigation';
import { isNotFound } from '@/lib/api/client';

/** Parse a route id and load an owner-scoped record, mapping 403/404 to Next's notFound(). */
export async function loadOwned<T>(idParam: string, loader: (id: number) => Promise<T>): Promise<T> {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) notFound();
  try {
    return await loader(id);
  } catch (e) {
    if (isNotFound(e)) notFound();
    throw e;
  }
}
