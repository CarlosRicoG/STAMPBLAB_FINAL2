const {
    Venta,
    Usuario,
    DetalleVenta,
    DetalleCompra,
    Compra,
    Producto,
    Tecnica,
    Insumo,
    InventarioProducto,
    Color,
    Talla,
    Estado,
    sequelize
} = require('../models');

const notificaciones = require('../services/notificaciones');
const { ESTADO_VENTA, TRANSICIONES_VENTA } = require('../config/estados');
const inventario = require('../services/inventario');
const log = require('../utils/log');
const { Op } = require('sequelize');

// Obtener todas las ventas

// Errores de negocio (stock, datos) -> respuesta 4xx; el resto -> 500
const responderError = (res, error, mensaje) => {
    if (error && error.esErrorNegocio) {
        return res.status(error.status || 400).json({ error: error.message, message: error.message, mensaje: error.message });
    }
    console.error(mensaje + ':', error);
    return res.status(500).json({ message: mensaje, error: error.message });
};

exports.getAllVentas = async (req, res) => {
    try {
        const page   = Math.max(1, parseInt(req.query.page)  || 1);
        const limit  = Math.max(1, parseInt(req.query.limit) || 10);
        const search = (req.query.search || "").trim();
        const estado = req.query.estado;
        const offset = (page - 1) * limit;

        // ── Filtro por estado ──
        const whereVenta = {};
        const documentoFiltro = req.documentoForzado || req.query.documentoID;
        if (documentoFiltro) whereVenta.DocumentoID = documentoFiltro; // ventas de un cliente
        if (estado === "pendientes") {
            whereVenta.EstadoID = ESTADO_VENTA.PENDIENTE;
        } else if (estado === "procesadas") {
            whereVenta.EstadoID = { [Op.ne]: ESTADO_VENTA.PENDIENTE };
        }

        // ── Filtro de búsqueda ──
        if (search) {
            if (!isNaN(search)) {
                whereVenta[Op.or] = [
                    { VentaID: parseInt(search) },
                    { '$usuario.Nombre$':      { [Op.like]: `%${search}%` } },
                    { '$usuario.DocumentoID$': { [Op.like]: `%${search}%` } }
                ];
            } else {
                whereVenta[Op.or] = [
                    { '$usuario.Nombre$':      { [Op.like]: `%${search}%` } },
                    { '$usuario.DocumentoID$': { [Op.like]: `%${search}%` } }
                ];
            }
        }

        // ── 1. COUNT: subQuery:false necesario para que $usuario.X$ funcione en WHERE ──
        const totalCount = await Venta.count({
            where: whereVenta,
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: [],
                    required: !!search
                }
            ],
            subQuery: false
        });

        // ── 2. QUERY de datos ──
        // SIN subQuery:false → Sequelize envuelve la query en una subconsulta
        // para aplicar LIMIT/OFFSET correctamente sobre VentaIDs únicos,
        // no sobre las filas del JOIN con DetalleVenta.
        const rows = await Venta.findAll({
            where: whereVenta,
            // El comprobante (imagen base64) puede pesar MB: en el listado solo se indica si existe;
            // la imagen completa se obtiene con GET /api/ventas/:id
            attributes: {
                exclude: ['ComprobanteTransferencia'],
                include: [[sequelize.literal('(`Venta`.`ComprobanteTransferencia` IS NOT NULL)'), 'TieneComprobante']]
            },
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: { exclude: ['Contraseña'] },
                    required: !!search
                },
                {
                    model: DetalleVenta,
                    as: 'detalles',
                    include: [
                        { model: Producto, as: 'producto' },
                        { model: Color,    as: 'color'    },
                        { model: Talla,    as: 'talla'    }
                    ]
                },
                { model: Estado, as: 'estado' }
            ],
            order:    [['VentaID', 'DESC']],
            limit,
            offset,
});

        res.json({
            datos:        rows,
            total:        totalCount,
            pagina:       page,
            totalPaginas: Math.ceil(totalCount / limit),
            limit
        });

    } catch (error) {
        res.status(500).json({ message: 'Error al obtener ventas', error: error.message });
    }
};


// Obtener una venta por ID
exports.getVentaById = async (req, res) => {
    try {
        const venta = await Venta.findByPk(req.params.id, {
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: { exclude: ['Contraseña'] }
                },
                {
                    model: DetalleVenta,
                    as: 'detalles',
                    include: [
                        { model: Producto, as: 'producto' },
                        { model: Color, as: 'color' },
                        { model: Talla, as: 'talla' }
                    ]
                },
                {
                    model: Estado,
                    as: 'estado'
                }
            ]
        });

        if (!venta) {
            return res.status(404).json({ message: 'Venta no encontrada' });
        }

        res.json(venta);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener venta',
            error: error.message
        });
    }
};

// CREAR VENTA CON DESCUENTO DE STOCK (transacción: o se hace todo o nada; sin sobreventa por compras simultáneas)
exports.crearVenta = async (req, res) => {
    const {
        DocumentoID, Subtotal, Total, EstadoID, detalles,
        // CAMPOS OPCIONALES DE MÉTODO DE PAGO
        metodoPago, comprobanteTransferencia, fechaTransferencia,
        nombreReceptor, telefonoEntrega, direccionEntrega
    } = req.body;

    // Validaciones básicas
    if (!DocumentoID || !detalles || detalles.length === 0) {
        return res.status(400).json({ error: "Faltan datos obligatorios", message: "Faltan datos obligatorios" });
    }
    if (metodoPago === 'transferencia' && !comprobanteTransferencia) {
        return res.status(400).json({ error: "Debe proporcionar el comprobante de transferencia", message: "Debe proporcionar el comprobante de transferencia" });
    }
    if (metodoPago === 'contraentrega' && (!nombreReceptor || !telefonoEntrega || !direccionEntrega)) {
        return res.status(400).json({
            error: "Complete todos los datos de entrega (nombre, teléfono y dirección)",
            message: "Complete todos los datos de entrega (nombre, teléfono y dirección)"
        });
    }

    const cliente = await Usuario.findByPk(DocumentoID, { attributes: ['DocumentoID', 'RolID'] });
    if (!cliente) {
        return res.status(400).json({ error: "El cliente de la venta no existe", message: "El cliente de la venta no existe" });
    }
    if (Number(cliente.RolID) === 1) {
        return res.status(400).json({ error: "No se puede asignar un pedido al administrador; elige un cliente", message: "No se puede asignar un pedido al administrador; elige un cliente" });
    }

    const t = await sequelize.transaction();
    try {
        // Bloquea las variantes, valida y descuenta el stock (asigna InventarioID a cada línea)
        await inventario.reservar(detalles, t);

        const nuevaVenta = await Venta.create({
            DocumentoID,
            Subtotal,
            Total,
            EstadoID: EstadoID || ESTADO_VENTA.PENDIENTE, // Pendiente por defecto
            MetodoPago: metodoPago || null,
            ComprobanteTransferencia: metodoPago === 'transferencia' ? comprobanteTransferencia : null,
            FechaTransferencia: metodoPago === 'transferencia' ? (fechaTransferencia || new Date()) : null,
            NombreReceptor: metodoPago === 'contraentrega' ? nombreReceptor : null,
            TelefonoEntrega: metodoPago === 'contraentrega' ? telefonoEntrega : null,
            DireccionEntrega: metodoPago === 'contraentrega' ? direccionEntrega : null
        }, { transaction: t });

        for (const item of detalles) {
            await DetalleVenta.create({
                VentaID: nuevaVenta.VentaID,
                ProductoID: item.ProductoID,
                Cantidad: item.Cantidad,
                PrecioUnitario: item.PrecioUnitario,
                ColorID: item.ColorID,
                TallaID: item.TallaID,
                InventarioID: item.InventarioID || null
            }, { transaction: t });
        }

        await t.commit();
        notificaciones.pedidoRecibido(nuevaVenta.VentaID); // correo al cliente (sin esperar; un fallo no afecta la venta)
        return res.status(201).json({ message: "Venta creada correctamente", venta: nuevaVenta });
    } catch (error) {
        await t.rollback();
        return responderError(res, error, 'Error al crear venta');
    }
};


// 🆕 ACTUALIZAR ESTADO DE VENTA (devuelve el stock si se cancela una venta pendiente; seguro ante clics repetidos)
exports.updateEstadoVenta = async (req, res) => {
    const { EstadoID } = req.body;
    const ventaId = req.params.id;
    if (!EstadoID) return res.status(400).json({ message: 'EstadoID es requerido' });

    const estadoNuevo = parseInt(EstadoID);
    if (!Number.isInteger(estadoNuevo)) return res.status(400).json({ message: 'Estado de venta no válido' });
    const estadoDestino = await Estado.findByPk(estadoNuevo);
    if (!estadoDestino || estadoDestino.Tipo !== 'venta') {
        return res.status(400).json({ message: 'Estado de venta no válido' });
    }

    const t = await sequelize.transaction();
    try {
        // Se bloquea la fila de la venta: peticiones simultáneas sobre la misma venta se ejecutan de a una
        const venta = await Venta.findByPk(ventaId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!venta) { await t.rollback(); return res.status(404).json({ message: 'Venta no encontrada' }); }

        const estadoAnterior = venta.EstadoID;
        if (estadoAnterior === estadoNuevo) {
            await t.rollback();
            return res.json({ message: 'La venta ya se encuentra en ese estado', venta, stockDevuelto: false });
        }
        // Una venta cancelada ya liberó su stock: reactivarla dejaría el inventario descuadrado
        if (estadoAnterior === ESTADO_VENTA.CANCELADA) {
            await t.rollback();
            return res.status(400).json({ message: 'La venta está cancelada y no puede cambiar de estado' });
        }
        // Solo se avanza por el camino normal (Pendiente → Pagada → En Producción → Lista → Entregada) o se cancela
        if (!(TRANSICIONES_VENTA[estadoAnterior] || []).includes(estadoNuevo)) {
            await t.rollback();
            const estadoActual = await Estado.findByPk(estadoAnterior);
            const message = estadoAnterior === ESTADO_VENTA.ENTREGADA
                ? 'El pedido ya fue entregado y no puede cambiar de estado.'
                : `No se puede pasar el pedido de "${estadoActual?.Nombre || estadoAnterior}" a "${estadoDestino.Nombre}". Sigue el orden: Pendiente, Pagada, En Producción, Lista para Entrega y Entregada.`;
            return res.status(400).json({ message, mensaje: message });
        }

        log(`Cambio de estado de venta #${ventaId}: ${estadoAnterior} -> ${estadoNuevo}`);

        const devuelveStock = estadoAnterior === ESTADO_VENTA.PENDIENTE && estadoNuevo === ESTADO_VENTA.CANCELADA;
        if (devuelveStock) {
            const detalles = await DetalleVenta.findAll({ where: { VentaID: ventaId }, transaction: t });
            await inventario.devolver(detalles, t);
        }

        await venta.update({ EstadoID: estadoNuevo }, { transaction: t });
        await t.commit();
        notificaciones.pedidoEstado(venta.VentaID); // correo al cliente con el nuevo estado
        return res.json({ message: 'Estado actualizado exitosamente', venta, stockDevuelto: devuelveStock });
    } catch (error) {
        await t.rollback();
        return responderError(res, error, 'Error al actualizar estado');
    }
};

// ACTUALIZAR VENTA COMPLETA (con detalles)
exports.updateVenta = async (req, res) => {
    const { EstadoID, Subtotal, Total, detalles } = req.body;
    const ventaId = req.params.id;

    // Si solo se actualiza el estado: misma lógica (y devolución de stock) que PATCH /:id/estado
    if (EstadoID && !detalles) return exports.updateEstadoVenta(req, res);

    const t = await sequelize.transaction();
    try {
        const venta = await Venta.findByPk(ventaId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!venta) { await t.rollback(); return res.status(404).json({ message: 'Venta no encontrada' }); }
        if (venta.EstadoID === ESTADO_VENTA.CANCELADA) {
            await t.rollback();
            return res.status(400).json({ message: 'No se puede editar una venta cancelada' });
        }
        // Productos y precios solo se editan mientras el pedido está pendiente; después es historial
        if (detalles && detalles.length > 0 && venta.EstadoID !== ESTADO_VENTA.PENDIENTE) {
            await t.rollback();
            const message = 'Solo se pueden editar los productos de un pedido mientras está pendiente.';
            return res.status(400).json({ message, mensaje: message });
        }
        // Con detalles el estado no se cambia por aquí (para eso está el cambio de estado, que valida el orden)
        if (EstadoID && Number(EstadoID) !== venta.EstadoID) {
            await t.rollback();
            const message = 'Para cambiar el estado usa la opción "Cambiar estado" del pedido.';
            return res.status(400).json({ message, mensaje: message });
        }

        if (detalles && detalles.length > 0) {
            // Devuelve lo de los detalles antiguos y descuenta lo nuevo, todo en la misma transacción:
            // si no alcanza el stock se deshace todo sin dejar nada a medias
            const antiguos = await DetalleVenta.findAll({ where: { VentaID: ventaId }, transaction: t });
            await inventario.devolver(antiguos, t);
            await inventario.reservar(detalles, t);

            await DetalleVenta.destroy({ where: { VentaID: ventaId }, transaction: t });
            for (const item of detalles) {
                await DetalleVenta.create({
                    VentaID: ventaId,
                    ProductoID: item.ProductoID,
                    Cantidad: item.Cantidad,
                    PrecioUnitario: item.PrecioUnitario,
                    ColorID: item.ColorID,
                    TallaID: item.TallaID,
                    InventarioID: item.InventarioID || null
                }, { transaction: t });
            }
            await venta.update({
                Subtotal: Subtotal || venta.Subtotal,
                Total: Total || venta.Total,
                EstadoID: EstadoID || venta.EstadoID
            }, { transaction: t });
        }

        await t.commit();
        return res.json({ message: 'Venta actualizada exitosamente', venta });
    } catch (error) {
        await t.rollback();
        return responderError(res, error, 'Error al actualizar venta');
    }
};

// Eliminar una venta (con devolución de stock si estaba pendiente)
exports.deleteVenta = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const venta = await Venta.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!venta) { await t.rollback(); return res.status(404).json({ message: 'Venta no encontrada' }); }

        // Un pedido pagado, en producción o entregado es historial contable: no se borra, se cancela
        if (venta.EstadoID !== ESTADO_VENTA.PENDIENTE && venta.EstadoID !== ESTADO_VENTA.CANCELADA) {
            await t.rollback();
            const message = 'No se puede eliminar un pedido ya pagado, en producción o entregado porque es historial. Si fue un error, cancélalo.';
            return res.status(400).json({ message, mensaje: message });
        }

        const devuelve = venta.EstadoID === ESTADO_VENTA.PENDIENTE;
        const detalles = await DetalleVenta.findAll({ where: { VentaID: venta.VentaID }, transaction: t });
        if (devuelve) await inventario.devolver(detalles, t);

        await DetalleVenta.destroy({ where: { VentaID: venta.VentaID }, transaction: t });
        await venta.destroy({ transaction: t });

        await t.commit();
        return res.json({ message: 'Venta eliminada exitosamente', stockDevuelto: devuelve });
    } catch (error) {
        await t.rollback();
        return responderError(res, error, 'Error al eliminar venta');
    }
};

// Dashboard (sin cambios)
exports.getDashboardData = async (req, res) => {
    try {
        const { mes, productoId } = req.query;
        // NOTA: el filtro tecnicaId se elimina porque DetalleVenta
        // no tiene asociación con Tecnica en tu modelo actual.

        // ── Construir WHERE para Venta (filtro de mes) ──
        let whereVenta = {};
        if (mes) {
            const mesNum = parseInt(mes);
            whereVenta = {
                [Op.and]: [
                    sequelize.where(sequelize.fn('MONTH', sequelize.col('venta.FechaVenta')), mesNum),
                    sequelize.where(sequelize.fn('YEAR', sequelize.col('venta.FechaVenta')), new Date().getFullYear())
                ]
            };
        }

        // ── Construir WHERE para DetalleVenta (filtro de producto) ──
        let whereDetalle = {};
        if (productoId) {
            whereDetalle.ProductoID = parseInt(productoId);
        }

        // ── 1. Ventas por mes (agrupado por mes) ──
        const ventasPorMes = await DetalleVenta.findAll({
            attributes: [
                [sequelize.fn('MONTH', sequelize.col('venta.FechaVenta')), 'mes'],
                [sequelize.fn('COUNT', sequelize.col('DetalleVentaID')), 'ventas']
            ],
            include: [
                {
                    model: Venta,
                    as: 'venta',
                    attributes: [],
                    where: whereVenta
                }
            ],
            where: whereDetalle,
            group: [sequelize.fn('MONTH', sequelize.col('venta.FechaVenta'))],
            order: [[sequelize.fn('MONTH', sequelize.col('venta.FechaVenta')), 'ASC']],
            raw: true
        });

        // ── 2. Productos más vendidos (por producto, top 10) ──
        const productosMasVendidos = await DetalleVenta.findAll({
            attributes: [
                'ProductoID',
                [sequelize.fn('SUM', sequelize.col('DetalleVenta.Cantidad')), 'cantidad']
            ],
            include: [
                {
                    model: Venta,
                    as: 'venta',
                    attributes: [],
                    where: whereVenta
                },
                {
                    model: Producto,
                    as: 'producto',
                    attributes: ['Nombre']
                }
            ],
            where: whereDetalle,
            group: ['DetalleVenta.ProductoID', 'producto.ProductoID', 'producto.Nombre'],
            order: [[sequelize.fn('SUM', sequelize.col('DetalleVenta.Cantidad')), 'DESC']],
            limit: 10,
            raw: true
        });

        // ── 3. Insumos más utilizados: viene de DetalleCompra (tipo 'insumo') ──
        // DetalleVenta no tiene relación con insumos directamente,
        // así que consultamos DetalleCompra agrupado por mes.
        const insumosUtilizados = await DetalleCompra.findAll({
            attributes: [
                [sequelize.fn('MONTH', sequelize.col('compra.FechaCompra')), 'mes'],
                [sequelize.fn('SUM', sequelize.col('DetalleCompra.Cantidad')), 'cantidad']
            ],
            include: [
                {
                    model: Compra,
                    as: 'compra',
                    attributes: [],
                    where: mes ? {
                        [Op.and]: [
                            sequelize.where(sequelize.fn('MONTH', sequelize.col('compra.FechaCompra')), parseInt(mes)),
                            sequelize.where(sequelize.fn('YEAR', sequelize.col('compra.FechaCompra')), new Date().getFullYear())
                        ]
                    } : {}
                }
            ],
            where: { TipoSeleccion: 'insumo' },
            group: [sequelize.fn('MONTH', sequelize.col('compra.FechaCompra'))],
            order: [[sequelize.fn('MONTH', sequelize.col('compra.FechaCompra')), 'ASC']],
            raw: true
        });

        // ── Formatear respuestas ──
        const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        const ventasFormateadas = ventasPorMes.map(item => ({
            mes: mesesNombres[item.mes - 1],
            ventas: parseInt(item.ventas) || 0
        }));

        const productosFormateados = productosMasVendidos.map(item => ({
            mes: item['producto.Nombre'] || `Producto ${item.ProductoID}`,
            cantidad: parseInt(item.cantidad) || 0
        }));

        const insumosFormateados = insumosUtilizados.map(item => ({
            mes: mesesNombres[item.mes - 1],
            cantidad: parseInt(item.cantidad) || 0
        }));

        res.json({
            estado: true,
            mensaje: 'Datos del dashboard obtenidos exitosamente',
            datos: {
                ventasPorTecnicas: ventasFormateadas,   // ahora son ventas por mes
                productosMasVendidos: productosFormateados,
                insumosUtilizados: insumosFormateados
            }
        });

    } catch (error) {
        console.error('Error al obtener datos del dashboard:', error);
        res.status(500).json({
            estado: false,
            mensaje: 'Error al obtener datos del dashboard',
            error: error.message
        });
    }
};