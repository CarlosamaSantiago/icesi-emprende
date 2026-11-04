import { z } from 'zod';

/** HU-05 CA2 / HU-07 CA1 */
export const businessSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre es obligatorio').max(120),
  categoriaId: z.number({ error: 'Selecciona una categoría' }).int().positive('Selecciona una categoría'),
  descripcion: z.string().trim().min(10, 'Describe tu emprendimiento (mín. 10 caracteres)').max(1000),
});
export type BusinessInput = z.infer<typeof businessSchema>;

/** HU-11 CA2 / HU-12 */
export const productSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre es obligatorio').max(120),
  descripcion: z.string().trim().min(5, 'Agrega una descripción').max(1000),
  precio: z
    .number({ error: 'Ingresa un precio válido' })
    .positive('El precio debe ser mayor a 0')
    .max(100_000_000),
  stockDisponible: z
    .number({ error: 'Ingresa una cantidad' })
    .int('Debe ser un número entero')
    .min(0, 'No puede ser negativo')
    .max(100_000),
});
export type ProductInput = z.infer<typeof productSchema>;

export const productStatusSchema = z.object({
  productoId: z.number().int().positive(),
  estado: z.enum(['ACTIVO', 'INACTIVO']),
});
