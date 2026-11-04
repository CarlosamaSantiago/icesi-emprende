import 'server-only';
import { cache } from 'react';
import { api } from '@/lib/api/client';
import type { Perfil } from '@/lib/api/types';

/** Memoized per request: the layout and the profile page share one API call. */
export const getMyProfile = cache(() => api<Perfil>('/usuarios/me'));
