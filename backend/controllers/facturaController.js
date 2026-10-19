/**
 * Comprobante de venta en PDF. Lo puede descargar el administrador o el cliente dueño del pedido
 * (el permiso se valida en la ruta). No es una factura electrónica ante la DIAN: es el comprobante interno del pedido.
 */
const PDFDocument = require('pdfkit');
const { Venta, Usuario, Estado, DetalleVenta, Producto, Color, Talla } = require('../models');

const NAVY = '#1a2540', ACCENT = '#4f8ef7', GRIS = '#64748b', LINEA = '#e2e8f0';
const cop = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO');
const fecha = (d) => new Date(d).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' });
const METODOS = { transferencia: 'Transferencia bancaria', contraentrega: 'Contra entrega' };

exports.descargarComprobante = async (req, res) => {
    try {
        const venta = await Venta.findByPk(req.params.id, {
            include: [{ model: Usuario, as: 'usuario' }, { model: Estado, as: 'estado' },
                { model: DetalleVenta, as: 'detalles', include: [{ model: Producto, as: 'producto' }] }],
        });
        if (!venta) return res.status(404).json({ message: 'Venta no encontrada' });

        const colores = new Map((await Color.findAll({ raw: true })).map((c) => [c.ColorID, c.Nombre]));
        const tallas = new Map((await Talla.findAll({ raw: true })).map((t) => [t.TallaID, t.Nombre]));

        const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `Comprobante de venta #${venta.VentaID}`, Author: 'StampLab' } });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="comprobante_venta_${venta.VentaID}.pdf"`);
        doc.pipe(res);

        const ancho = doc.page.width - 96;
        const x0 = 48;

        // ── Encabezado
        doc.rect(0, 0, doc.page.width, 92).fill(NAVY);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(24).text('Stamp', x0, 30, { continued: true }).fillColor(ACCENT).text('Lab');
        doc.fillColor('#cbd5e1').font('Helvetica').fontSize(9).text('Tu marca, nuestra pasión', x0, 60);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(15).text('COMPROBANTE DE VENTA', x0, 30, { width: ancho, align: 'right' });
        doc.font('Helvetica').fontSize(11).fillColor('#cbd5e1').text(`N.º ${String(venta.VentaID).padStart(6, '0')}`, x0, 54, { width: ancho, align: 'right' });
        doc.text(fecha(venta.FechaVenta), x0, 70, { width: ancho, align: 'right' });

        // ── Cliente y pedido
        let y = 116;
        const caja = (titulo, filas, x, w) => {
            doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(9).text(titulo.toUpperCase(), x, y, { width: w });
            let yy = y + 16;
            for (const [k, v] of filas) {
                doc.fillColor(GRIS).font('Helvetica').fontSize(9).text(k, x, yy, { width: w * 0.32 });
                doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9).text(String(v ?? '—'), x + w * 0.34, yy, { width: w * 0.66 });
                yy += doc.heightOfString(String(v ?? '—'), { width: w * 0.66 }) + 5;
            }
            return yy;
        };
        const u = venta.usuario || {};
        const y1 = caja('Cliente', [['Nombre', u.Nombre], ['Documento', venta.DocumentoID], ['Correo', u.Correo], ['Teléfono', u.Telefono]], x0, ancho / 2 - 10);
        const filasPedido = [['Estado', venta.estado?.Nombre], ['Pago', METODOS[venta.MetodoPago] || 'Por confirmar']];
        if (venta.MetodoPago === 'contraentrega') filasPedido.push(['Recibe', venta.NombreReceptor], ['Teléfono', venta.TelefonoEntrega], ['Dirección', venta.DireccionEntrega]);
        if (venta.MetodoPago === 'transferencia' && venta.FechaTransferencia) filasPedido.push(['Transferencia', fecha(venta.FechaTransferencia)]);
        const y2 = caja('Pedido', filasPedido, x0 + ancho / 2 + 10, ancho / 2 - 10);
        y = Math.max(y1, y2) + 14;

        // ── Tabla de productos
        const col = { prod: x0, color: x0 + 200, talla: x0 + 272, cant: x0 + 310, unit: x0 + 352, sub: x0 + 420 };
        const W = { color: 68, talla: 36, cant: 38, unit: 62, sub: ancho - 420 - 8 };
        doc.rect(x0, y, ancho, 22).fill(NAVY);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
        doc.text('PRODUCTO', col.prod + 8, y + 7).text('COLOR', col.color, y + 7).text('TALLA', col.talla, y + 7);
        doc.text('CANT.', col.cant, y + 7, { width: W.cant, align: 'right' }).text('P. UNIT.', col.unit, y + 7, { width: W.unit, align: 'right' }).text('SUBTOTAL', col.sub, y + 7, { width: W.sub, align: 'right' });
        y += 28;
        let par = false;
        for (const d of venta.detalles || []) {
            if (y > doc.page.height - 150) { doc.addPage(); y = 60; }
            if (par) doc.rect(x0, y - 4, ancho, 22).fill('#f8fafc');
            par = !par;
            doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9).text(d.producto?.Nombre || 'Producto', col.prod + 8, y, { width: 200 });
            doc.font('Helvetica').fillColor(GRIS).text(colores.get(d.ColorID) || '—', col.color, y, { width: W.color }).text(tallas.get(d.TallaID) || '—', col.talla, y, { width: W.talla });
            doc.fillColor('#0f172a').text(String(d.Cantidad), col.cant, y, { width: W.cant, align: 'right' }).text(cop(d.PrecioUnitario), col.unit, y, { width: W.unit, align: 'right' });
            doc.font('Helvetica-Bold').text(cop((Number(d.PrecioUnitario) || 0) * d.Cantidad), col.sub, y, { width: W.sub, align: 'right' });
            y += 22;
        }
        doc.moveTo(x0, y).lineTo(x0 + ancho, y).strokeColor(LINEA).lineWidth(1).stroke();

        // ── Totales
        y += 14;
        const unidades = (venta.detalles || []).reduce((t, d) => t + d.Cantidad, 0);
        doc.fillColor(GRIS).font('Helvetica').fontSize(9.5).text(`${unidades} unidad(es)`, x0, y);
        doc.text('Subtotal', x0 + ancho - 200, y, { width: 100 }).fillColor('#0f172a').text(cop(venta.Subtotal), x0 + ancho - 100, y, { width: 100, align: 'right' });
        y += 18;
        doc.rect(x0 + ancho - 220, y, 220, 30).fill(NAVY);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10).text('TOTAL', x0 + ancho - 208, y + 10).fontSize(13).text(cop(venta.Total), x0 + ancho - 130, y + 8, { width: 118, align: 'right' });

        // ── Pie
        doc.fillColor(GRIS).font('Helvetica').fontSize(8).text('Este documento es un comprobante interno del pedido y no reemplaza una factura electrónica. Gracias por comprar en StampLab.', x0, doc.page.height - 100, { width: ancho, align: 'center' });
        doc.end();
    } catch (error) {
        console.error('Error al generar el comprobante:', error);
        if (!res.headersSent) res.status(500).json({ message: 'Error al generar el comprobante', error: error.message });
    }
};
