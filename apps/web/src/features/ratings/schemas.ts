import { z } from 'zod';

/** HU-37 / HU-39 / HU-40: 1–5 stars, optional comment up to 500 chars. Mirrors the API DTO. */
export const ratingSchema = z.object({
  puntuacion: z
    .number({ error: 'Selecciona una calificación' })
    .int()
    .min(1, 'Selecciona una calificación')
    .max(5),
  comentario: z.string().trim().max(500, 'Máximo 500 caracteres').optional(),
});
export type RatingInput = z.infer<typeof ratingSchema>;
