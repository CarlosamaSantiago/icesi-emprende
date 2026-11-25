import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CalificacionDto } from './calificaciones.dto.js';
import { autorCorto, promedio } from './calificaciones.service.js';

const check = async (o: object) => validate(plainToInstance(CalificacionDto, o));

describe('rating validation (HU-37 CA2, HU-39 CA1, HU-40 CA2)', () => {
  it('accepts 1 to 5 stars with an optional comment', async () => {
    for (const p of [1, 2, 3, 4, 5]) expect(await check({ puntuacion: p })).toHaveLength(0);
    expect(await check({ puntuacion: 4, comentario: 'Muy bueno' })).toHaveLength(0);
  });
  it('rejects out-of-range, fractional or missing scores', async () => {
    for (const p of [0, 6, -1, 3.5, '4x', undefined, null])
      expect((await check({ puntuacion: p })).length).toBeGreaterThan(0);
  });
  it('rejects overly long comments and turns blank ones into null', async () => {
    expect((await check({ puntuacion: 5, comentario: 'x'.repeat(501) })).length).toBeGreaterThan(0);
    expect(plainToInstance(CalificacionDto, { puntuacion: 5, comentario: '   ' }).comentario).toBeNull();
  });
});

describe('promedio (HU-38 CA3)', () => {
  it('returns null — not 0 — when there are no ratings', () => {
    expect(promedio([])).toBeNull();
  });
  it('rounds to one decimal', () => {
    expect(promedio([5, 4, 4])).toBe(4.3);
    expect(promedio([5, 5])).toBe(5);
  });
});

describe('autorCorto', () => {
  it('hides the full name of reviewers', () => {
    expect(autorCorto('Ximena Gomez Ruiz')).toBe('Ximena G.');
    expect(autorCorto('Cher')).toBe('Cher');
  });
});
