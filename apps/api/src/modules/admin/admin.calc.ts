/** Pure helpers for the admin reports (HU-35, HU-36). */
import { mesesEntre } from '../shared/periodo.js';

export interface RankingRow {
  emprendimientoId: number;
  nombre: string;
  categoria: string;
  propietario: string;
  ventas: number;
  pedidosValidos: number;
  unidades: number;
}

/**
 * HU-35 CA1/CA2: order by valid sales, then units, then orders, then name.
 * Ties on all three numbers share the same position ("1, 2, 2, 4").
 */
export function ordenarRanking(rows: RankingRow[]) {
  const sorted = [...rows].sort(
    (a, b) =>
      b.ventas - a.ventas ||
      b.unidades - a.unidades ||
      b.pedidosValidos - a.pedidosValidos ||
      a.nombre.localeCompare(b.nombre, 'es'),
  );
  const out: (RankingRow & { posicion: number })[] = [];
  sorted.forEach((r, i) => {
    const prev = out[i - 1];
    const tied =
      prev &&
      prev.ventas === r.ventas &&
      prev.unidades === r.unidades &&
      prev.pedidosValidos === r.pedidosValidos;
    out.push({ ...r, posicion: tied ? prev.posicion : i + 1 });
  });
  return out;
}

export interface MesIndicador {
  mes: string;
  pedidosValidos: number;
  emprendimientosConActividad: number;
  gmv: number;
  comisionCiei: number;
  costoPasarela: number;
}

/** HU-36 CA3: months without activity still appear (with zeros) so history reads continuously. */
export function completarMeses(desde: string, hasta: string, rows: MesIndicador[]): MesIndicador[] {
  const byMes = new Map(rows.map((r) => [r.mes, r]));
  return mesesEntre(desde, hasta).map(
    (mes) =>
      byMes.get(mes) ?? {
        mes,
        pedidosValidos: 0,
        emprendimientosConActividad: 0,
        gmv: 0,
        comisionCiei: 0,
        costoPasarela: 0,
      },
  );
}
