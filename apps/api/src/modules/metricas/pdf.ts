import PDFDocument from 'pdfkit';
import type { Metricas } from './metricas.calc.js';

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'America/Bogota' });

// Brand tokens (same values as apps/web globals.css). PDFs cannot read CSS variables.
const PRIMARY = '#6366f1';
const PRIMARY_SOFT = '#eef2ff';
const FG = '#111827';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';

export interface InformeInput {
  emprendedor: string;
  correo: string;
  /** Human readable range, e.g. "Del 01/11/2026 al 30/11/2026" or "Todo el historial". */
  periodo: string;
  metricas: Metricas;
  generadoEn?: Date;
}

/** HU-33: PDF with the consulted period and the sales / orders summary. Uses built-in Helvetica (no emoji). */
export function buildMetricasPdf({
  emprendedor,
  correo,
  periodo,
  metricas,
  generadoEn = new Date(),
}: InformeInput) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true,
      info: { Title: 'Reporte de métricas — Emprende ICESI' },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width - 100;
    const { resumen, porEstado, productos, pedidos } = metricas;

    // ---- header
    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(22).text('Reporte de métricas');
    doc.fillColor(MUTED).font('Helvetica').fontSize(10.5).text(`Emprende ICESI · ${emprendedor} · ${correo}`);
    doc.moveDown(0.3);
    doc.fillColor(FG).font('Helvetica-Bold').fontSize(11).text(`Periodo consultado: ${periodo}`);
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(9)
      .text(
        `Generado el ${fecha.format(generadoEn)}. Los ingresos solo incluyen pedidos válidos (confirmados, en preparación o entregados, sin pago fallido).`,
      );
    doc.moveDown(0.6);
    doc
      .moveTo(50, doc.y)
      .lineTo(50 + W, doc.y)
      .lineWidth(2)
      .strokeColor(PRIMARY)
      .stroke();
    doc.moveDown(0.8);

    // ---- KPIs
    heading(doc, 'Resumen de ventas');
    const kpis: [string, string][] = [
      ['Pedidos totales', String(resumen.totalPedidos)],
      ['Ingresos (pedidos válidos)', cop.format(resumen.ingresos)],
      ['Unidades vendidas', String(resumen.unidadesVendidas)],
      ['Ticket promedio', cop.format(resumen.ticketPromedio)],
    ];
    const cardW = (W - 3 * 8) / 4;
    const y0 = doc.y;
    kpis.forEach(([label, value], i) => {
      const x = 50 + i * (cardW + 8);
      doc.roundedRect(x, y0, cardW, 54, 6).fillAndStroke(PRIMARY_SOFT, BORDER);
      doc
        .fillColor(FG)
        .font('Helvetica-Bold')
        .fontSize(value.length > 12 ? 10.5 : 13)
        .text(value, x + 8, y0 + 12, { width: cardW - 16 });
      doc
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(8)
        .text(label, x + 8, y0 + 34, { width: cardW - 16 });
    });
    doc.y = y0 + 54 + 10;
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(9)
      .text(
        `Pedidos válidos: ${resumen.pedidosValidos} · Pendientes: ${resumen.pedidosPendientes} (${cop.format(resumen.ingresosPendientes)}) · ` +
          `Cancelados: ${resumen.pedidosCancelados} (${cop.format(resumen.ingresosCancelados)}) · Con pago fallido: ${resumen.pedidosPagoFallido}`,
      );
    doc.moveDown(0.8);

    // ---- by state
    heading(doc, 'Pedidos por estado');
    table(
      doc,
      W,
      [
        { title: 'Estado', width: 0.5, align: 'left' },
        { title: 'Pedidos', width: 0.25, align: 'right' },
        { title: '%', width: 0.25, align: 'right' },
      ],
      porEstado.map((e) => [
        e.estado,
        String(e.cantidad),
        resumen.totalPedidos ? `${((e.cantidad / resumen.totalPedidos) * 100).toFixed(1)} %` : '—',
      ]),
    );

    // ---- products
    heading(doc, 'Productos más vendidos');
    if (productos.length === 0) {
      doc.fillColor(MUTED).font('Helvetica').fontSize(10).text('Sin ventas válidas en el periodo.');
      doc.moveDown(0.8);
    } else {
      table(
        doc,
        W,
        [
          { title: '#', width: 0.07, align: 'left' },
          { title: 'Producto', width: 0.43, align: 'left' },
          { title: 'Unidades', width: 0.15, align: 'right' },
          { title: 'Ingresos', width: 0.2, align: 'right' },
          { title: '% ingresos', width: 0.15, align: 'right' },
        ],
        productos
          .slice(0, 10)
          .map((p, i) => [
            String(i + 1),
            p.nombre,
            String(p.unidades),
            cop.format(p.ingresos),
            `${p.participacion.toFixed(1)} %`,
          ]),
      );
    }

    // ---- orders
    heading(doc, 'Historial de pedidos');
    if (pedidos.length === 0) {
      doc.fillColor(MUTED).font('Helvetica').fontSize(10).text('No hay pedidos en el periodo consultado.');
    } else {
      table(
        doc,
        W,
        [
          { title: 'Pedido', width: 0.1, align: 'left' },
          { title: 'Fecha', width: 0.2, align: 'left' },
          { title: 'Comprador', width: 0.3, align: 'left' },
          { title: 'Estado', width: 0.2, align: 'left' },
          { title: 'Total', width: 0.2, align: 'right' },
        ],
        pedidos.map((p) => [
          `#${p.id}`,
          fecha.format(p.fecha),
          p.comprador,
          p.estado + (p.cuentaEnIngresos ? '' : ' *'),
          cop.format(p.total),
        ]),
      );
      doc.fillColor(MUTED).font('Helvetica').fontSize(8).text('* No se cuenta en los ingresos.');
    }

    // ---- footer on every page
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      // Writing inside the bottom margin would make pdfkit add a blank page: zero it while drawing the footer.
      const bottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(8)
        .text(`Página ${i + 1} de ${range.count} · Emprende ICESI`, 50, doc.page.height - 36, {
          width: W,
          align: 'center',
          lineBreak: false,
        });
      doc.page.margins.bottom = bottom;
    }
    doc.end();
  });
}

type Doc = InstanceType<typeof PDFDocument>;
interface Col {
  title: string;
  width: number;
  align: 'left' | 'right';
}

function heading(doc: Doc, text: string) {
  if (doc.y > doc.page.height - 140) doc.addPage();
  doc.fillColor(FG).font('Helvetica-Bold').fontSize(13).text(text);
  doc.moveDown(0.4);
}

function table(doc: Doc, W: number, cols: Col[], rows: string[][]) {
  const pad = 6;
  const rowH = 20;
  const xs = cols.reduce<number[]>(
    (acc, c, i) => [...acc, i === 0 ? 50 : acc[i - 1] + cols[i - 1].width * W],
    [],
  );

  const drawRow = (cells: string[], header: boolean, zebra: boolean) => {
    if (doc.y + rowH > doc.page.height - 60) {
      doc.addPage();
      drawRow(
        cols.map((c) => c.title),
        true,
        false,
      );
    }
    const y = doc.y;
    if (header) doc.rect(50, y, W, rowH).fill(PRIMARY);
    else if (zebra) doc.rect(50, y, W, rowH).fill('#f9fafb');
    cells.forEach((cell, i) => {
      doc
        .fillColor(header ? '#ffffff' : FG)
        .font(header ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(9)
        .text(cell, xs[i] + pad, y + 6, {
          width: cols[i].width * W - 2 * pad,
          align: cols[i].align,
          lineBreak: false,
          ellipsis: true,
        });
    });
    doc.y = y + rowH;
  };

  drawRow(
    cols.map((c) => c.title),
    true,
    false,
  );
  rows.forEach((r, i) => drawRow(r, false, i % 2 === 1));
  doc.moveDown(0.8);
}
