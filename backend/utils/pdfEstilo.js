/**
 * Estilo compartido de los PDF de StampLab (cotización, comprobante de venta…).
 * Un solo lugar para colores, encabezado, secciones, chips y pie de página.
 */

const P = {
    navy:        '#0f1b3d',
    navyMid:     '#1e2f5e',
    accent:      '#3b82f6',
    accentDark:  '#1d4ed8',
    accentSoft:  '#eff6ff',
    violet:      '#7c3aed',
    violetSoft:  '#f5f3ff',
    success:     '#15803d',
    successSoft: '#ecfdf5',
    successLine: '#a7f3d0',
    warning:     '#b45309',
    warningSoft: '#fffbeb',
    warningLine: '#fde68a',
    danger:      '#b91c1c',
    dangerSoft:  '#fef2f2',
    muted:       '#64748b',
    soft:        '#94a3b8',
    border:      '#e2e8f0',
    bg:          '#f8fafc',
    white:       '#ffffff',
    text:        '#0f172a',
};

const MARGEN = 48;
const ALTO_PIE = 42;

const cop = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO');
// Una fecha sin hora ("2026-10-28") se interpreta en UTC y mostraría el día anterior en Colombia: se lee como fecha local
const aFecha = (d) => (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00`) : new Date(d));
const fechaLarga = (d) => aFecha(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

const ESTADOS = {
    Pendiente: [P.warning, P.warningSoft],
    Aprobada:  [P.success, P.successSoft],
    Cancelada: [P.danger,  P.dangerSoft],
    Procesada: [P.accentDark, P.accentSoft],
};
const colorEstado = (nombre) => ESTADOS[nombre] || [P.muted, P.bg];

/** Medidas útiles de la página */
function medidas(doc) {
    return { left: MARGEN, right: doc.page.width - MARGEN, ancho: doc.page.width - MARGEN * 2, limite: doc.page.height - ALTO_PIE - 14 };
}

/** Si lo que sigue no cabe, pasa a una página nueva y devuelve la nueva y */
function asegurarEspacio(doc, y, alto) {
    if (y + alto > doc.page.height - ALTO_PIE - 14) {
        doc.addPage();
        return MARGEN;
    }
    return y;
}

/** Texto sin que pdfkit salte de página solo (lo controlamos nosotros) */
function texto(doc, str, x, y, opts = {}) {
    doc.text(String(str), x, y, { lineBreak: opts.width !== undefined, ...opts });
}

/** Encabezado de la primera página. Devuelve la y donde sigue el contenido. */
function encabezado(doc, { titulo, subtitulo, numero, fecha, estado }) {
    const { left, right } = medidas(doc);
    const H = 104;
    doc.rect(0, 0, doc.page.width, H).fill(P.navy);
    doc.polygon([doc.page.width * 0.58, 0], [doc.page.width, 0], [doc.page.width, H], [doc.page.width * 0.5, H]).fill(P.navyMid);
    doc.rect(0, H, doc.page.width, 4).fill(P.accent);

    doc.fillColor(P.white).font('Helvetica-Bold').fontSize(26).text('Stamp', left, 24, { continued: true, lineBreak: false })
        .fillColor('#60a5fa').text('Lab', { lineBreak: false });
    doc.fillColor('#cbd5e1').font('Helvetica').fontSize(9.5).text(subtitulo, left, 58, { lineBreak: false });
    doc.fillColor('#94a3b8').font('Helvetica-Bold').fontSize(8).text(titulo.toUpperCase(), left, 78, { lineBreak: false, characterSpacing: 1 });

    const wDer = 220;
    doc.fillColor('#94a3b8').font('Helvetica-Bold').fontSize(8).text('N.º', right - wDer, 22, { width: wDer, align: 'right', lineBreak: false, characterSpacing: 1 });
    doc.fillColor(P.white).font('Helvetica-Bold').fontSize(24).text(numero, right - wDer, 33, { width: wDer, align: 'right', lineBreak: false });
    doc.fillColor('#cbd5e1').font('Helvetica').fontSize(9).text(fecha, right - wDer, 64, { width: wDer, align: 'right', lineBreak: false });
    if (estado) {
        const [c, s] = colorEstado(estado);
        const w = 92;
        doc.roundedRect(right - w, 80, w, 17, 8.5).fill(s);
        doc.fillColor(c).font('Helvetica-Bold').fontSize(7.5).text(estado.toUpperCase(), right - w, 85, { width: w, align: 'center', lineBreak: false, characterSpacing: 0.6 });
    }
    return H + 4 + 22;
}

/** Título de sección: barra de color + texto + línea fina. Devuelve la y siguiente. */
function seccion(doc, tituloSec, y, color = P.accent) {
    const { left, right } = medidas(doc);
    y = asegurarEspacio(doc, y, 60);
    doc.rect(left, y, 4, 16).fill(color);
    doc.fillColor(P.navy).font('Helvetica-Bold').fontSize(10.5).text(tituloSec.toUpperCase(), left + 12, y + 3.5, { lineBreak: false, characterSpacing: 0.8 });
    doc.moveTo(left, y + 22).lineTo(right, y + 22).strokeColor(P.border).lineWidth(0.8).stroke();
    return y + 32;
}

/** Etiqueta pequeña + valor, en dos líneas */
function campo(doc, etiqueta, valor, x, y, w) {
    doc.fillColor(P.soft).font('Helvetica-Bold').fontSize(7).text(etiqueta.toUpperCase(), x, y, { width: w, lineBreak: false, characterSpacing: 0.7 });
    doc.fillColor(P.text).font('Helvetica-Bold').fontSize(10).text(String(valor || '—'), x, y + 11, { width: w, height: 13, ellipsis: true });
}

/** Chip redondeado con texto. Devuelve el ancho ocupado (con margen). */
function chip(doc, str, x, y, color = P.accentDark, fondo = P.accentSoft) {
    doc.font('Helvetica-Bold').fontSize(8);
    const w = doc.widthOfString(str) + 16;
    doc.roundedRect(x, y, w, 17, 8.5).fill(fondo);
    doc.fillColor(color).text(str, x + 8, y + 4.8, { lineBreak: false });
    return w + 5;
}

/** Fila de chips que salta de línea (y de página) cuando no cabe. Devuelve la y siguiente. */
function filaChips(doc, items, x, y, anchoMax, color, fondo) {
    let cx = x;
    for (const it of items) {
        doc.font('Helvetica-Bold').fontSize(8);
        const w = doc.widthOfString(it) + 21;
        if (cx + w > x + anchoMax && cx > x) { cx = x; y += 22; }
        cx += chip(doc, it, cx, y, color, fondo);
    }
    return y + 24;
}

/** Etiqueta de grupo (TALLAS, COLORES…) */
function etiquetaGrupo(doc, str, x, y) {
    doc.fillColor(P.muted).font('Helvetica-Bold').fontSize(7).text(str.toUpperCase(), x, y, { lineBreak: false, characterSpacing: 0.8 });
    return y + 12;
}

/** Caja de notas con borde y fondo suaves. Devuelve la y siguiente. */
function cajaNotas(doc, tituloNota, lineas, y, { color = P.success, fondo = P.successSoft, borde = P.successLine } = {}) {
    const { left, ancho } = medidas(doc);
    doc.font('Helvetica').fontSize(8.5);
    const cuerpo = lineas.map((l) => `•  ${l}`).join('\n');
    const h = 34 + doc.heightOfString(cuerpo, { width: ancho - 32, lineGap: 3 });
    y = asegurarEspacio(doc, y, h + 6);
    doc.roundedRect(left, y, ancho, h, 8).fillAndStroke(fondo, borde);
    doc.fillColor(color).font('Helvetica-Bold').fontSize(9.5).text(tituloNota, left + 16, y + 12, { lineBreak: false });
    doc.fillColor(color).font('Helvetica').fontSize(8.5).text(cuerpo, left + 16, y + 28, { width: ancho - 32, lineGap: 3 });
    return y + h + 12;
}

/** Pie con numeración "Página x de y" en todas las páginas. Llamar justo antes de doc.end() (requiere bufferPages). */
function pies(doc, izquierda) {
    const rango = doc.bufferedPageRange();
    const { left, right } = { left: MARGEN, right: doc.page.width - MARGEN };
    for (let i = rango.start; i < rango.start + rango.count; i++) {
        doc.switchToPage(i);
        const margenInferior = doc.page.margins.bottom;
        doc.page.margins.bottom = 0; // sin esto pdfkit crea una página extra al escribir en el pie
        const fy = doc.page.height - ALTO_PIE + 10;
        doc.moveTo(left, fy - 8).lineTo(right, fy - 8).strokeColor(P.border).lineWidth(0.6).stroke();
        doc.fillColor(P.soft).font('Helvetica').fontSize(8).text(izquierda, left, fy, { width: right - left - 90, lineBreak: false });
        doc.fillColor(P.muted).font('Helvetica-Bold').text(`Página ${i + 1} de ${rango.count}`, right - 90, fy, { width: 90, align: 'right', lineBreak: false });
        doc.page.margins.bottom = margenInferior;
    }
}

module.exports = {
    P, MARGEN, cop, fechaLarga, colorEstado, medidas, asegurarEspacio, texto,
    encabezado, seccion, campo, chip, filaChips, etiquetaGrupo, cajaNotas, pies,
};
