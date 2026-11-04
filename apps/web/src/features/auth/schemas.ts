import { z } from 'zod';

/** Shared by the client form (UX) and the Server Action (trust boundary). Mirrors the API DTOs. */
export const INSTITUTIONAL_EMAIL = /@(u\.)?icesi\.edu\.co$/i;

const email = z.string().trim().toLowerCase().min(1, 'Ingresa tu correo').pipe(z.email('Correo inválido'));

export const loginSchema = z.object({
  correo: email,
  clave: z.string().min(1, 'Ingresa tu contraseña'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  nombreCompleto: z.string().trim().min(3, 'Ingresa tu nombre completo').max(255),
  correo: email.refine(
    (v) => INSTITUTIONAL_EMAIL.test(v),
    'Usa tu correo institucional (@u.icesi.edu.co o @icesi.edu.co)',
  ),
  programaAcademico: z.string().trim().min(2, 'Ingresa tu programa académico').max(255),
  semestreAcademico: z.number({ error: 'Selecciona tu semestre' }).int().min(1).max(12),
  clave: z.string().min(8, 'Mínimo 8 caracteres').max(72, 'Máximo 72 caracteres'),
  rol: z.enum(['COMPRADOR', 'EMPRENDEDOR']),
});
export type RegisterInput = z.infer<typeof registerSchema>;
