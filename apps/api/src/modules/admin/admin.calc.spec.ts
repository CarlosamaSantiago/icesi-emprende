import { completarMeses, ordenarRanking, type RankingRow } from './admin.calc.js';

const r = (nombre: string, ventas: number, unidades = 1, pedidosValidos = 1): RankingRow => ({
  emprendimientoId: nombre.length,
  nombre,
  categoria: 'X',
  propietario: 'Y',
  ventas,
  unidades,
  pedidosValidos,
});

describe('ordenarRanking (HU-35)', () => {
  it('orders by valid sales, then units, then orders, then name', () => {
    const out = ordenarRanking([r('B', 100), r('A', 300), r('C', 100, 5), r('D', 100, 5, 3)]);
    expect(out.map((x) => x.nombre)).toEqual(['A', 'D', 'C', 'B']);
    expect(out.map((x) => x.posicion)).toEqual([1, 2, 3, 4]);
  });

  it('gives tied businesses the same position', () => {
    const out = ordenarRanking([r('A', 500), r('B', 200), r('C', 200), r('D', 50)]);
    expect(out.map((x) => [x.nombre, x.posicion])).toEqual([
      ['A', 1],
      ['B', 2],
      ['C', 2],
      ['D', 4],
    ]);
  });

  it('keeps businesses with no sales at the bottom', () => {
    const out = ordenarRanking([r('Zero', 0, 0, 0), r('Some', 10)]);
    expect(out[0].nombre).toBe('Some');
    expect(out[1].ventas).toBe(0);
  });

  it('handles an empty list', () => {
    expect(ordenarRanking([])).toEqual([]);
  });
});

describe('completarMeses (HU-36 CA3)', () => {
  it('fills months without activity with zeros, in order', () => {
    const out = completarMeses('2026-09', '2026-11', [
      {
        mes: '2026-10',
        pedidosValidos: 2,
        emprendimientosConActividad: 2,
        gmv: 1000,
        comisionCiei: 100,
        costoPasarela: 20,
      },
    ]);
    expect(out.map((m) => m.mes)).toEqual(['2026-09', '2026-10', '2026-11']);
    expect(out[0].gmv).toBe(0);
    expect(out[1].gmv).toBe(1000);
    expect(out[2].pedidosValidos).toBe(0);
  });
});
