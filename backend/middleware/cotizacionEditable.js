/**
 * Precio congelado: una cotización solo se puede modificar mientras está Pendiente o En revisión.
 * Después (Aprobada, Procesada, Rechazada, Cancelada, Vencida) lo que vio el cliente no puede cambiar.
 *
 * Se monta sobre las rutas que crean/editan/borran las partes de una cotización (detalles, técnicas, tallas, colores,
 * insumos). Las lecturas pasan sin revisar. Averigua a qué cotización pertenece el registro que se toca:
 *  - al crear, por el cuerpo (`DetalleCotizacionID`, o `CotizacionID` para los detalles);
 *  - al editar o borrar, por el registro que indica `:id`.
 */
const models = require('../models');
const { ESTADO_COTIZACION } = require('../config/estados');

const EDITABLES = [ESTADO_COTIZACION.PENDIENTE, ESTADO_COTIZACION.EN_REVISION];
const MENSAJE = 'La cotización ya fue aprobada o cerrada: no se puede modificar';

/** @param {'DetalleCotizacion'|'CotizacionTecnica'|'CotizacionTalla'|'CotizacionColor'|'CotizacionInsumo'} modelo */
const cotizacionEditable = (modelo) => async (req, res, next) => {
    try {
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

        let cotizacionID = null;
        if (modelo === 'DetalleCotizacion') {
            if (req.params.id) {
                const d = await models.DetalleCotizacion.findByPk(req.params.id, { attributes: ['CotizacionID'] });
                if (!d) return next(); // el controlador responde 404
                cotizacionID = d.CotizacionID;
            } else cotizacionID = req.body?.CotizacionID;
        } else {
            let detalleID = req.body?.DetalleCotizacionID;
            if (req.params.id) {
                const hijo = await models[modelo].findByPk(req.params.id, { attributes: ['DetalleCotizacionID'] });
                if (!hijo) return next();
                detalleID = hijo.DetalleCotizacionID;
            }
            if (detalleID) {
                const d = await models.DetalleCotizacion.findByPk(detalleID, { attributes: ['CotizacionID'] });
                cotizacionID = d?.CotizacionID;
            }
        }
        if (!cotizacionID) return next(); // sin cotización identificable: la validación propia del controlador responde

        const cotizacion = await models.Cotizacion.findByPk(cotizacionID, { attributes: ['CotizacionID', 'EstadoID'] });
        if (cotizacion && !EDITABLES.includes(cotizacion.EstadoID)) {
            return res.status(400).json({ message: MENSAJE, mensaje: MENSAJE });
        }
        return next();
    } catch (e) { return next(e); }
};

module.exports = { cotizacionEditable, EDITABLES };
