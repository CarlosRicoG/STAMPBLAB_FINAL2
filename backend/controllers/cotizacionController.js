const {
    Cotizacion, DetalleCotizacion, Estado, Usuario, CotizacionTecnica,
    CotizacionTalla, CotizacionColor, CotizacionInsumo, Tecnica, Talla,
    Color, Insumo, Producto, Parte, Venta, DetalleVenta, InventarioProducto, sequelize
} = require('../models');
const notificaciones = require('../services/notificaciones');
const { ESTADO_COTIZACION, ESTADO_VENTA } = require('../config/estados');
const inventario = require('../services/inventario');
const historial = require('../services/historial');
const { esAdmin } = require('../middleware/authMiddleware');
const { ErrorNegocio } = inventario;
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

function obtenerNombreProducto(detalle) {
    if (detalle.TraePrenda) return "Prenda llevada por el cliente";
    return detalle.producto?.Nombre || "Producto sin especificar";
}

// ============================================
// FUNCIÓN PRINCIPAL: CREAR COTIZACIÓN INTELIGENTE
// ============================================
exports.createCotizacionInteligente = async (req, res) => {
    try {                                                                               // 1
        const { DocumentoID, FechaCotizacion, detalles } = req.body;                    // 2
        if (!DocumentoID) {                                                             // 3
            return res.status(400).json({ message: 'DocumentoID es obligatorio' });     // 4
        }                                                                               // 5
        if (!detalles || detalles.length === 0) {                                       // 6
            return res.status(400).json({ message: 'Debe incluir al menos un producto' }); // 7
        }                                                                               // 8
        const usuario = await Usuario.findByPk(DocumentoID);                            // 9
        if (!usuario) {                                                                 // 10
            return res.status(404).json({ message: 'Usuario no encontrado' });          // 11
        }                                                                               // 12
        const tieneDiseños = detalles.some(detalle =>                                   // 13
            detalle.tecnicas && Array.isArray(detalle.tecnicas) && detalle.tecnicas.length > 0 // 14
        );                                                                              // 15
        if (!tieneDiseños) {                                                            // 16
            return await crearVentaDirecta(req, res, { DocumentoID, FechaCotizacion, detalles, usuario }); // 17
        } else {                                                                        // 18
            return await crearCotizacionConDiseños(req, res, {
                DocumentoID, FechaCotizacion,
                detalles, usuario
            }); // 19
        }                                                                               // 20
    } catch (error) {                                                                   // 21
        if (error.esErrorNegocio) return res.status(error.status || 400).json({ message: error.message });
        console.error('ERROR EN COTIZACIÓN INTELIGENTE:', error.message);               // 22
        res.status(500).json({                                                          // 23
            message: 'Error al procesar la solicitud',                                  // 24
            error: error.message,                                                       // 25
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined     // 26
        });                                                                             // 27
    }                                                                                   // 28
};


// ============================================
// CREAR VENTA DIRECTA (SIN DISEÑOS) - CON FIX TraePrenda
// ============================================
async function crearVentaDirecta(req, res, { DocumentoID, FechaCotizacion, detalles, usuario }) {
    // 1) Precios y líneas (solo lecturas)
    let subtotal = 0;
    const lineas = [];
    for (const detalle of detalles) {
        const cantidad = parseInt(detalle.Cantidad);
        if (detalle.TraePrenda) {
            lineas.push({ ProductoID: null, ColorID: null, TallaID: null, TelaID: null, Cantidad: cantidad, PrecioUnitario: 0, TraePrenda: true });
            continue;
        }
        const colorID = detalle.colores?.[0]?.ColorID;
        const insumoID = detalle.insumos?.[0]?.InsumoID;
        // Una línea por talla pedida (con su cantidad); con una sola talla sin cantidad propia se usa la del producto
        const tallasPedidas = (detalle.tallas || []).filter((t) => t?.TallaID);
        const porTalla = tallasPedidas
            .map((t) => ({ tallaID: t.TallaID, cantidad: parseInt(t.Cantidad, 10) || (tallasPedidas.length === 1 ? cantidad : 0) }))
            .filter((t) => t.cantidad > 0);
        if (!colorID || !porTalla.length) throw new ErrorNegocio('Se requiere Color y Talla');
        const producto = await Producto.findByPk(detalle.ProductoID);
        if (!producto) throw new ErrorNegocio(`Producto ${detalle.ProductoID} no encontrado`, 404);
        const precioTela = parseFloat((await Insumo.findByPk(insumoID))?.PrecioTela) || 0;
        for (const { tallaID, cantidad: cantTalla } of porTalla) {
            const precioUnitario = (parseFloat(producto.PrecioBase) || 0)
                + (parseFloat((await Talla.findByPk(tallaID))?.Precio) || 0)
                + precioTela;
            subtotal += precioUnitario * cantTalla;
            lineas.push({
                ProductoID: detalle.ProductoID, ColorID: colorID, TallaID: tallaID, TelaID: insumoID || null,
                Cantidad: cantTalla, PrecioUnitario: precioUnitario, TraePrenda: false, Nombre: producto.Nombre
            });
        }
    }

    // Un pedido solo de "prenda propia" y sin diseños no tiene nada que cobrar ni fabricar: se rechaza (evita pedidos de $0)
    if (!lineas.some((l) => !l.TraePrenda)) {
        throw new ErrorNegocio('Agrega al menos un producto del catálogo o un diseño (estampado) para continuar');
    }

    // 2) Todo en una transacción: descuenta stock (con bloqueo, sin sobreventa), crea la venta y sus detalles
    const tx = await sequelize.transaction();
    try {
        await inventario.reservar(lineas, tx);
        const nuevaVenta = await Venta.create({
            DocumentoID, FechaVenta: FechaCotizacion || new Date(),
            Subtotal: subtotal, Total: subtotal, EstadoID: ESTADO_VENTA.PENDIENTE,
            ContactoNombre: usuario?.Nombre, ContactoTelefono: usuario?.Telefono, ContactoDireccion: usuario?.Direccion
        }, { transaction: tx });
        await historial.registrar({ tipo: 'venta', refId: nuevaVenta.VentaID, estadoId: ESTADO_VENTA.PENDIENTE, nota: 'Pedido recibido', documentoId: DocumentoID }, tx);
        for (const l of lineas) {
            await DetalleVenta.create({
                VentaID: nuevaVenta.VentaID, ProductoID: l.ProductoID, ColorID: l.ColorID, TallaID: l.TallaID,
                InventarioID: l.InventarioID || null, Cantidad: l.Cantidad, PrecioUnitario: l.PrecioUnitario
            }, { transaction: tx });
        }
        await tx.commit();
        notificaciones.pedidoRecibido(nuevaVenta.VentaID);
        return res.status(201).json({
            tipo: 'venta', message: 'Venta pendiente creada exitosamente',
            venta: nuevaVenta, detalles: lineas
        });
    } catch (error) {
        await tx.rollback();
        throw error;
    }
}


// ============================================
// CREAR COTIZACIÓN CON DISEÑOS (SIN DESCUENTO DE STOCK)
// ============================================
async function crearCotizacionConDiseños(req, res, { DocumentoID, FechaCotizacion, detalles, usuario }) {
    const tx = await sequelize.transaction(); // si algo falla a mitad de camino no queda una cotización incompleta
    try {                                                                               // 1
        const nuevaCotizacion = await Cotizacion.create({                               // 2
            DocumentoID, FechaCotizacion: FechaCotizacion || new Date(),                // 3
            ValorTotal: 0, EstadoID: ESTADO_COTIZACION.PENDIENTE                                                  // 4
        }, { transaction: tx });                                                        // 5
        for (let i = 0; i < detalles.length; i++) {                                     // 6
            const detalle = detalles[i];                                                // 7
            const nuevoDetalle = await DetalleCotizacion.create({                       // 8
                CotizacionID: nuevaCotizacion.CotizacionID, ProductoID: detalle.ProductoID, // 9
                Cantidad: detalle.Cantidad, TraePrenda: Boolean(detalle.TraePrenda),    // 10
                PrendaDescripcion: detalle.PrendaDescripcion || null                    // 11
            }, { transaction: tx });                                                    // 12
            if (detalle.tecnicas?.length > 0) {                                         // 13
                await CotizacionTecnica.bulkCreate(detalle.tecnicas.map(t => ({         // 14
                    DetalleCotizacionID: nuevoDetalle.DetalleCotizacionID,              // 15
                    TecnicaID: t.TecnicaID, ParteID: t.ParteID, ImagenDiseño: t.ImagenDiseño, // 16
                    Observaciones: t.Observaciones, CostoTecnica: t.CostoTecnica || 0   // 17
                })), { transaction: tx });                                                                   // 18
            }                                                                           // 19
            if (!detalle.TraePrenda) {                                                  // 20
                if (detalle.tallas?.length > 0) await CotizacionTalla.bulkCreate(detalle.
                    tallas.map(t => ({
                        DetalleCotizacionID: nuevoDetalle.
                            DetalleCotizacionID, TallaID: t.TallaID, Cantidad:
                            t.Cantidad, PrecioTalla: t.PrecioTalla || 0
                    })), { transaction: tx }); // 21
                if (detalle.colores?.length > 0) await CotizacionColor.bulkCreate(detalle.
                    colores.map(c => ({
                        DetalleCotizacionID: nuevoDetalle.
                            DetalleCotizacionID, ColorID: c.ColorID, Cantidad: c.Cantidad
                    })), { transaction: tx }); // 22
                if (detalle.insumos?.length > 0) await CotizacionInsumo.bulkCreate(detalle.
                    insumos.map(i => ({
                        DetalleCotizacionID: nuevoDetalle.
                            DetalleCotizacionID, InsumoID: i.InsumoID, CantidadRequerida:
                            i.CantidadRequerida
                    })), { transaction: tx }); // 23
            }                                                                           // 24
        }                                                                               // 25
        await tx.commit();
        await historial.registrar({ tipo: 'cotizacion', refId: nuevaCotizacion.CotizacionID, estadoId: nuevaCotizacion.EstadoID, nota: 'Cotización recibida', documentoId: DocumentoID });
        notificaciones.cotizacionRecibida(nuevaCotizacion.CotizacionID);
        const cotizacionCompleta = await Cotizacion.findByPk(nuevaCotizacion.CotizacionID, { // 26
            include: [                                                                  // 27
                { model: Usuario, as: 'usuario' }, { model: Estado, as: 'estado' },     // 28
                {
                    model: DetalleCotizacion, as: 'detalles', include: [{
                        model:
                            Producto, as: 'producto'
                    }, {
                        model: CotizacionTecnica, as: 'tecnicas',
                        include: [{ model: Tecnica, as: 'tecnica' }, {
                            model:
                                Parte, as: 'parte'
                        }]
                    }, {
                        model: CotizacionTalla, as: 'tallas',
                        include: [{ model: Talla, as: 'talla' }]
                    },
                    {
                        model: CotizacionColor, as: 'colores', include: [{
                            model: Color, as: 'color'
                        }]
                    }, {
                        model: CotizacionInsumo,
                        as: 'insumos', include: [{ model: Insumo, as: 'insumo' }]
                    }]
                } // 29
            ]                                                                           // 30
        });                                                                             // 31
        return res.status(201).json({ tipo: 'cotizacion', message: 'Cotización creada exitosamente', cotizacion: cotizacionCompleta }); // 32
    } catch (error) {                                                                   // 33
        if (!tx.finished) await tx.rollback();
        throw error;                                                                    // 34
    }                                                                                   // 35
}



// Subtotal de una línea de cotización. ÚNICA fórmula de precio: la usan el valor que ve el cliente
// (calcularValorTotalCotizacion) y el pedido que se crea al aceptar (convertirCotizacionAVenta), para que nunca difieran.
// Requiere el detalle con producto, tallas(+talla), insumos(+insumo) y tecnicas.
function subtotalDetalle(detalle) {
    const cantidad = parseFloat(detalle.Cantidad) || 0;
    let subtotal = 0;
    if (detalle.PrecioUnitario && parseFloat(detalle.PrecioUnitario) > 0) {
        // Producto personalizado con precio propio
        subtotal += parseFloat(detalle.PrecioUnitario) * cantidad;
    } else {
        subtotal += (parseFloat(detalle.producto?.PrecioBase) || 0) * cantidad;
        for (const insumo of detalle.insumos || []) subtotal += (parseFloat(insumo.insumo?.PrecioTela) || 0) * (parseFloat(insumo.CantidadRequerida) || 0);
        for (const talla of detalle.tallas || []) subtotal += (parseFloat(talla.talla?.Precio) || 0) * (parseInt(talla.Cantidad, 10) || 0);
    }
    // Las técnicas siempre suman
    for (const tecnica of detalle.tecnicas || []) subtotal += (parseFloat(tecnica.CostoTecnica) || 0) * cantidad;
    return subtotal;
}

// ============================================
// CONVERTIR COTIZACIÓN A VENTA - CON FIX TraePrenda
// ============================================
exports.convertirCotizacionAVenta = async (req, res) => {
    try {                                                                               // 1
        const { cotizacionID } = req.params;                                            // 2
        const cotizacion = await Cotizacion.findByPk(cotizacionID, {                    // 3
            include: [                                                                  // 4
                {
                    model: DetalleCotizacion, as: 'detalles', include: [                  // 5
                        { model: Producto, as: 'producto' },                            // 6
                        {
                            model: CotizacionTalla, as: 'tallas', include: [{
                                model: Talla,
                                as: 'talla'
                            }]
                        }, // 7
                        {
                            model: CotizacionColor, as: 'colores', include: [{
                                model: Color, as: 'color'
                            }]
                        }, // 8
                        {
                            model: CotizacionInsumo, as: 'insumos', include: [{
                                model: Insumo, as: 'insumo'
                            }]
                        }, // 9
                        {
                            model: CotizacionTecnica, as: 'tecnicas', include: [{
                                model: Tecnica, as: 'tecnica'
                            }, { model: Parte, as: 'parte' }]
                        } // 10
                    ]
                },                                                                 // 11
                { model: Usuario, as: 'usuario' }, { model: Estado, as: 'estado' }      // 12
            ]                                                                           // 13
        });                                                                             // 14
        if (!cotizacion) return res.status(404).json({ message: 'Cotización no encontrada', cotizacionID }); // 15
        if (cotizacion.EstadoID === ESTADO_COTIZACION.PROCESADA) return res.status(400).json({ message: 'Esta cotización ya fue convertida a venta' });
        if (cotizacion.EstadoID !== ESTADO_COTIZACION.APROBADA) return res.status(400).json({
            message: `Solo se pueden convertir cotizaciones aprobadas (estado actual: ${cotizacion.estado?.Nombre || cotizacion.EstadoID})`
        });
        if (!cotizacion.detalles || cotizacion.detalles.length === 0) return res.status(400).json({
            message: 'La cotización no tiene productos asociados'
        });

        // 1) Líneas de la venta con su precio
        // El pedido respeta lo que el cliente aprobó: su total es el ValorTotal aprobado (precio congelado) y el precio
        // de cada línea se reparte con la misma fórmula (subtotalDetalle), así Σ líneas = total del pedido.
        const subtotales = cotizacion.detalles.map(subtotalDetalle);
        const sumaSubtotales = subtotales.reduce((s, v) => s + v, 0);
        const aprobado = parseFloat(cotizacion.ValorTotal) || 0;
        const total = aprobado > 0 ? aprobado : sumaSubtotales;
        const factor = sumaSubtotales > 0 ? total / sumaSubtotales : 1;

        const lineas = [];
        cotizacion.detalles.forEach((detalle, i) => {
            const traePrenda = Boolean(detalle.TraePrenda);
            const colorID = detalle.colores?.[0]?.ColorID || null;
            const telaID = detalle.insumos?.[0]?.InsumoID || null;
            // Una línea de pedido por talla cotizada (con su cantidad); sin cantidades por talla, una sola línea
            const cantidadProducto = parseInt(detalle.Cantidad, 10) || 0;
            const porTalla = (detalle.tallas || [])
                .map((t) => ({ tallaID: t.TallaID, cantidad: parseInt(t.Cantidad, 10) || 0 }))
                .filter((t) => t.cantidad > 0);
            // Si las cantidades por talla no suman la cantidad cotizada del producto, no se confía en ellas
            // (se cobraría una cantidad y se reservaría otra): una sola línea con la cantidad del producto.
            const coincide = porTalla.reduce((s, t) => s + t.cantidad, 0) === cantidadProducto;
            const variantes = porTalla.length && coincide ? porTalla : [{ tallaID: detalle.tallas?.[0]?.TallaID || null, cantidad: cantidadProducto }];
            const unidades = variantes.reduce((s, v) => s + v.cantidad, 0);
            for (const v of variantes) {
                const usaInventario = !traePrenda && detalle.ProductoID && colorID && v.tallaID;
                lineas.push({ detalle, colorID, tallaID: v.tallaID, telaID, cantidad: v.cantidad, usaInventario, subtotalLinea: unidades > 0 ? subtotales[i] * (v.cantidad / unidades) : 0 });
            }
        });
        // Precio de cada línea: su parte del subtotal aprobado entre sus unidades (Σ líneas = total del pedido).
        // Si todo el subtotal calculado es 0 pero el total aprobado no (valor fijado a mano), se reparte por unidades.
        const unidadesTotales = lineas.reduce((s, l) => s + l.cantidad, 0);
        for (const l of lineas) {
            l.precioUnitario = l.cantidad <= 0 ? 0
                : sumaSubtotales > 0 ? (l.subtotalLinea * factor) / l.cantidad
                : (unidadesTotales > 0 ? total / unidadesTotales : 0);
        }

        // 2) Todo dentro de una transacción: si algo falla no queda una venta a medias
        const resultado = await sequelize.transaction(async (t) => {
            // La cotización se vuelve a leer BAJO BLOQUEO: dos clics simultáneos no pueden crear dos ventas
            const fresca = await Cotizacion.findByPk(cotizacion.CotizacionID, { transaction: t, lock: t.LOCK.UPDATE });
            if (fresca.EstadoID === ESTADO_COTIZACION.PROCESADA) throw new ErrorNegocio('Esta cotización ya fue convertida a venta');
            if (fresca.EstadoID !== ESTADO_COTIZACION.APROBADA) throw new ErrorNegocio('Solo se pueden convertir cotizaciones aprobadas');

            const lineasInv = lineas.filter((l) => l.usaInventario).map((l) => ({
                ProductoID: l.detalle.ProductoID, ColorID: l.colorID, TallaID: l.tallaID, TelaID: l.telaID,
                Cantidad: l.cantidad, _linea: l,
                Nombre: [l.detalle.producto?.Nombre || `Producto ${l.detalle.ProductoID}`, l.detalle.colores?.[0]?.color?.Nombre, l.detalle.tallas?.find((x) => x.TallaID === l.tallaID)?.talla?.Nombre].filter(Boolean).join(' / ')
            }));
            await inventario.reservar(lineasInv, t);
            for (const li of lineasInv) li._linea.inventarioID = li.InventarioID;

            const venta = await Venta.create({
                DocumentoID: cotizacion.DocumentoID, FechaVenta: new Date(),
                Subtotal: total, Total: total, EstadoID: ESTADO_VENTA.PENDIENTE,
                ContactoNombre: cotizacion.usuario?.Nombre, ContactoTelefono: cotizacion.usuario?.Telefono, ContactoDireccion: cotizacion.usuario?.Direccion
            }, { transaction: t });
            const aceptoElCliente = !esAdmin(req);
            await historial.registrar({ tipo: 'venta', refId: venta.VentaID, estadoId: ESTADO_VENTA.PENDIENTE, nota: `Pedido creado desde la cotización #${cotizacion.CotizacionID}`, documentoId: req.usuario?.id }, t);
            await historial.registrar({ tipo: 'cotizacion', refId: cotizacion.CotizacionID, estadoId: ESTADO_COTIZACION.PROCESADA, nota: aceptoElCliente ? 'Aceptada por el cliente: se creó el pedido #' + venta.VentaID : 'Convertida en pedido #' + venta.VentaID, documentoId: req.usuario?.id }, t);
            for (const l of lineas) {
                await DetalleVenta.create({
                    VentaID: venta.VentaID, ProductoID: l.detalle.ProductoID || null,
                    ColorID: l.colorID, TallaID: l.tallaID, InventarioID: l.inventarioID || null,
                    Cantidad: l.cantidad, PrecioUnitario: l.precioUnitario
                }, { transaction: t });
            }
            await cotizacion.update({ EstadoID: ESTADO_COTIZACION.PROCESADA, ValorTotal: total }, { transaction: t });
            return venta;
        });

        notificaciones.pedidoRecibido(resultado.VentaID);
        return res.status(201).json({
            message: 'Cotización convertida a venta exitosamente', venta: resultado,
            cotizacionID: cotizacion.CotizacionID
        });
    } catch (error) {                                                                   // 58
        if (error.esErrorNegocio || error.status === 400) return res.status(error.status || 400).json({ message: error.message });
        res.status(500).json({ message: 'Error al convertir cotización', error: error.message }); // 59
    }                                                                                   // 60
};


// ============================================
// ENDPOINT: VER IMAGEN DE DISEÑO
// Sirve la imagen guardada en disco del diseño de una técnica de cotización
// ============================================
exports.getImagenDiseno = async (req, res) => {
    try {
        // Solo el nombre del archivo: nada de rutas (evita salirse de la carpeta con ../ o %2f)
        const filename = path.basename(String(req.params.filename || ''));
        const uploadsDir = path.resolve(__dirname, '..', 'uploads', 'disenos');
        const filePath = path.resolve(uploadsDir, filename);

        if (!/^[\w.-]+$/.test(filename) || !filePath.startsWith(uploadsDir + path.sep) || !fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Imagen no encontrada', filename });
        }

        return res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener imagen', error: error.message });
    }
};

// ============================================
// CREAR COTIZACIÓN COMPLETA (Dashboard)
// ============================================
exports.createCotizacionCompleta = async (req, res) => {
    try {                                                                               // 1
        const { DocumentoID, FechaCotizacion, ValorTotal, detalles } = req.body;        // 2
        if (!DocumentoID) return res.status(400).json({ message: 'DocumentoID es obligatorio' }); // 3
        if (!detalles || detalles.length === 0) return res.status(400).json({ message: 'Debe incluir al menos un producto' }); // 4
        const usuario = await Usuario.findByPk(DocumentoID);                            // 5
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado', DocumentoID }); // 6
        for (const [i, d] of detalles.entries()) {
            if (!(parseInt(d.Cantidad) > 0)) return res.status(400).json({ message: `Producto ${i + 1}: la cantidad debe ser mayor a 0` });
            if (!d.ProductoID && !d.TraePrenda && !(parseFloat(d.PrecioUnitario) > 0))
                return res.status(400).json({ message: `Producto ${i + 1}: un producto personalizado necesita precio unitario` });
            if (d.ProductoID && !(await Producto.findByPk(d.ProductoID)))
                return res.status(400).json({ message: `Producto ${i + 1}: el producto ${d.ProductoID} no existe` });
        }
        const nuevaCotizacion = await Cotizacion.create({                               // 7
            DocumentoID, FechaCotizacion: FechaCotizacion || new Date(),                // 8
            ValorTotal: ValorTotal || 0, EstadoID: ESTADO_COTIZACION.PENDIENTE                                    // 9
        });                                                                             // 10
        for (const detalle of detalles) {                                               // 11
            const nuevoDetalle = await DetalleCotizacion.create({                       // 12
                CotizacionID: nuevaCotizacion.CotizacionID, ProductoID: detalle.ProductoID || null, // 13
                Cantidad: detalle.Cantidad, TraePrenda: Boolean(detalle.TraePrenda),    // 14
                PrendaDescripcion: detalle.PrendaDescripcion || null,                   // 15
                // Producto personalizado (sin catálogo): guarda su precio para que el total no se pierda al recalcular
                PrecioUnitario: !detalle.ProductoID && parseFloat(detalle.PrecioUnitario) > 0 ? parseFloat(detalle.PrecioUnitario) : null
            });                                                                         // 16
            if (detalle.tallas?.length > 0) await CotizacionTalla.bulkCreate(detalle.tallas.map(t =>
            ({
                DetalleCotizacionID: nuevoDetalle.DetalleCotizacionID, TallaID: t.TallaID,
                Cantidad: t.Cantidad || detalle.Cantidad, PrecioTalla: t.PrecioTalla || 0
            }))); // 17
            if (detalle.colores?.length > 0) await CotizacionColor.bulkCreate(detalle.colores.map(c => ({
                DetalleCotizacionID: nuevoDetalle.DetalleCotizacionID,
                ColorID: c.ColorID, Cantidad: c.Cantidad || detalle.Cantidad
            }))); // 18
            if (detalle.insumos?.length > 0) await CotizacionInsumo.bulkCreate(detalle.insumos.map(i => ({
                DetalleCotizacionID: nuevoDetalle.DetalleCotizacionID,
                InsumoID: i.InsumoID, CantidadRequerida: i.CantidadRequerida || detalle.Cantidad
            }))); // 19
            if (detalle.tecnicas?.length > 0) await CotizacionTecnica.bulkCreate(detalle.tecnicas.map(t => ({
                DetalleCotizacionID: nuevoDetalle.DetalleCotizacionID, TecnicaID: t.TecnicaID,
                ParteID: t.ParteID, ImagenDiseño: t.ImagenDiseño || null,
                Observaciones: t.Observaciones || null, CostoTecnica: t.CostoTecnica || 0
            }))); // 20
        }                                                                               // 21
        // El total se calcula en el servidor con la misma regla que al asignar costos
        await calcularValorTotalCotizacion(nuevaCotizacion.CotizacionID);
        const cotizacionCompleta = await Cotizacion.findByPk(nuevaCotizacion.CotizacionID, { // 22
            include: [                                                                  // 23
                { model: Usuario, as: 'usuario' }, { model: Estado, as: 'estado' },     // 24
                {
                    model: DetalleCotizacion, as: 'detalles', include: [{ model: Producto, as: 'producto' },
                    {
                        model: CotizacionTecnica, as: 'tecnicas', include: [{ model: Tecnica, as: 'tecnica' },
                        { model: Parte, as: 'parte' }]
                    }, {
                        model: CotizacionTalla, as: 'tallas',
                        include: [{ model: Talla, as: 'talla' }]
                    }, {
                        model:
                            CotizacionColor, as: 'colores', include: [{ model: Color, as: 'color' }]
                    },
                    { model: CotizacionInsumo, as: 'insumos', include: [{ model: Insumo, as: 'insumo' }] }]
                } // 25
            ]                                                                           // 26
        });                                                                             // 27
        return res.status(201).json({ message: 'Cotización creada exitosamente', cotizacion: cotizacionCompleta }); // 28
    } catch (error) {                                                                   // 29
        res.status(500).json({ message: 'Error al crear cotización', error: error.message }); // 30
    }                                                                                   // 31
};


// ============================================
// CRUD ESTÁNDAR
// ============================================
exports.getAllCotizaciones = async (req, res) => {
    try {                                                                               // 1
        const page = Math.max(1, parseInt(req.query.page) || 1);                        // 2
        const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit) || 10));                     // 3
        const search = (req.query.search || "").trim();                                 // 4
        const estado = (req.query.estado || "Todos").trim();                            // 5
        const offset = (page - 1) * limit;                                              // 6
        const whereCotizacion = {};                                                     // 7
        if (search) {                                                                   // 8
            if (!isNaN(search)) {                                                       // 9
                whereCotizacion[Op.or] = [                                              // 10
                    { CotizacionID: parseInt(search) },                                 // 11
                    { '$usuario.Nombre$': { [Op.like]: `%${search}%` } },               // 12
                    { '$usuario.DocumentoID$': { [Op.like]: `%${search}%` } }           // 13
                ];                                                                      // 14
            } else {                                                                    // 15
                whereCotizacion[Op.or] = [                                              // 16
                    { '$usuario.Nombre$': { [Op.like]: `%${search}%` } },               // 17
                    { '$usuario.DocumentoID$': { [Op.like]: `%${search}%` } }           // 18
                ];                                                                      // 19
            }                                                                           // 20
        }                                                                               // 21
        const whereEstado = {};                                                         // 22
        if (estado !== "Todos") { whereEstado.Nombre = estado; }                        // 23
        const totalCount = await Cotizacion.count({                                     // 24
            where: whereCotizacion,                                                     // 25
            include: [                                                                  // 26
                { model: Usuario, as: 'usuario', attributes: [], required: !!search },  // 27
                {
                    model: Estado, as: 'estado', attributes: [], where: Object.keys
                        (whereEstado).length ? whereEstado : undefined, required: estado !== "Todos"
                } // 28
            ], subQuery: false                                                          // 29
        });                                                                             // 30
        const rows = await Cotizacion.findAll({                                         // 31
            where: whereCotizacion,                                                     // 32
            include: [                                                                  // 33
                { model: Usuario, as: 'usuario', required: !!search },                  // 34
                { model: Estado, as: 'estado', where: Object.keys(whereEstado).length ? whereEstado : undefined, required: estado !== "Todos" }, // 35
                {
                    model: DetalleCotizacion, as: 'detalles', include: [                  // 36
                        { model: Producto, as: 'producto' },                                // 37
                        { model: CotizacionTecnica, as: 'tecnicas', include: [{ model: Tecnica, as: 'tecnica' }, { model: Parte, as: 'parte' }] }, // 38
                        { model: CotizacionTalla, as: 'tallas', include: [{ model: Talla, as: 'talla' }] }, // 39
                        { model: CotizacionColor, as: 'colores', include: [{ model: Color, as: 'color' }] },// 40
                        { model: CotizacionInsumo, as: 'insumos', include: [{ model: Insumo, as: 'insumo' }] } // 41
                    ]
                }                                                                      // 42
            ], order: [['CotizacionID', 'DESC']], limit, offset                         // 43
        });                                                                             // 44
        res.json({ datos: rows, total: totalCount, pagina: page, totalPaginas: Math.ceil(totalCount / limit), limit }); // 45
    } catch (error) {                                                                   // 46
        console.error('Error en getAllCotizaciones:', error);                           // 47
        res.status(500).json({ message: 'Error al obtener cotizaciones', error: error.message }); // 48
    }                                                                                   // 49
};



exports.getCotizacionById = async (req, res) => {
    try {                                                                                                                                            // 1
        const cotizacion = await Cotizacion.findByPk(req.params.id, {                                                                               // 2
            include: [                                                                                                                              // 3
                { model: Usuario, as: 'usuario' }, { model: Estado, as: 'estado' },                                                                 // 4
                {                                                                                                                                   // 5
                    model: DetalleCotizacion, as: 'detalles', include: [                                                                            // 6
                        { model: Producto, as: 'producto' },                                                                                        // 7
                        { model: CotizacionTecnica, as: 'tecnicas', include: [{ model: Tecnica, as: 'tecnica' }, { model: Parte, as: 'parte' }] },   // 8
                        { model: CotizacionTalla, as: 'tallas', include: [{ model: Talla, as: 'talla' }] },                                         // 9
                        { model: CotizacionColor, as: 'colores', include: [{ model: Color, as: 'color' }] },                                        // 10
                        { model: CotizacionInsumo, as: 'insumos', include: [{ model: Insumo, as: 'insumo' }] }                                      // 11
                    ]                                                                                                                               // 12
                }                                                                                                                                   // 13
            ]                                                                                                                                       // 14
        });                                                                                                                                         // 15
        if (!cotizacion) return res.status(404).json({ message: 'Cotización no encontrada' });                                                      // 16
        const cotizacionEnriquecida = {                                                                                                             // 17
            ...cotizacion.toJSON(),                                                                                                                 // 18
            detalles: cotizacion.detalles.map(det => ({                                                                                             // 19
                ...det.toJSON(),                                                                                                                    // 20
                nombreProductoDisplay: obtenerNombreProducto(det),                                                                                  // 21
                tecnicas: det.tecnicas?.map(tec => ({                                                                                               // 22
                    ...tec.toJSON(),                                                                                                                // 23
                    ImagenUrl: tec.ImagenDiseño                                                                                                     // 24
                        ? `${process.env.API_URL || 'http://localhost:3000'}/api/cotizaciones/imagen/${tec.ImagenDiseño}`                           // 25
                        : null                                                                                                                      // 26
                })) || []                                                                                                                           // 27
            }))                                                                                                                                     // 28
        };                                                                                                                                          // 29
        res.json(cotizacionEnriquecida);                                                                                                            // 30
    } catch (error) {                                                                                                                               // 31
        res.status(500).json({ message: 'Error al obtener cotización', error: error.message });                                                     // 32
    }                                                                                                                                               // 33
};                                                                                                                                                  // 34


exports.updateCotizacion = async (req, res) => {
    try {                                                                               // 1
        const { ValorTotal, EstadoID } = req.body;                                      // 2
        const cotizacionID = req.params.id;                                             // 3
        const cotizacion = await Cotizacion.findByPk(cotizacionID, {                    // 4
            include: [{                                                                 // 5
                model: DetalleCotizacion, as: 'detalles',                               // 6
                include: [{ model: Producto, as: 'producto' }, {
                    model:
                        CotizacionTalla, as: 'tallas', include: [{
                            model:
                                Talla, as: 'talla'
                        }]
                }, {
                    model: CotizacionColor,
                    as: 'colores', include: [{ model: Color, as: 'color' }]
                }] // 7
            }]                                                                          // 8
        });                                                                             // 9
        if (!cotizacion) return res.status(404).json({ message: 'Cotización no encontrada' }); // 10
        const estadoAnterior = cotizacion.EstadoID;                                     // 11
        const estadoNuevo = EstadoID ? parseInt(EstadoID) : estadoAnterior;             // 12
        if (!Object.values(ESTADO_COTIZACION).includes(estadoNuevo)) {
            return res.status(400).json({ message: 'Estado de cotización no válido' });
        }
        // El valor de una cotización aprobada o cerrada está congelado: solo se puede fijar a mano antes de aprobarla
        if (ValorTotal !== undefined && ![ESTADO_COTIZACION.PENDIENTE, ESTADO_COTIZACION.EN_REVISION].includes(estadoAnterior)
            && Number(ValorTotal) !== Number(cotizacion.ValorTotal)) {
            return res.status(400).json({ message: 'La cotización ya fue aprobada o cerrada: su valor no se puede modificar' });
        }
        if (ValorTotal !== undefined && !(Number(ValorTotal) >= 0)) {
            return res.status(400).json({ message: 'El valor total no es válido' });
        }
        if (estadoNuevo !== estadoAnterior) {
            if ([ESTADO_COTIZACION.CANCELADA, ESTADO_COTIZACION.PROCESADA].includes(estadoAnterior)) {
                return res.status(400).json({ message: `No se puede cambiar el estado de una cotización ${estadoAnterior === ESTADO_COTIZACION.PROCESADA ? 'procesada' : 'cancelada'}` });
            }
            if (estadoNuevo === ESTADO_COTIZACION.PROCESADA) {
                return res.status(400).json({ message: 'Para procesar la cotización usa "Convertir a venta"' });
            }
            if (estadoNuevo === ESTADO_COTIZACION.APROBADA) {
                const sinCosto = await CotizacionTecnica.count({
                    include: [{ model: DetalleCotizacion, as: 'detalleCotizacion', where: { CotizacionID: cotizacionID }, attributes: [] }],
                    where: { [Op.or]: [{ CostoTecnica: null }, { CostoTecnica: { [Op.lte]: 0 } }] }
                });
                if (sinCosto > 0) {
                    return res.status(400).json({ message: `No se puede aprobar: hay ${sinCosto} diseño(s) sin costo asignado` });
                }
            }
        }
        // El stock se descuenta solo al convertir a venta; cancelar no devuelve stock.
        // Bajo bloqueo: si el cliente responde (acepta, rechaza o cancela) mientras el administrador edita, no se pisan
        const tx = await sequelize.transaction();
        try {
            const fresca = await Cotizacion.findByPk(cotizacion.CotizacionID, { transaction: tx, lock: tx.LOCK.UPDATE });
            if (fresca.EstadoID !== estadoAnterior) {
                await tx.rollback();
                return res.status(409).json({ message: 'La cotización cambió mientras la editabas (por ejemplo, el cliente respondió). Recárgala e inténtalo de nuevo.' });
            }
            await cotizacion.update({
                ValorTotal: ValorTotal !== undefined ? ValorTotal : cotizacion.ValorTotal,
                EstadoID: estadoNuevo
            }, { transaction: tx });
            await tx.commit();
        } catch (e) { await tx.rollback().catch(() => {}); throw e; }
        // Al aprobar, el valor que ve el cliente se calcula con los precios ya asignados (si el panel no lo mandó)
        if (estadoNuevo === ESTADO_COTIZACION.APROBADA && estadoAnterior !== estadoNuevo && ValorTotal === undefined) {
            const calculado = await calcularValorTotalCotizacion(cotizacion.CotizacionID, { forzar: true });
            if (calculado > 0) await cotizacion.update({ ValorTotal: calculado });
        }
        // Aviso al cliente cuando cambia el estado (aprobada, rechazada, cancelada...)
        if (estadoNuevo !== estadoAnterior) {
            await historial.registrar({ tipo: 'cotizacion', refId: cotizacion.CotizacionID, estadoId: estadoNuevo, documentoId: req.usuario?.id });
            notificaciones.cotizacionEstado(cotizacion.CotizacionID);
        }
        res.json({ message: 'Cotización actualizada exitosamente', cotizacion });       // 31
    } catch (error) {                                                                   // 32
        res.status(500).json({ message: 'Error al actualizar cotización', error: error.message }); // 33
    }                                                                                   // 34
};


exports.deleteCotizacion = async (req, res) => {
    try {
        const cotizacion = await Cotizacion.findByPk(req.params.id);
        if (!cotizacion) return res.status(404).json({ message: 'Cotización no encontrada' });
        await cotizacion.destroy();
        res.json({ message: 'Cotización eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar cotización', error: error.message });
    }
};

exports.getCotizacionesByUsuario = async (req, res) => {
    try {
        const { documentoID } = req.params;
        const cotizaciones = await Cotizacion.findAll({
            where: { DocumentoID: documentoID },
            include: [
                { model: Usuario, as: 'usuario' },
                { model: Estado, as: 'estado' },
                {
                    model: DetalleCotizacion, as: 'detalles',
                    include: [
                        { model: Producto, as: 'producto' },
                        { model: CotizacionTecnica, as: 'tecnicas', include: [{ model: Tecnica, as: 'tecnica' }, { model: Parte, as: 'parte' }] },
                        { model: CotizacionTalla, as: 'tallas', include: [{ model: Talla, as: 'talla' }] },
                        { model: CotizacionColor, as: 'colores', include: [{ model: Color, as: 'color' }] },
                        { model: CotizacionInsumo, as: 'insumos', include: [{ model: Insumo, as: 'insumo' }] }
                    ]
                }
            ],
            order: [['CotizacionID', 'DESC']]
        });
        res.json(cotizaciones);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener cotizaciones del usuario', error: error.message });
    }
};

exports.cancelarCotizacion = async (req, res) => {
    try {                                                                               // 1
        const { cotizacionID } = req.params;                                            // 2
        const cotizacion = await Cotizacion.findByPk(cotizacionID, {                    // 3
            include: [                                                                  // 4
                {
                    model: DetalleCotizacion, as: 'detalles', include: [{
                        model:
                            Producto, as: 'producto'
                    }, { model: CotizacionTalla, as: 'tallas' }, {
                        model:
                            CotizacionColor, as: 'colores'
                    }]
                }, // 5
                { model: Usuario, as: 'usuario' }, { model: Estado, as: 'estado' }      // 6
            ]                                                                           // 7
        });                                                                             // 8
        if (!cotizacion) return res.status(404).json({ message: 'Cotización no encontrada', cotizacionID }); // 9
        if (cotizacion.EstadoID === ESTADO_COTIZACION.PROCESADA) return res.status(400).json({
            message: 'No se puede cancelar una cotización ya convertida a venta'
        }); // 10
        if (cotizacion.EstadoID === ESTADO_COTIZACION.CANCELADA) return res.status(400).json({ message: 'La cotización ya está cancelada' });
        // El stock se descuenta solo al convertir a venta; cancelar no devuelve stock.
        const stockDevuelto = false;
        const porCliente = !esAdmin(req);
        // Bajo bloqueo: si el cliente la acepta a la vez, no puede quedar "cancelada" con un pedido ya creado
        const t = await sequelize.transaction();
        try {
            const fresca = await Cotizacion.findByPk(cotizacion.CotizacionID, { transaction: t, lock: t.LOCK.UPDATE });
            if ([ESTADO_COTIZACION.PROCESADA, ESTADO_COTIZACION.CANCELADA].includes(fresca.EstadoID)) {
                await t.rollback();
                return res.status(400).json({ message: fresca.EstadoID === ESTADO_COTIZACION.PROCESADA ? 'No se puede cancelar una cotización ya convertida a venta' : 'La cotización ya está cancelada' });
            }
            await fresca.update({ EstadoID: ESTADO_COTIZACION.CANCELADA }, { transaction: t });
            await historial.registrar({ tipo: 'cotizacion', refId: cotizacion.CotizacionID, estadoId: ESTADO_COTIZACION.CANCELADA, nota: porCliente ? 'Cancelada por el cliente' : null, documentoId: req.usuario?.id }, t);
            await t.commit();
        } catch (e) { await t.rollback().catch(() => {}); throw e; }
        notificaciones.cotizacionEstado(cotizacion.CotizacionID);
        if (porCliente) notificaciones.cotizacionRespuesta(cotizacion.CotizacionID, 'cancelada');                                       // 24
        return res.status(200).json({                                                   // 25
            message: 'Cotización cancelada exitosamente',                               // 26
            cotizacionID: cotizacion.CotizacionID, estadoNuevo: 'Cancelada', stockDevuelto // 27
        });                                                                             // 28
    } catch (error) {                                                                   // 29
        res.status(500).json({ message: 'Error al cancelar cotización', error: error.message }); // 30
    }                                                                                   // 31
};


const calcularValorTotalCotizacion = async (cotizacionID, { forzar = false } = {}) => {
    try {
        const cotizacion = await Cotizacion.findByPk(cotizacionID, {
            include: [{
                model: DetalleCotizacion, as: 'detalles',
                include: [{ model: Producto, as: 'producto' }, { model: CotizacionTecnica, as: 'tecnicas' }, { model: CotizacionTalla, as: 'tallas', include: [{ model: Talla, as: 'talla' }] }, { model: CotizacionInsumo, as: 'insumos', include: [{ model: Insumo, as: 'insumo' }] }]
            }]
        });
        if (!cotizacion) return 0;
        // Una cotización ya aprobada o cerrada tiene el precio congelado: solo se recalcula al aprobarla (forzar)
        if (!forzar && ![ESTADO_COTIZACION.PENDIENTE, ESTADO_COTIZACION.EN_REVISION].includes(cotizacion.EstadoID)) return parseFloat(cotizacion.ValorTotal) || 0;
        const total = cotizacion.detalles.reduce((s, detalle) => s + subtotalDetalle(detalle), 0);
        await cotizacion.update({ ValorTotal: total });
        return total;
    } catch (error) {
        console.error('Error recalculando valor total:', error);
        return 0;
    }
};

exports.calcularValorTotalCotizacion = calcularValorTotalCotizacion;

// ============================================
// EL CLIENTE RESPONDE A UNA COTIZACIÓN APROBADA
// (el permiso de "dueño" se valida en la ruta)
// ============================================
exports.aceptarCotizacion = async (req, res) => {
    const id = req.params.cotizacionID;
    const original = res.json.bind(res);
    res.json = (cuerpo) => {
        if (res.statusCode === 201 && cuerpo?.venta) notificaciones.cotizacionRespuesta(id, 'aceptada', cuerpo.venta.VentaID);
        return original(cuerpo);
    };
    return exports.convertirCotizacionAVenta(req, res);
};

exports.rechazarCotizacion = async (req, res) => {
    try {
        const motivo = typeof req.body.motivo === 'string' ? req.body.motivo.trim().slice(0, 250) : '';
        // Bajo bloqueo: aceptar y rechazar a la vez no pueden dejar un pedido creado con la cotización "rechazada"
        const t = await sequelize.transaction();
        let cot;
        try {
            cot = await Cotizacion.findByPk(req.params.cotizacionID, { transaction: t, lock: t.LOCK.UPDATE });
            if (!cot) { await t.rollback(); return res.status(404).json({ message: 'Cotización no encontrada' }); }
            if (cot.EstadoID !== ESTADO_COTIZACION.APROBADA) { await t.rollback(); return res.status(400).json({ message: 'Solo puedes responder cotizaciones que ya tienen precio' }); }
            await cot.update({ EstadoID: ESTADO_COTIZACION.RECHAZADA }, { transaction: t });
            await historial.registrar({ tipo: 'cotizacion', refId: cot.CotizacionID, estadoId: ESTADO_COTIZACION.RECHAZADA, nota: motivo ? 'Rechazada por el cliente: ' + motivo : 'Rechazada por el cliente', documentoId: req.usuario?.id }, t);
            await t.commit();
        } catch (e) { await t.rollback().catch(() => {}); throw e; }
        notificaciones.cotizacionRespuesta(cot.CotizacionID, 'rechazada', motivo || null);
        return res.json({ message: 'Listo, avisamos al equipo. Gracias por tu respuesta.' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al rechazar la cotización', error: error.message });
    }
};

exports.historialCotizacion = async (req, res) => {
    try { return res.json(await historial.listar('cotizacion', req.params.id)); }
    catch (error) { return res.status(500).json({ message: 'Error al consultar el historial', error: error.message }); }
};

// ============================================
// APLICAR TARIFAS: rellena el costo de los diseños que no lo tienen con la tarifa de su técnica + parte
// ============================================
exports.aplicarTarifas = async (req, res) => {
    try {
        const cotizacionID = req.params.cotizacionID;
        const cot = await Cotizacion.findByPk(cotizacionID);
        if (!cot) return res.status(404).json({ message: 'Cotización no encontrada' });
        if (![ESTADO_COTIZACION.PENDIENTE, ESTADO_COTIZACION.EN_REVISION].includes(cot.EstadoID)) return res.status(400).json({ message: 'Esta cotización ya no se puede modificar' });
        const tarifas = await require('../models').TarifaTecnica.findAll({ raw: true });
        const mapa = new Map(tarifas.map((t) => [t.TecnicaID + '-' + t.ParteID, Number(t.Costo)]));
        const tecnicas = await CotizacionTecnica.findAll({
            include: [{ model: DetalleCotizacion, as: 'detalleCotizacion', where: { CotizacionID: cotizacionID }, attributes: [] }],
            where: { [Op.or]: [{ CostoTecnica: null }, { CostoTecnica: { [Op.lte]: 0 } }] },
        });
        let aplicadas = 0; let sinTarifa = 0;
        for (const t of tecnicas) {
            const costo = mapa.get(t.TecnicaID + '-' + t.ParteID);
            if (costo > 0) { await t.update({ CostoTecnica: costo }); aplicadas++; } else sinTarifa++;
        }
        if (aplicadas > 0) {
            const calculado = await calcularValorTotalCotizacion(cotizacionID);
            if (calculado > 0) await cot.update({ ValorTotal: calculado });
        }
        return res.json({ message: aplicadas ? `Se aplicaron ${aplicadas} tarifa(s)${sinTarifa ? `; ${sinTarifa} diseño(s) siguen sin tarifa` : ''}` : 'No había diseños sin costo con tarifa disponible', aplicadas, sinTarifa });
    } catch (error) {
        return res.status(500).json({ message: 'Error al aplicar las tarifas', error: error.message });
    }
};
module.exports.crearVentaDirecta = crearVentaDirecta;
module.exports.crearCotizacionConDiseños = crearCotizacionConDiseños;