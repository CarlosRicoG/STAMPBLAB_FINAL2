/**
 * Derechos del titular de los datos (Ley 1581 de 2012, art. 8; Decreto 1377 de 2013).
 * Solo actúan sobre la cuenta de la sesión (req.usuario.id): nunca reciben un documento por parámetro.
 *
 *  - Acceso: GET /api/mi-cuenta/datos devuelve en JSON todo lo que se guarda de la persona (sin contraseña, sin la
 *    versión de sesión y sin la imagen del comprobante: solo si lo hay y su fecha), con la línea de tiempo de cada pedido
 *    y cotización. Si la persona se volvió a registrar con el documento de una cuenta suprimida, solo lo posterior
 *    (usuarios.HistorialDesde).
 *  - Supresión: POST /api/mi-cuenta/suprimir (con la contraseña actual). La fila del usuario NO se borra: la FK
 *    ventas.DocumentoID es ON DELETE CASCADE (se llevaría los pedidos) y cotizaciones.DocumentoID es NO ACTION (el borrado
 *    fallaría); además las cifras contables deben conservarse por obligación legal (Código de Comercio art. 60, Estatuto
 *    Tributario art. 632). Se anonimiza: nombre "Titular suprimido", correo suprimido-<documento>@invalid, sin teléfono
 *    ni dirección, contraseña aleatoria, SuprimidoEn = ahora. Se conserva el número de documento (soporte de las ventas).
 *    En pedidos y cotizaciones se borran los datos de contacto, el comprobante y su motivo de rechazo, las notas de la
 *    línea de tiempo, los textos libres y las imágenes de diseño (los archivos los borra services/limpiezaDisenos al
 *    quedar sin referencia). Los avisos del equipo sobre sus pedidos/cotizaciones se reescriben sin datos personales.
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Op, literal } = require('sequelize');
const db = require('../models');
const sesion = require('../services/sesion');
const { desdeWhere } = require('../services/historialCliente');
const { wherePagoPorVerificar } = require('../utils/pagoPorVerificar');
const { ESTADO_VENTA, ESTADO_COTIZACION } = require('../config/estados');

const ROL_ADMIN = 1;
const TITULAR_SUPRIMIDO = 'Titular suprimido';
// Una venta tiene comprobante si la columna no es NULL ni '' (misma regla que ventaController)
const TIENE_COMPROBANTE_SQL = "(`Venta`.`ComprobanteTransferencia` IS NOT NULL AND `Venta`.`ComprobanteTransferencia` <> '')";
const VENTA_FINAL = [ESTADO_VENTA.ENTREGADA, ESTADO_VENTA.CANCELADA];

const plano = (x) => (x && typeof x.toJSON === 'function' ? x.toJSON() : x);
const leerCarrito = (fila) => {
    if (!fila) return null;
    try { return JSON.parse(fila.Datos); } catch { return fila.Datos ?? null; }
};
// Filas de historial_estados de unas ventas y cotizaciones
const whereHistorial = (idsVentas, idsCotizaciones) => ({
    [Op.or]: [
        ...(idsVentas.length ? [{ Tipo: 'venta', RefID: idsVentas }] : []),
        ...(idsCotizaciones.length ? [{ Tipo: 'cotizacion', RefID: idsCotizaciones }] : []),
    ],
});

/**
 * Patrones (REGEXP de MySQL) que reconocen en un aviso el pedido o la cotización con ESE número exacto
 * ("pedido #12" no coincide con "pedido #123"). Se exportan para probarlos.
 */
const patronPedido = (id) => `[Pp]edido #${Number(id)}([^0-9]|$)`;
const patronCotizacion = (id) => `[Cc]otizaci(ó|o)n #${Number(id)}([^0-9]|$)`;

// ==================== ACCESO: DESCARGAR MIS DATOS ====================
exports.descargarDatos = async (req, res) => {
    try {
        const id = req.usuario.id;
        const usuario = await db.Usuario.findByPk(id, { attributes: { exclude: ['Contraseña', 'SesionesVersion'] } });
        if (!usuario || usuario.SuprimidoEn) return res.status(404).json({ estado: false, mensaje: 'Cuenta no encontrada' });
        const desde = usuario.HistorialDesde || null;

        const [ventas, cotizaciones, notificaciones, carrito] = await Promise.all([
            db.Venta.findAll({
                where: { DocumentoID: id, ...desdeWhere('FechaVenta', desde) },
                attributes: { exclude: ['ComprobanteTransferencia'], include: [[literal(TIENE_COMPROBANTE_SQL), 'TieneComprobante']] },
                include: [
                    { model: db.DetalleVenta, as: 'detalles', include: [
                        { model: db.Producto, as: 'producto', attributes: ['ProductoID', 'Nombre'] },
                        { model: db.Color, as: 'color', attributes: ['ColorID', 'Nombre'] },
                        { model: db.Talla, as: 'talla', attributes: ['TallaID', 'Nombre'] },
                    ] },
                    { model: db.Estado, as: 'estado', attributes: ['Nombre'] },
                ],
                order: [['VentaID', 'ASC']],
            }),
            db.Cotizacion.findAll({
                where: { DocumentoID: id, ...desdeWhere('FechaCotizacion', desde) },
                include: [
                    { model: db.DetalleCotizacion, as: 'detalles', include: [
                        { model: db.CotizacionTecnica, as: 'tecnicas' },
                        { model: db.CotizacionTalla, as: 'tallas' },
                        { model: db.CotizacionColor, as: 'colores' },
                        { model: db.CotizacionInsumo, as: 'insumos' },
                    ] },
                    { model: db.Estado, as: 'estado', attributes: ['Nombre'] },
                ],
                order: [['CotizacionID', 'ASC']],
            }),
            db.Notificacion.findAll({ where: { DocumentoID: id, ...desdeWhere('Fecha', desde) }, attributes: ['Tipo', 'Mensaje', 'Fecha', 'Leida'], order: [['Fecha', 'ASC']], raw: true }),
            db.Carrito.findByPk(id, { attributes: ['Datos', 'Actualizado'] }),
        ]);

        // Línea de tiempo (estado, fecha y nota) de cada pedido y cotización
        const pedidosPlanos = ventas.map(plano);
        const cotizacionesPlanas = cotizaciones.map(plano);
        const where = whereHistorial(pedidosPlanos.map((v) => v.VentaID), cotizacionesPlanas.map((c) => c.CotizacionID));
        const historial = where[Op.or].length
            ? await db.HistorialEstado.findAll({ where, attributes: ['Tipo', 'RefID', 'Fecha', 'Estado', 'Nota'], order: [['Fecha', 'ASC'], ['HistorialID', 'ASC']], raw: true })
            : [];
        const lineaDe = (tipo, refId) => historial.filter((h) => h.Tipo === tipo && String(h.RefID) === String(refId))
            .map(({ Fecha, Estado, Nota }) => ({ Fecha, Estado, Nota }));

        const { PrivacidadAceptadaEn = null, PrivacidadVersion = null, SuprimidoEn, HistorialDesde, ...perfil } = plano(usuario);
        const pedidos = pedidosPlanos.map(({ TieneComprobante, ...venta }) => ({
            ...venta,
            comprobante: Number(TieneComprobante) ? { adjunto: true, fecha: venta.FechaTransferencia ?? null } : null,
            historial: lineaDe('venta', venta.VentaID),
        }));

        const hoy = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Disposition', `attachment; filename="mis-datos-stamplab-${hoy}.json"`);
        res.json({
            generadoEn: new Date().toISOString(),
            descripcion: 'Copia de los datos personales que STAMPLAB trata sobre ti (derecho de acceso, Ley 1581 de 2012).',
            perfil,
            autorizacionPrivacidad: { aceptadaEn: PrivacidadAceptadaEn, version: PrivacidadVersion },
            pedidos,
            cotizaciones: cotizacionesPlanas.map((c) => ({ ...c, historial: lineaDe('cotizacion', c.CotizacionID) })),
            notificaciones,
            carrito: leerCarrito(carrito),
        });
    } catch (error) {
        console.error('Error al exportar los datos del titular:', error.message);
        res.status(500).json({ estado: false, mensaje: 'No se pudieron obtener tus datos. Intenta de nuevo.' });
    }
};

// ==================== SUPRESIÓN: ELIMINAR MI CUENTA Y MIS DATOS ====================

/**
 * Ventas canceladas con un comprobante que nadie revisó (posible pago sin devolver). Regla única en utils/pagoPorVerificar:
 * el administrador las cierra con "reembolso realizado" (ReembolsoRealizadoEn) o "no hubo pago" (ComprobanteMotivoRechazo).
 */
const pagosPorVerificar = (id, transaction) => db.Venta.count({ where: { DocumentoID: id, ...wherePagoPorVerificar() }, transaction });

/** Motivo (409) por el que todavía no se puede suprimir, o null. Se calcula con la fila del usuario ya bloqueada. */
async function motivoParaEsperar(id, transaction) {
    const enCurso = await db.Venta.count({ where: { DocumentoID: id, EstadoID: { [Op.notIn]: VENTA_FINAL } }, transaction });
    const reembolsos = await db.Venta.count({ where: { DocumentoID: id, ReembolsoPendiente: true }, transaction });
    const cotPendientes = await db.Cotizacion.count({ where: { DocumentoID: id, EstadoID: ESTADO_COTIZACION.PENDIENTE }, transaction });
    const cotEnTramite = await db.Cotizacion.count({ where: { DocumentoID: id, EstadoID: { [Op.in]: [ESTADO_COTIZACION.APROBADA, ESTADO_COTIZACION.EN_REVISION] } }, transaction });
    const porVerificar = await pagosPorVerificar(id, transaction);

    const partes = [];
    if (enCurso) partes.push(`tienes ${enCurso} pedido(s) en curso: los que sigan pendientes de pago puedes cancelarlos en "Mis compras"; los demás deben terminar (entregarse)`);
    if (cotPendientes) partes.push(`tienes ${cotPendientes} cotización(es) pendiente(s): puedes cancelarlas en "Mis cotizaciones"`);
    if (cotEnTramite) partes.push(`tienes ${cotEnTramite} cotización(es) en revisión o aprobada(s): espera a que se resuelvan o venzan (las aprobadas puedes rechazarlas en "Mis cotizaciones"), o escríbenos para cerrarlas`);
    if (reembolsos) partes.push(`tienes ${reembolsos} reembolso(s) pendiente(s) a tu favor: el equipo debe completarlo(s) primero`);
    if (porVerificar) partes.push('tienes un pago por verificar en un pedido cancelado; el equipo te contactará para resolverlo');
    return partes.length ? `Aún no podemos eliminar tu cuenta: ${partes.join('; ')}. Luego vuelve a intentarlo.` : null;
}

exports.suprimirCuenta = async (req, res) => {
    const id = req.usuario.id;
    const contrasena = req.body?.Contraseña;
    if (!contrasena || typeof contrasena !== 'string') {
        return res.status(400).json({ estado: false, mensaje: 'Escribe tu contraseña actual para confirmar.' });
    }
    try {
        const resultado = await db.sequelize.transaction(async (transaction) => {
            // Bajo bloqueo: dos solicitudes simultáneas no se pisan, y los conteos de abajo se hacen con la fila bloqueada
            const usuario = await db.Usuario.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!usuario || usuario.SuprimidoEn) return { status: 404, mensaje: 'Cuenta no encontrada' };
            if (Number(usuario.RolID) === ROL_ADMIN) {
                return { status: 403, mensaje: 'La cuenta del administrador no se puede eliminar desde la tienda.' };
            }
            // 403 y no 401: un 401 haría que el navegador cerrara la sesión por una contraseña mal escrita
            if (!(await bcrypt.compare(contrasena, usuario.Contraseña))) return { status: 403, mensaje: 'La contraseña no es correcta.' };

            const motivo = await motivoParaEsperar(id, transaction);
            if (motivo) return { status: 409, mensaje: motivo };

            const ventas = await db.Venta.findAll({ where: { DocumentoID: id }, attributes: ['VentaID'], raw: true, transaction });
            const cotizaciones = await db.Cotizacion.findAll({ where: { DocumentoID: id }, attributes: ['CotizacionID'], raw: true, transaction });
            const idsVentas = ventas.map((v) => v.VentaID);
            const idsCot = cotizaciones.map((c) => c.CotizacionID);

            // Pedidos: se conservan las cifras (contabilidad) y se borran los datos de contacto y el comprobante
            if (idsVentas.length) {
                await db.Venta.update({
                    ContactoNombre: TITULAR_SUPRIMIDO, ContactoTelefono: null, ContactoDireccion: null,
                    NombreReceptor: null, TelefonoEntrega: null, DireccionEntrega: null,
                    ComprobanteTransferencia: null, ComprobanteMotivoRechazo: null,
                }, { where: { DocumentoID: id }, transaction });
            }

            // Cotizaciones: textos libres e imágenes de diseño
            if (idsCot.length) {
                const detalles = await db.DetalleCotizacion.findAll({ where: { CotizacionID: idsCot }, attributes: ['DetalleCotizacionID'], raw: true, transaction });
                await db.DetalleCotizacion.update({ PrendaDescripcion: null }, { where: { CotizacionID: idsCot }, transaction });
                const idsDet = detalles.map((d) => d.DetalleCotizacionID);
                if (idsDet.length) await db.CotizacionTecnica.update({ ImagenDiseño: null, Observaciones: null }, { where: { DetalleCotizacionID: idsDet }, transaction });
            }

            // Línea de tiempo: se conservan estados y fechas; las notas (motivos, mensajes) se borran
            if (idsVentas.length || idsCot.length) {
                await db.HistorialEstado.update({ Nota: null }, { where: whereHistorial(idsVentas, idsCot), transaction });
            }

            await db.Carrito.destroy({ where: { DocumentoID: id }, transaction });
            await db.Notificacion.destroy({ where: { DocumentoID: id }, transaction });

            // Avisos del equipo sobre SUS pedidos y cotizaciones (llevan su nombre y a veces un motivo escrito por él):
            // se reemplazan por un texto neutro. Se reconocen por el número exacto, nunca por el nombre (otro cliente puede
            // llamarse parecido: "Ana" / "Mariana").
            if (idsVentas.length || idsCot.length) {
                const admins = await db.Usuario.findAll({ where: { RolID: ROL_ADMIN }, attributes: ['DocumentoID'], raw: true, transaction });
                const destinatarios = admins.map((a) => a.DocumentoID);
                if (destinatarios.length) {
                    for (const v of idsVentas) {
                        await db.Notificacion.update({ Mensaje: `Pedido #${v} (titular suprimido)` },
                            { where: { DocumentoID: destinatarios, Mensaje: { [Op.regexp]: patronPedido(v) } }, transaction });
                    }
                    for (const c of idsCot) {
                        await db.Notificacion.update({ Mensaje: `Cotización #${c} (titular suprimido)` },
                            { where: { DocumentoID: destinatarios, Mensaje: { [Op.regexp]: patronCotizacion(c) } }, transaction });
                    }
                }
            }

            await usuario.update({
                Nombre: TITULAR_SUPRIMIDO,
                Correo: `suprimido-${id}@invalid`,
                Telefono: null,
                Direccion: null,
                Contraseña: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
                SuprimidoEn: new Date(),
            }, { transaction });
            // La fila se conserva: subir la versión de sesión corta todas las sesiones en todos los servidores.
            // En memoria se aplica solo tras el commit (si la transacción se deshace, las sesiones siguen valiendo).
            const aplicar = await sesion.revocarTodas(id, transaction);
            return { aplicar };
        });

        if (resultado.status) return res.status(resultado.status).json({ estado: false, mensaje: resultado.mensaje });
        if (typeof resultado.aplicar === 'function') resultado.aplicar();
        res.json({ estado: true, mensaje: 'Tu cuenta y tus datos personales fueron eliminados.' });
    } catch (error) {
        console.error('Error al suprimir la cuenta:', error.message);
        res.status(500).json({ estado: false, mensaje: 'No se pudo eliminar tu cuenta. Intenta de nuevo.' });
    }
};

exports.patronPedido = patronPedido;
exports.patronCotizacion = patronCotizacion;
