/**
 * Comprobante de venta en PDF. Lo puede descargar el administrador o el cliente dueño del pedido
 * (el permiso se valida en la ruta). No es una factura electrónica ante la DIAN: es el comprobante interno del pedido.
 */
const PDFDocument = require('pdfkit');
const { Venta, Usuario, Estado, DetalleVenta, Producto, Color, Talla } = require('../models');
const E = require('../utils/pdfEstilo');
const { P, cop } = E;

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

        const doc = new PDFDocument({
            size: 'A4', margin: E.MARGEN, bufferPages: true,
            info: { Title: `Comprobante de venta #${venta.VentaID}`, Author: 'StampLab' },
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="comprobante_venta_${venta.VentaID}.pdf"`);
        doc.pipe(res);

        const { left: x0, right: derecha, ancho } = E.medidas(doc);

        // ── Encabezado
        let y = E.encabezado(doc, {
            titulo: 'Comprobante de venta',
            subtitulo: 'Tu marca, nuestra pasión',
            numero: String(venta.VentaID).padStart(6, '0'),
            fecha: fecha(venta.FechaVenta),
            estado: venta.estado?.Nombre,
        });

        // ── Cliente y pedido (dos tarjetas lado a lado)
        const u = venta.usuario || {};
        // Datos del cliente al momento de pedir (si el perfil cambió después, el comprobante no cambia)
        const filasCliente = [['Nombre', venta.ContactoNombre || u.Nombre], ['Documento', venta.DocumentoID], ['Correo', u.Correo], ['Teléfono', venta.ContactoTelefono || u.Telefono]];
        const filasPedido = [['Pago', METODOS[venta.MetodoPago] || 'Por confirmar'], ['Entrega', venta.TipoEntrega === 'envio' ? 'Envío a domicilio' : 'Retiro en tienda']];
        if (venta.MetodoPago === 'contraentrega' || venta.TipoEntrega === 'envio') filasPedido.push(['Recibe', venta.NombreReceptor], ['Teléfono', venta.TelefonoEntrega], ['Dirección', venta.DireccionEntrega]);
        if (venta.FechaEstimadaEntrega && venta.EstadoID !== 11 && venta.EstadoID !== 12) filasPedido.push(['Entrega estimada', new Date(venta.FechaEstimadaEntrega).toLocaleDateString('es-CO', { dateStyle: 'long' })]);
        if (venta.MetodoPago === 'transferencia' && venta.FechaTransferencia) filasPedido.push(['Transferencia', fecha(venta.FechaTransferencia)]);

        const wCaja = ancho / 2 - 8;
        const hFila = (v) => {
            doc.font('Helvetica-Bold').fontSize(9);
            return Math.max(13, doc.heightOfString(String(v ?? '—'), { width: wCaja * 0.58 })) + 6;
        };
        const alturaCaja = (filas) => 44 + filas.reduce((s, [, v]) => s + hFila(v), 0);
        const hCaja = Math.max(alturaCaja(filasCliente), alturaCaja(filasPedido));
        const caja = (titulo, filas, x, color) => {
            doc.roundedRect(x, y, wCaja, hCaja, 8).fillAndStroke(P.bg, P.border);
            doc.rect(x, y + 10, 3, 18).fill(color);
            doc.fillColor(P.navy).font('Helvetica-Bold').fontSize(9.5)
                .text(titulo.toUpperCase(), x + 16, y + 14, { lineBreak: false, characterSpacing: 0.8 });
            let yy = y + 38;
            for (const [k, v] of filas) {
                doc.fillColor(P.muted).font('Helvetica').fontSize(8.5).text(k, x + 16, yy + 0.5, { width: wCaja * 0.3, lineBreak: false });
                doc.fillColor(P.text).font('Helvetica-Bold').fontSize(9).text(String(v ?? '—'), x + 16 + wCaja * 0.32, yy, { width: wCaja * 0.58 });
                yy += hFila(v);
            }
        };
        caja('Cliente', filasCliente, x0, P.accent);
        caja('Pedido', filasPedido, x0 + wCaja + 16, P.violet);
        y += hCaja + 24;

        // ── Tabla de productos
        y = E.seccion(doc, 'Detalle de productos', y);
        const col = { prod: x0 + 14, color: x0 + ancho * 0.40, talla: x0 + ancho * 0.54, cant: x0 + ancho * 0.62, unit: x0 + ancho * 0.72, sub: x0 + ancho * 0.87 };
        const W = { prod: ancho * 0.40 - 20, color: ancho * 0.13, talla: ancho * 0.07, cant: ancho * 0.08, unit: ancho * 0.14, sub: ancho * 0.13 - 14 };
        const cabecera = (yy) => {
            doc.rect(x0, yy, ancho, 22).fill(P.navy);
            doc.fillColor(P.white).font('Helvetica-Bold').fontSize(7.5);
            const o = { lineBreak: false, characterSpacing: 0.7 };
            doc.text('PRODUCTO', col.prod, yy + 7.5, o).text('COLOR', col.color, yy + 7.5, o).text('TALLA', col.talla, yy + 7.5, o);
            doc.text('CANT.', col.cant, yy + 7.5, { ...o, width: W.cant, align: 'right' });
            doc.text('P. UNIT.', col.unit, yy + 7.5, { ...o, width: W.unit, align: 'right' });
            doc.text('SUBTOTAL', col.sub, yy + 7.5, { ...o, width: W.sub, align: 'right' });
            return yy + 22;
        };
        y = cabecera(y);
        let par = true;
        for (const d of venta.detalles || []) {
            if (y > doc.page.height - 150) { doc.addPage(); y = cabecera(E.MARGEN); par = true; }
            if (par) doc.rect(x0, y, ancho, 26).fill(P.bg);
            par = !par;
            doc.fillColor(P.navy).font('Helvetica-Bold').fontSize(9).text(d.producto?.Nombre || 'Producto', col.prod, y + 8, { width: W.prod, height: 11, ellipsis: true });
            doc.font('Helvetica').fillColor(P.muted).fontSize(9)
                .text(colores.get(d.ColorID) || '—', col.color, y + 8, { width: W.color, height: 11, ellipsis: true })
                .text(tallas.get(d.TallaID) || '—', col.talla, y + 8, { width: W.talla, height: 11, ellipsis: true });
            doc.fillColor(P.text).text(String(d.Cantidad), col.cant, y + 8, { width: W.cant, align: 'right', lineBreak: false })
                .text(cop(d.PrecioUnitario), col.unit, y + 8, { width: W.unit, align: 'right', lineBreak: false });
            doc.font('Helvetica-Bold').text(cop((Number(d.PrecioUnitario) || 0) * d.Cantidad), col.sub, y + 8, { width: W.sub, align: 'right', lineBreak: false });
            y += 26;
        }
        doc.moveTo(x0, y).lineTo(derecha, y).strokeColor(P.border).lineWidth(0.8).stroke();

        // ── Totales
        y = E.asegurarEspacio(doc, y + 16, 110);
        const unidades = (venta.detalles || []).reduce((t, d) => t + d.Cantidad, 0);
        const wTot = 230;
        const xTot = derecha - wTot;
        doc.fillColor(P.muted).font('Helvetica').fontSize(9).text(`${unidades} unidad(es) en total`, x0, y, { lineBreak: false });
        const linea = (etiqueta, valor) => {
            doc.fillColor(P.muted).font('Helvetica').fontSize(9.5).text(etiqueta, xTot + 14, y, { width: 100, lineBreak: false });
            doc.fillColor(P.text).font('Helvetica-Bold').text(valor, xTot + 100, y, { width: wTot - 114, align: 'right', lineBreak: false });
            y += 19;
        };
        linea('Subtotal', cop(venta.Subtotal));
        if (Number(venta.CostoEnvio) > 0) linea('Envío', cop(venta.CostoEnvio));
        y += 4;
        doc.roundedRect(xTot, y, wTot, 40, 8).fill(P.navy);
        doc.rect(xTot, y + 8, 4, 24).fill(P.accent);
        doc.fillColor('#cbd5e1').font('Helvetica-Bold').fontSize(8.5).text('TOTAL', xTot + 18, y + 16, { lineBreak: false, characterSpacing: 1 });
        doc.fillColor(P.white).fontSize(16).text(cop(venta.Total), xTot + 60, y + 12, { width: wTot - 76, align: 'right', lineBreak: false });
        y += 40 + 24;

        // ── Nota
        E.cajaNotas(doc, 'Información', [
            'Este documento es un comprobante interno del pedido y no reemplaza una factura electrónica.',
            'Gracias por comprar en StampLab.',
        ], y, { color: P.accentDark, fondo: P.accentSoft, borde: '#bfdbfe' });

        E.pies(doc, `StampLab  ·  Comprobante de venta N.º ${String(venta.VentaID).padStart(6, '0')}  ·  Generado el ${new Date().toLocaleDateString('es-CO')}`);
        doc.end();
    } catch (error) {
        console.error('Error al generar el comprobante:', error);
        if (!res.headersSent) res.status(500).json({ message: 'Error al generar el comprobante', error: error.message });
    }
};
