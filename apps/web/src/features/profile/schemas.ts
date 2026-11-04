import { z } from 'zod';

/** HU-03 CA2: editable fields. Email and roles are not editable by the user. */
export const profileSchema = z.object({
  nombreCompleto: z.string().trim().min(3, 'Ingresa tu nombre completo').max(255),
  programaAcademico: z.string().trim().min(2, 'Ingresa tu programa').max(255),
  semestreAcademico: z.number({ error: 'Selecciona tu semestre' }).int().min(1).max(12),
});
export type ProfileInput = z.infer<typeof profileSchema>;
