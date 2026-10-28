// Genera el PDF de una cotización para descarga desde el dashboard
const {
    Cotizacion,
    DetalleCotizacion,
    Estado,
    Usuario,
    CotizacionTecnica,
    CotizacionTalla,
    CotizacionColor,
    CotizacionInsumo,
    Tecnica,
    Talla,
    Color,
    Insumo,
    Producto,
    Parte,
    SubParte,
} = require('../models');

const log = require('../utils/log');
const PDFDocument = require('pdfkit');
const https = require('https');
const http  = require('http');
const E = require('../utils/pdfEstilo');
const { P } = E;
const { leer: leerConfig } = require('../services/config');

// ─────────────────────────────────────────────────────────
// Descarga una imagen remota y devuelve un Buffer
// ─────────────────────────────────────────────────────────
function fetchImageBuffer(url) {
    return new Promise((resolve, reject) => {
        if (!url) return resolve(null);
        const lib = url.startsWith('https') ? https : http;
        lib.get(url, (res) => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end',  () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}


// ─────────────────────────────────────────────────────────
// Imágenes de diseño: el campo real del modelo es "ImagenDiseño" (con ñ) y
// guarda el nombre del archivo subido a uploads/disenos. Se lee del disco;
// solo PNG/JPEG (los formatos que pdfkit sabe dibujar).
// ─────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');
function claveImagenDiseno(tec) {
    return tec['ImagenDiseño'] || tec.ImagenDiseno || null;
}
// "[PERSONALIZADO] Buso - detalle" -> "Buso (personalizado)"
function nombrePersonalizado(detalle) {
    const m = /^\[PERSONALIZADO\]\s*(.+?)(\s+-\s+.*)?$/s.exec(detalle.PrendaDescripcion || '');
    return m ? `${m[1]} (personalizado)` : null;
}
async function cargarImagenDiseno(clave) {
    if (!clave) return null;
    if (/^https?:\/\//i.test(clave)) return fetchImageBuffer(clave);
    const archivo = path.join(__dirname, '..', 'uploads', 'disenos', path.basename(clave));
    if (!fs.existsSync(archivo)) return null;
    const buf = fs.readFileSync(archivo);
    const esPng = buf[0] === 0x89 && buf[1] === 0x50;
    const esJpg = buf[0] === 0xff && buf[1] === 0xd8;
    return (esPng || esJpg) ? buf : null;
}

// ─────────────────────────────────────────────────────────
// CONTROLADOR PRINCIPAL
// ─────────────────────────────────────────────────────────
exports.descargarPdfCotizacion = async (req, res) => {
    try {
        const { cotizacionID } = req.params;

        log('\n' + '='.repeat(60));
        log('GENERANDO PDF DE COTIZACIÓN #' + cotizacionID);
        log('='.repeat(60));

        // ── 1. Obtener cotización completa ──
        const cotizacion = await Cotizacion.findByPk(cotizacionID, {
            include: [
                { model: Usuario,  as: 'usuario' },
                { model: Estado,   as: 'estado'  },
                {
                    model: DetalleCotizacion,
                    as: 'detalles',
                    include: [
                        { model: Producto, as: 'producto' },
                        {
                            model: CotizacionTecnica,
                            as: 'tecnicas',
                            include: [
                                { model: Tecnica,  as: 'tecnica'  },
                                { model: Parte,    as: 'parte'    },
                                ...(SubParte ? [{ model: SubParte, as: 'subparte' }] : []),
                            ]
                        },
                        { model: CotizacionTalla,  as: 'tallas',  include: [{ model: Talla,  as: 'talla'  }] },
                        { model: CotizacionColor,  as: 'colores', include: [{ model: Color,  as: 'color'  }] },
                        { model: CotizacionInsumo, as: 'insumos', include: [{ model: Insumo, as: 'insumo' }] },
                    ]
                }
            ]
        });

        if (!cotizacion) {
            return res.status(404).json({ message: 'Cotización no encontrada', cotizacionID });
        }

        // ── 2. Validar que todos los diseños tienen costo ──
        const todasLasTecnicas = cotizacion.detalles?.flatMap(d => d.tecnicas || []) || [];
        const tecnicasSinCosto = todasLasTecnicas.filter(t => !t.CostoTecnica || parseFloat(t.CostoTecnica) === 0);

        if (tecnicasSinCosto.length > 0) {
            return res.status(400).json({
                message: `No se puede generar el PDF. Hay ${tecnicasSinCosto.length} diseño(s) sin precio asignado.`,
                tecnicasSinCosto: tecnicasSinCosto.map(t => `${t.tecnica?.Nombre || 'Técnica'} en ${t.parte?.Nombre || 'N/A'}`),
                instruccion: 'Asigna el costo de todos los diseños antes de descargar el PDF.'
            });
        }

        // ── 3. Pre-cargar imágenes de diseños ──
        const imagenesDisenos = {};
        for (const detalle of cotizacion.detalles || []) {
            for (const tec of detalle.tecnicas || []) {
                const imgUrl = claveImagenDiseno(tec);
                if (imgUrl && !imagenesDisenos[imgUrl]) {
                    try {
                        imagenesDisenos[imgUrl] = await cargarImagenDiseno(imgUrl);
                    } catch (e) {
                        console.warn('No se pudo cargar imagen:', imgUrl, e.message);
                        imagenesDisenos[imgUrl] = null;
                    }
                }
            }
        }

        // ── 4. Crear el documento PDF ──
        const doc = new PDFDocument({
            size: 'A4',
            margin: E.MARGEN,
            bufferPages: true,
            info: {
                Title:   `Cotización #${cotizacion.CotizacionID}`,
                Author:  'StampLab',
                Subject: 'Cotización de productos personalizados',
            },
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="cotizacion_${cotizacion.CotizacionID}.pdf"`);
        doc.pipe(res);

        const { left: LEFT, right: RIGHT, ancho: pageW } = E.medidas(doc);

        // ── Encabezado ──
        let y = E.encabezado(doc, {
            titulo:    'Cotización de productos personalizados',
            subtitulo: 'Tu marca, nuestra pasión',
            numero:    `#${cotizacion.CotizacionID}`,
            fecha:     E.fechaLarga(cotizacion.FechaCotizacion),
            estado:    cotizacion.estado?.Nombre || 'Pendiente',
        });

        // ── Información del cliente ──
        y = E.seccion(doc, 'Información del cliente', y);
        const u = cotizacion.usuario || {};
        const colW = pageW / 2 - 30;
        doc.roundedRect(LEFT, y, pageW, 82, 8).fillAndStroke(P.bg, P.border);
        E.campo(doc, 'Nombre',    u.Nombre,      LEFT + 18,            y + 12, colW);
        E.campo(doc, 'Documento', u.DocumentoID, LEFT + pageW / 2 + 6, y + 12, colW);
        E.campo(doc, 'Correo',    u.Correo,      LEFT + 18,            y + 47, colW);
        E.campo(doc, 'Teléfono',  u.Telefono,    LEFT + pageW / 2 + 6, y + 47, colW);
        y += 82 + 22;

        // ── Detalle de productos ──
        y = E.seccion(doc, 'Detalle de productos', y);

        for (let idx = 0; idx < cotizacion.detalles.length; idx++) {
            const detalle = cotizacion.detalles[idx];
            const color   = idx % 2 === 0 ? P.accent : P.violet;
            const soft    = idx % 2 === 0 ? P.accentSoft : P.violetSoft;

            // La cabecera y el primer bloque deben caber juntos
            y = E.asegurarEspacio(doc, y, 110);
            let segY = y;
            const cerrarTramo = (fin) => {
                doc.roundedRect(LEFT, segY, pageW, fin - segY, 6).strokeColor(P.border).lineWidth(0.8).stroke();
                doc.rect(LEFT, segY, 4, fin - segY).fill(color);
            };
            // Salta de página si el bloque no cabe, cerrando el tramo actual de la tarjeta
            const espacio = (cy, alto) => {
                if (cy + alto <= doc.page.height - 56) return cy;
                cerrarTramo(cy + 6);
                doc.addPage();
                segY = E.MARGEN;
                return segY + 12;
            };

            // Cabecera de la tarjeta
            doc.rect(LEFT, y, pageW, 34).fill(soft);
            const nombreProducto = detalle.TraePrenda
                ? 'Prenda llevada por el cliente'
                : (detalle.producto?.Nombre || nombrePersonalizado(detalle) || 'Producto sin especificar');
            doc.fillColor(P.navy).font('Helvetica-Bold').fontSize(12)
                .text(`${idx + 1}.  ${nombreProducto}`, LEFT + 16, y + 11, { width: pageW - 130, height: 15, ellipsis: true });
            const uni = `${detalle.Cantidad} ${Number(detalle.Cantidad) === 1 ? 'unidad' : 'unidades'}`;
            doc.roundedRect(RIGHT - 92, y + 8, 80, 18, 9).fill(color);
            doc.fillColor(P.white).font('Helvetica-Bold').fontSize(8)
                .text(uni, RIGHT - 92, y + 13.5, { width: 80, align: 'center', lineBreak: false });

            const cardX = LEFT + 18;
            const cardW = pageW - 36;
            let cy = y + 34 + 14;

            // Prenda propia
            if (detalle.TraePrenda && detalle.PrendaDescripcion) {
                cy = espacio(cy, 40);
                cy = E.etiquetaGrupo(doc, 'Descripción', cardX, cy);
                doc.fillColor(P.text).font('Helvetica').fontSize(9).text(detalle.PrendaDescripcion, cardX, cy, { width: cardW });
                cy += doc.heightOfString(detalle.PrendaDescripcion, { width: cardW }) + 10;
            }

            // Tallas
            if (!detalle.TraePrenda && detalle.tallas?.length > 0) {
                cy = espacio(cy, 44);
                cy = E.etiquetaGrupo(doc, 'Tallas', cardX, cy);
                cy = E.filaChips(doc, detalle.tallas.map(t =>
                    `${t.talla?.Nombre || '?'} · ${t.Cantidad} uds · ${E.cop(t.talla?.Precio)}`), cardX, cy, cardW, P.navy, '#e8edf5');
            }

            // Colores
            if (!detalle.TraePrenda && detalle.colores?.length > 0) {
                cy = espacio(cy, 44);
                cy = E.etiquetaGrupo(doc, 'Colores', cardX, cy);
                cy = E.filaChips(doc, detalle.colores.map(c =>
                    `${c.color?.Nombre || '?'} · ${c.Cantidad} uds`), cardX, cy, cardW, P.success, P.successSoft);
            }

            // Telas / insumos
            if (!detalle.TraePrenda && detalle.insumos?.length > 0) {
                cy = espacio(cy, 44);
                cy = E.etiquetaGrupo(doc, 'Telas / insumos', cardX, cy);
                cy = E.filaChips(doc, detalle.insumos.map(i =>
                    `${i.insumo?.Nombre || 'Tela'} · +${E.cop(i.insumo?.PrecioTela)}`), cardX, cy, cardW, P.warning, P.warningSoft);
            }

            // Diseños aplicados
            if (detalle.tecnicas?.length > 0) {
                cy = espacio(cy, 110); // el título no debe quedar solo al final de una página
                cy = E.etiquetaGrupo(doc, `Diseños aplicados (${detalle.tecnicas.length})`, cardX, cy + 2);

                for (const tec of detalle.tecnicas) {
                    const imgUrl    = claveImagenDiseno(tec);
                    const imgBuffer = imgUrl ? imagenesDisenos[imgUrl] : null;
                    const IMG = 64;
                    const textX = imgBuffer ? cardX + IMG + 26 : cardX + 14;
                    const textW = cardW - (textX - cardX) - 100;

                    doc.font('Helvetica-Oblique').fontSize(8);
                    const obsH = tec.Observaciones ? doc.heightOfString(`Obs: ${tec.Observaciones}`, { width: textW }) + 3 : 0;
                    const rowH = Math.max(imgBuffer ? IMG + 16 : 0, 58 + obsH);

                    cy = espacio(cy, rowH + 8);

                    doc.roundedRect(cardX, cy, cardW, rowH, 6).fillAndStroke(P.white, '#ddd6fe');
                    doc.rect(cardX, cy + 6, 3, rowH - 12).fill(P.violet);

                    if (imgBuffer) {
                        doc.roundedRect(cardX + 10, cy + 8, IMG + 4, IMG + 4, 4).fillAndStroke(P.bg, P.border);
                        try {
                            doc.image(imgBuffer, cardX + 12, cy + 10, { fit: [IMG, IMG], align: 'center', valign: 'center' });
                        } catch (_) {
                            doc.fillColor(P.soft).font('Helvetica').fontSize(7)
                                .text('sin imagen', cardX + 12, cy + 10 + IMG / 2 - 4, { width: IMG, align: 'center', lineBreak: false });
                        }
                    }

                    doc.fillColor(P.violet).font('Helvetica-Bold').fontSize(10)
                        .text(tec.tecnica?.Nombre || 'Técnica', textX, cy + 10, { width: textW, height: 13, ellipsis: true });

                    const parteLabel    = tec.parte?.Nombre || 'Sin parte';
                    const subParteLabel = tec.subparte?.Nombre || tec.SubParteNombre || tec.NombreSubParte || 'Sin subparte';
                    doc.fillColor(P.muted).font('Helvetica').fontSize(8).text('Parte', textX, cy + 26, { lineBreak: false });
                    doc.fillColor(P.text).font('Helvetica-Bold').text(parteLabel, textX + 42, cy + 26, { width: textW - 42, height: 10, ellipsis: true });
                    doc.fillColor(P.muted).font('Helvetica').text('Subparte', textX, cy + 38, { lineBreak: false });
                    doc.fillColor(P.text).font('Helvetica-Bold').text(subParteLabel, textX + 42, cy + 38, { width: textW - 42, height: 10, ellipsis: true });
                    if (tec.Observaciones) {
                        doc.fillColor(P.muted).font('Helvetica-Oblique').fontSize(8)
                            .text(`Obs: ${tec.Observaciones}`, textX, cy + 51, { width: textW });
                    }

                    // Costo (píldora verde)
                    const costoW = 82;
                    doc.roundedRect(cardX + cardW - costoW - 10, cy + 9, costoW, 20, 10).fill(P.successSoft);
                    doc.fillColor(P.success).font('Helvetica-Bold').fontSize(9.5)
                        .text(E.cop(tec.CostoTecnica), cardX + cardW - costoW - 10, cy + 15, { width: costoW, align: 'center', lineBreak: false });

                    cy += rowH + 8;
                }
            }

            cy += 6;
            cerrarTramo(cy);
            y = cy + 16;
        }

        // ── Resumen de precios ──
        y = E.asegurarEspacio(doc, y, 150);
        y = E.seccion(doc, 'Resumen de precios', y);

        const cDesc = LEFT + 14, cCant = LEFT + pageW * 0.52, cUnit = LEFT + pageW * 0.64, cSub = LEFT + pageW * 0.82;
        const wCant = pageW * 0.10, wUnit = pageW * 0.16, wSub = pageW * 0.18 - 14;
        const cabeceraTabla = (yy) => {
            doc.rect(LEFT, yy, pageW, 22).fill(P.navy);
            doc.fillColor(P.white).font('Helvetica-Bold').fontSize(7.5);
            doc.text('PRODUCTO', cDesc, yy + 7.5, { lineBreak: false, characterSpacing: 0.7 });
            doc.text('CANT.', cCant, yy + 7.5, { width: wCant, align: 'right', lineBreak: false, characterSpacing: 0.7 });
            doc.text('P. UNITARIO', cUnit, yy + 7.5, { width: wUnit, align: 'right', lineBreak: false, characterSpacing: 0.7 });
            doc.text('SUBTOTAL', cSub, yy + 7.5, { width: wSub, align: 'right', lineBreak: false, characterSpacing: 0.7 });
            return yy + 22;
        };
        y = cabeceraTabla(y);

        let granTotal = 0;
        for (let idx = 0; idx < cotizacion.detalles.length; idx++) {
            const detalle = cotizacion.detalles[idx];

            // Producto personalizado: trae su propio precio unitario
            const precioPropio  = parseFloat(detalle.PrecioUnitario || 0);
            const precioBase    = precioPropio > 0 ? precioPropio : parseFloat(detalle.producto?.PrecioBase || 0);
            const precioTalla   = precioPropio > 0 ? 0 : parseFloat(detalle.tallas?.[0]?.talla?.Precio || 0);
            const precioTela    = precioPropio > 0 ? 0 : parseFloat(detalle.insumos?.[0]?.insumo?.PrecioTela || 0);
            const costoTecnicas = (detalle.tecnicas || []).reduce((s, t) => s + parseFloat(t.CostoTecnica || 0), 0);
            const precioUnit    = precioBase + precioTalla + precioTela + costoTecnicas;
            const subtotal      = precioUnit * detalle.Cantidad;
            granTotal          += subtotal;

            const desglose = [
                precioBase    > 0 ? `Base ${E.cop(precioBase)}`       : null,
                precioTalla   > 0 ? `Talla ${E.cop(precioTalla)}`     : null,
                precioTela    > 0 ? `Tela ${E.cop(precioTela)}`       : null,
                costoTecnicas > 0 ? `Diseños ${E.cop(costoTecnicas)}` : null,
            ].filter(Boolean).join('   ·   ');

            const filaH = desglose ? 36 : 24;
            if (y + filaH > doc.page.height - 60) { doc.addPage(); y = cabeceraTabla(E.MARGEN); }

            if (idx % 2 === 0) doc.rect(LEFT, y, pageW, filaH).fill(P.bg);
            const nombreProd = detalle.TraePrenda
                ? 'Prenda propia'
                : (detalle.producto?.Nombre || nombrePersonalizado(detalle) || 'Producto');
            doc.fillColor(P.navy).font('Helvetica-Bold').fontSize(9.5)
                .text(`${idx + 1}. ${nombreProd}`, cDesc, y + 6, { width: cCant - cDesc - 8, height: 12, ellipsis: true });
            if (desglose) {
                doc.fillColor(P.muted).font('Helvetica').fontSize(7.5)
                    .text(desglose, cDesc + 10, y + 21, { width: cCant - cDesc - 18, height: 10, ellipsis: true });
            }
            doc.fillColor(P.text).font('Helvetica').fontSize(9.5)
                .text(String(detalle.Cantidad), cCant, y + 6, { width: wCant, align: 'right', lineBreak: false });
            doc.text(E.cop(precioUnit), cUnit, y + 6, { width: wUnit, align: 'right', lineBreak: false });
            doc.font('Helvetica-Bold').text(E.cop(subtotal), cSub, y + 6, { width: wSub, align: 'right', lineBreak: false });
            y += filaH;
        }
        doc.moveTo(LEFT, y).lineTo(RIGHT, y).strokeColor(P.border).lineWidth(0.8).stroke();

        // Total
        y = E.asegurarEspacio(doc, y + 14, 44);
        const totW = 230;
        doc.roundedRect(RIGHT - totW, y, totW, 40, 8).fill(P.navy);
        doc.rect(RIGHT - totW, y + 8, 4, 24).fill(P.accent);
        doc.fillColor('#cbd5e1').font('Helvetica-Bold').fontSize(8.5)
            .text('TOTAL', RIGHT - totW + 18, y + 16, { lineBreak: false, characterSpacing: 1 });
        doc.fillColor(P.white).font('Helvetica-Bold').fontSize(16)
            .text(E.cop(cotizacion.ValorTotal || granTotal), RIGHT - totW + 60, y + 12, { width: totW - 76, align: 'right', lineBreak: false });
        y += 40 + 22;

        // ── Notas ──
        const { vigenciaCotizacionDias: vigencia } = leerConfig();
        y = E.cajaNotas(doc, 'Notas importantes', [
            vigencia > 0
                ? `Esta cotización es válida por ${vigencia} días calendario a partir de la fecha de emisión.`
                : 'Esta cotización no tiene fecha de vencimiento.',
            'Los precios están expresados en pesos colombianos (COP).',
            'El stock se descuenta únicamente al convertir la cotización en venta.',
        ], y);

        E.pies(doc, `StampLab  ·  Cotización #${cotizacion.CotizacionID}  ·  Generado el ${new Date().toLocaleDateString('es-CO')}`);
        doc.end();

        log(`✅ PDF generado correctamente para cotización #${cotizacionID}`);

    } catch (error) {
        console.error('\nERROR AL GENERAR PDF:', error.message);
        if (!res.headersSent) {
            res.status(500).json({
                message: 'Error al generar el PDF',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            });
        }
    }
};
