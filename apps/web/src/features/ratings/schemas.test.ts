import { describe, expect, it } from 'vitest';
import { ratingSchema } from './schemas';

describe('ratingSchema (HU-37/39/40)', () => {
  it('accepts 1–5 stars with an optional comment', () => {
    expect(ratingSchema.safeParse({ puntuacion: 5 }).success).toBe(true);
    expect(ratingSchema.safeParse({ puntuacion: 1, comentario: 'Bien' }).success).toBe(true);
  });
  it('rejects out-of-range, non-integer and missing scores', () => {
    for (const puntuacion of [0, 6, 2.5, undefined as unknown as number])
      expect(ratingSchema.safeParse({ puntuacion }).success).toBe(false);
  });
  it('rejects comments over 500 chars', () => {
    expect(ratingSchema.safeParse({ puntuacion: 3, comentario: 'x'.repeat(501) }).success).toBe(false);
  });
});
