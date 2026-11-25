/** Helpers for "YYYY-MM" periods (months) and "YYYY-MM-DD" dates, evaluated in Colombia time. */
export const PERIODO_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
export const FECHA_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** Current month in America/Bogota, e.g. "2026-11". */
export function periodoActual(now: Date = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }).slice(0, 7);
}

/** True when `s` is a real calendar date (rejects 2026-02-31). */
export function esFechaValida(s: string): boolean {
  if (!FECHA_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** All months from `desde` to `hasta` inclusive (both "YYYY-MM"). Empty when desde > hasta. */
export function mesesEntre(desde: string, hasta: string): string[] {
  const out: string[] = [];
  let [y, m] = desde.split('-').map(Number);
  const [y2, m2] = hasta.split('-').map(Number);
  while (y < y2 || (y === y2 && m <= m2)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

/** Month `n` months before/after `periodo` ("2026-01", -1 → "2025-12"). */
export function sumarMeses(periodo: string, n: number): string {
  const [y, m] = periodo.split('-').map(Number);
  const idx = y * 12 + (m - 1) + n;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}`;
}
