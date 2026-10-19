/**
 * ÚNICO lugar donde se mueve el stock de las variantes de producto por ventas/cotizaciones.
 *
 * Garantías (todo dentro de la transacción `t` que pasa el llamador):
 *  - Las filas de inventario se bloquean (SELECT ... FOR UPDATE) en orden ascendente de InventarioID, así dos
 *    compradores simultáneos no pueden vender la misma unidad ni se bloquean entre sí (sin interbloqueos).
 *  - Se descuenta/devuelve en UNA variante exacta (la guardada en DetalleVenta.InventarioID), nunca en varias.
 *  - Si algo falla, el llamador hace rollback y no queda nada a medias.
 */
const { InventarioProducto } = require('../models');

class ErrorNegocio extends Error {
    constructor(message, status = 400) {
        super(message);
        this.name = 'ErrorNegocio';
        this.esErrorNegocio = true; // se comprueba por propiedad (no por instanceof) para que funcione con mocks
        this.status = status;
    }
}

const lineaUsaInventario = (l) => !l.TraePrenda && l.ProductoID && (l.InventarioID || (l.ColorID && l.TallaID));

/** Devuelve el InventarioID de la variante exacta de una línea (o null si no existe). Sin bloquear. */
async function resolverId(linea, t) {
    if (linea.InventarioID) {
        const v = await InventarioProducto.findByPk(linea.InventarioID, { attributes: ['InventarioID'], transaction: t });
        if (v) return v.InventarioID;
    }
    const where = { ProductoID: linea.ProductoID, ColorID: linea.ColorID, TallaID: linea.TallaID };
    if (linea.TelaID) where.TelaID = linea.TelaID;
    const v = await InventarioProducto.findOne({
        where, attributes: ['InventarioID'], order: [['Stock', 'DESC'], ['InventarioID', 'ASC']], transaction: t,
    });
    return v ? v.InventarioID : null;
}

/** Agrupa las líneas por variante: Map(InventarioID -> { cantidad, nombre }). Marca cada línea con su InventarioID. */
async function agrupar(lineas, t) {
    const demanda = new Map();
    for (const l of lineas) {
        if (!lineaUsaInventario(l)) continue;
        const id = await resolverId(l, t);
        if (!id) {
            throw new ErrorNegocio(`No existe variante para Producto ${l.ProductoID}, Color ${l.ColorID}, Talla ${l.TallaID}`);
        }
        l.InventarioID = id;
        const previo = demanda.get(id) || { cantidad: 0, nombre: l.Nombre || '' };
        previo.cantidad += parseInt(l.Cantidad, 10) || 0;
        demanda.set(id, previo);
    }
    return demanda;
}

/** Bloquea las variantes (orden ascendente) y las devuelve en un Map(id -> instancia). */
async function bloquear(ids, t) {
    const lista = [...ids].sort((a, b) => a - b);
    if (!lista.length) return new Map();
    const filas = await InventarioProducto.findAll({
        where: { InventarioID: lista }, order: [['InventarioID', 'ASC']], transaction: t, lock: t.LOCK.UPDATE,
    });
    return new Map(filas.map((v) => [v.InventarioID, v]));
}

/**
 * Descuenta el stock de las líneas. Lanza ErrorNegocio (400) si no existe la variante o no alcanza.
 * Deja `linea.InventarioID` asignado para guardarlo en el detalle.
 */
async function reservar(lineas, t) {
    const demanda = await agrupar(lineas, t);
    const variantes = await bloquear(demanda.keys(), t);
    for (const [id, { cantidad, nombre }] of demanda) {
        const v = variantes.get(id);
        if (!v) throw new ErrorNegocio(`La variante ${id} ya no existe`);
        if (v.Stock < cantidad) {
            throw new ErrorNegocio(`Stock insuficiente${nombre ? ' para ' + nombre : ''}. Disponible: ${v.Stock}, Solicitado: ${cantidad}`);
        }
    }
    for (const [id, { cantidad }] of demanda) {
        await variantes.get(id).decrement('Stock', { by: cantidad, transaction: t });
    }
    return lineas;
}

/** Devuelve el stock de unos detalles ya vendidos (ventas canceladas/borradas/editadas). */
async function devolver(detalles, t) {
    const lineas = detalles.map((d) => (typeof d.get === 'function' ? d.get({ plain: true }) : { ...d }));
    const demanda = new Map();
    for (const l of lineas) {
        if (!l.ProductoID) continue;
        const id = (await resolverId(l, t));
        if (!id) continue; // la variante se eliminó: no hay a dónde devolver
        demanda.set(id, (demanda.get(id) || 0) + (parseInt(l.Cantidad, 10) || 0));
    }
    const variantes = await bloquear(demanda.keys(), t);
    for (const [id, cantidad] of demanda) {
        const v = variantes.get(id);
        if (v) await v.increment('Stock', { by: cantidad, transaction: t });
    }
}

module.exports = { ErrorNegocio, reservar, devolver, resolverId };
