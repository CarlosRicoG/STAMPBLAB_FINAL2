const { sequelize, Compra, Proveedor, DetalleCompra, Insumo, Producto, InventarioProducto, Color, Talla } = require('../models');

// ─────────────────────────────────────────────────────────────────────────────
// INCLUDES reutilizables
// ─────────────────────────────────────────────────────────────────────────────
const includeDetalles = [
  { model: Insumo, as: 'insumo', required: false },
  {
    model: Producto,
    as: 'producto',
    required: false,
    attributes: ['ProductoID', 'Nombre', 'Descripcion', 'PrecioBase']
  },
  {
    model: InventarioProducto,
    as: 'variante',
    required: false,
    include: [
      { model: Color, as: 'color', attributes: ['ColorID', 'Nombre'] },
      { model: Talla, as: 'talla', attributes: ['TallaID', 'Nombre', 'Precio'] },
      { model: Insumo, as: 'tela', attributes: ['InsumoID', 'Nombre', 'PrecioTela'], required: false }
    ]
  }
];

const includeCompra = [
  { model: Proveedor, as: 'proveedor' },
  { model: DetalleCompra, as: 'detalles', include: includeDetalles }
];

// Error de negocio (se responde con 400 en lugar de 500)
class ErrorCompra extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS de stock
// ─────────────────────────────────────────────────────────────────────────────
async function incrementarStockDetalle(detalle, transaction) {
  const by = parseInt(detalle.Cantidad, 10);
  if (detalle.TipoSeleccion === 'insumo') {
    await Insumo.increment('Stock', { by, where: { InsumoID: detalle.InsumoID }, transaction });
  } else {
    await InventarioProducto.increment('Stock', { by, where: { InventarioID: detalle.InventarioID }, transaction });
  }
}

async function decrementarStockDetalle(detalle, transaction) {
  const by = parseInt(detalle.Cantidad, 10);
  if (detalle.TipoSeleccion === 'insumo') {
    await Insumo.decrement('Stock', { by, where: { InsumoID: detalle.InsumoID }, transaction });
  } else {
    await InventarioProducto.decrement('Stock', { by, where: { InventarioID: detalle.InventarioID }, transaction });
  }
}

const claveStock = d => (d.TipoSeleccion === 'insumo' ? `i:${d.InsumoID}` : `v:${d.InventarioID}`);

/**
 * Verifica que revertir los detalles anteriores (y aplicar los nuevos) no deje
 * ningún stock en negativo — p. ej. si lo comprado ya se vendió o se consumió.
 */
async function validarReversionStock(detallesAnteriores, detallesNuevos, transaction) {
  const neto = new Map();
  for (const d of detallesAnteriores) neto.set(claveStock(d), (neto.get(claveStock(d)) || 0) - parseInt(d.Cantidad, 10));
  for (const d of detallesNuevos) neto.set(claveStock(d), (neto.get(claveStock(d)) || 0) + parseInt(d.Cantidad, 10));

  for (const [clave, cambio] of neto) {
    if (cambio >= 0) continue;
    const [tipo, id] = clave.split(':');
    if (tipo === 'i') {
      const ins = await Insumo.findByPk(id, { transaction });
      if (ins && ins.Stock + cambio < 0) {
        throw new ErrorCompra(`No se puede revertir el stock del insumo "${ins.Nombre}": tiene ${ins.Stock} unidad(es) y habría que descontar ${-cambio}. Parte de lo comprado ya fue consumido.`);
      }
    } else {
      const v = await InventarioProducto.findByPk(id, {
        transaction,
        include: [{ model: Producto, as: 'producto', attributes: ['Nombre'], required: false }]
      });
      if (v && v.Stock + cambio < 0) {
        const nombre = v.producto?.Nombre ? `"${v.producto.Nombre}"` : `#${id}`;
        throw new ErrorCompra(`No se puede revertir el stock de la variante ${nombre}: tiene ${v.Stock} unidad(es) y habría que descontar ${-cambio}. Parte de lo comprado ya fue vendido.`);
      }
    }
  }
}

/**
 * Busca o crea una variante en InventarioProducto.
 * @returns {number} InventarioID
 */
async function resolverVariante({ ProductoID, ColorID, TallaID, TelaID }, transaction) {
  const producto = await Producto.findByPk(ProductoID, { transaction });
  if (!producto) throw new ErrorCompra(`Producto con ID ${ProductoID} no encontrado`, 404);

  const whereVariante = {
    ProductoID: parseInt(ProductoID),
    ColorID: parseInt(ColorID),
    TallaID: parseInt(TallaID),
    TelaID: TelaID ? parseInt(TelaID) : null
  };

  let variante = await InventarioProducto.findOne({ where: whereVariante, transaction });

  if (!variante) {
    // Crear la variante con stock 0 (se incrementará luego)
    variante = await InventarioProducto.create({ ...whereVariante, Stock: 0, Estado: 1 }, { transaction });
  }

  return variante.InventarioID;
}

/**
 * Prepara un array de detalles listos para bulkCreate, resolviendo variantes si aplica.
 * @param {Array} detalles - array del body
 * @param {number} CompraID
 * @returns {Array}
 */
async function prepararDetalles(detalles, CompraID, transaction) {
  const resultado = [];

  for (const detalle of detalles) {
    const tipo = detalle.TipoSeleccion || 'insumo';
    const Cantidad = parseInt(detalle.Cantidad, 10);
    const PrecioUnitario = parseFloat(detalle.PrecioUnitario) || 0;
    const PrecioVenta = parseFloat(detalle.PrecioVenta) || null;

    if (tipo === 'insumo') {
      if (!detalle.InsumoID) throw new ErrorCompra('Cada detalle de tipo insumo debe tener InsumoID');
      const insumo = await Insumo.findByPk(detalle.InsumoID, { transaction });
      if (!insumo) throw new ErrorCompra(`Insumo con ID ${detalle.InsumoID} no encontrado`, 404);
      resultado.push({
        CompraID,
        TipoSeleccion: 'insumo',
        InsumoID: detalle.InsumoID,
        ProductoID: null,
        InventarioID: null,
        Cantidad,
        PrecioUnitario,
        PrecioVenta
      });

    } else if (tipo === 'producto') {
      if (!detalle.ProductoID) throw new ErrorCompra('Cada detalle de tipo producto debe tener ProductoID');
      if (!detalle.ColorID || !detalle.TallaID) throw new ErrorCompra('ColorID y TallaID son obligatorios para detalles de tipo producto');

      const inventarioID = await resolverVariante({
        ProductoID: detalle.ProductoID,
        ColorID: detalle.ColorID,
        TallaID: detalle.TallaID,
        TelaID: detalle.TelaID || null
      }, transaction);

      resultado.push({
        CompraID,
        TipoSeleccion: 'producto',
        InsumoID: null,
        ProductoID: detalle.ProductoID,
        InventarioID: inventarioID,
        Cantidad,
        PrecioUnitario,
        PrecioVenta
      });

    } else {
      throw new ErrorCompra(`TipoSeleccion inválido: ${tipo}. Debe ser "insumo" o "producto"`);
    }
  }

  return resultado;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDACIONES comunes de detalles
// ─────────────────────────────────────────────────────────────────────────────
function validarDetalles(detalles) {
  if (!Array.isArray(detalles) || detalles.length === 0) {
    return 'Debe agregar al menos un insumo o producto';
  }
  for (const detalle of detalles) {
    const cant = Number(detalle.Cantidad);
    if (!Number.isInteger(cant) || cant <= 0) {
      return 'Las cantidades deben ser números enteros mayores a 0';
    }
    const precio = Number(detalle.PrecioUnitario);
    if (!Number.isFinite(precio) || precio <= 0) {
      return 'El precio de compra de cada ítem debe ser mayor a 0';
    }
    const tipo = detalle.TipoSeleccion || 'insumo';
    if (tipo === 'insumo' && !detalle.InsumoID) return 'Cada detalle de tipo insumo debe tener InsumoID';
    if (tipo === 'producto' && !detalle.ProductoID) return 'Cada detalle de tipo producto debe tener ProductoID';
  }
  return null;
}

// Convierte 'YYYY-MM-DD' en fecha a mediodía local (evita corrimientos de zona horaria)
function parsearFecha(fecha) {
  if (!fecha) return null;
  const soloFecha = String(fecha).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(soloFecha)) return undefined;
  const d = new Date(soloFecha + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function responderError(res, error, mensajeGenerico) {
  if (error instanceof ErrorCompra) {
    return res.status(error.status).json({ message: error.message });
  }
  console.error(mensajeGenerico + ':', error);
  return res.status(500).json({ message: mensajeGenerico, error: error.message });
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD COMPRAS
// ─────────────────────────────────────────────────────────────────────────────

// Obtener todas las compras
exports.getAllCompras = async (req, res) => {
  try {
    const compras = await Compra.findAll({ include: includeCompra, order: [['CompraID', 'DESC']] });
    res.json(compras);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener compras', error: error.message });
  }
};

// Obtener una compra por ID
exports.getCompraById = async (req, res) => {
  try {
    const compra = await Compra.findByPk(req.params.id, { include: includeCompra });

    if (!compra) return res.status(404).json({ message: 'Compra no encontrada' });

    res.json(compra);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener compra', error: error.message });
  }
};

// Crear una nueva compra con detalles (insumos y/o productos)
exports.createCompra = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { ProveedorID, ProveedorRefId, detalles } = req.body;

    // Validar detalles
    const errorDetalles = validarDetalles(detalles);
    if (errorDetalles) throw new ErrorCompra(errorDetalles);

    const fecha = parsearFecha(req.body.FechaCompra);
    if (fecha === undefined) throw new ErrorCompra('La fecha de compra no es válida');

    // ── Resolver proveedor ──
    let proveedor = null;
    if (ProveedorRefId) proveedor = await Proveedor.findByPk(ProveedorRefId, { transaction: t });
    else if (ProveedorID) proveedor = await Proveedor.findOne({ where: { Nit: ProveedorID }, transaction: t });

    if (!ProveedorRefId && !ProveedorID) throw new ErrorCompra('Se requiere un proveedor válido');
    if (!proveedor) throw new ErrorCompra('Proveedor no encontrado', 404);
    if (proveedor.Estado === false || proveedor.Estado === 0) {
      throw new ErrorCompra(`El proveedor "${proveedor.Nombre}" está inactivo. Actívelo para registrarle compras.`);
    }

    // ── Crear la compra ──
    const nuevaCompra = await Compra.create({
      ProveedorID: proveedor.Nit,
      ProveedorRefId: proveedor.id,
      FechaCompra: fecha || new Date()
    }, { transaction: t });

    // ── Preparar y crear detalles (resuelve variantes automáticamente) ──
    const detallesPreparados = await prepararDetalles(detalles, nuevaCompra.CompraID, t);
    await DetalleCompra.bulkCreate(detallesPreparados, { transaction: t });

    // ── Incrementar stock para cada detalle ──
    for (const detalle of detallesPreparados) {
      await incrementarStockDetalle(detalle, t);
    }

    await t.commit();

    // ── Retornar compra completa ──
    const compraCompleta = await Compra.findByPk(nuevaCompra.CompraID, { include: includeCompra });

    res.status(201).json({
      message: 'Compra creada exitosamente',
      compra: compraCompleta
    });

  } catch (error) {
    await t.rollback();
    responderError(res, error, 'Error al crear compra');
  }
};

// Actualizar una compra
exports.updateCompra = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { ProveedorRefId, FechaCompra, detalles } = req.body;

    const compra = await Compra.findByPk(req.params.id, { transaction: t });
    if (!compra) throw new ErrorCompra('Compra no encontrada', 404);

    const errorDetalles = validarDetalles(detalles);
    if (errorDetalles) throw new ErrorCompra(errorDetalles);

    const fecha = parsearFecha(FechaCompra);
    if (fecha === undefined) throw new ErrorCompra('La fecha de compra no es válida');

    // ── Resolver nuevo proveedor si viene ──
    let proveedorNit = compra.ProveedorID;
    let proveedorRef = compra.ProveedorRefId;

    if (ProveedorRefId && parseInt(ProveedorRefId) !== compra.ProveedorRefId) {
      const proveedor = await Proveedor.findByPk(ProveedorRefId, { transaction: t });
      if (!proveedor) throw new ErrorCompra('Proveedor no encontrado', 404);
      if (proveedor.Estado === false || proveedor.Estado === 0) {
        throw new ErrorCompra(`El proveedor "${proveedor.Nombre}" está inactivo. Actívelo para asignarle compras.`);
      }
      proveedorNit = proveedor.Nit;
      proveedorRef = proveedor.id;
    }

    await compra.update({
      ProveedorID: proveedorNit,
      ProveedorRefId: proveedorRef,
      FechaCompra: fecha || compra.FechaCompra
    }, { transaction: t });

    // ── Preparar nuevos detalles y validar que el ajuste de stock sea posible ──
    const detallesAnteriores = await DetalleCompra.findAll({ where: { CompraID: compra.CompraID }, transaction: t });
    const detallesPreparados = await prepararDetalles(detalles, compra.CompraID, t);
    await validarReversionStock(detallesAnteriores, detallesPreparados, t);

    // ── Revertir stock de los detalles anteriores ──
    for (const detalleAnterior of detallesAnteriores) {
      await decrementarStockDetalle(detalleAnterior, t);
    }
    await DetalleCompra.destroy({ where: { CompraID: compra.CompraID }, transaction: t });

    // ── Crear nuevos detalles e incrementar stock ──
    await DetalleCompra.bulkCreate(detallesPreparados, { transaction: t });
    for (const detalle of detallesPreparados) {
      await incrementarStockDetalle(detalle, t);
    }

    await t.commit();

    const compraActualizada = await Compra.findByPk(compra.CompraID, { include: includeCompra });

    res.json({
      estado: true,
      message: 'Compra actualizada exitosamente',
      compra: compraActualizada
    });

  } catch (error) {
    await t.rollback();
    responderError(res, error, 'Error al actualizar compra');
  }
};

// Eliminar una compra
exports.deleteCompra = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const compra = await Compra.findByPk(req.params.id, { transaction: t });
    if (!compra) throw new ErrorCompra('Compra no encontrada', 404);

    // ── Revertir stock antes de eliminar (sin dejar stock negativo) ──
    const detalles = await DetalleCompra.findAll({ where: { CompraID: compra.CompraID }, transaction: t });
    await validarReversionStock(detalles, [], t);
    for (const detalle of detalles) {
      await decrementarStockDetalle(detalle, t);
    }

    await DetalleCompra.destroy({ where: { CompraID: compra.CompraID }, transaction: t });
    await compra.destroy({ transaction: t });

    await t.commit();
    res.json({ estado: true, message: 'Compra eliminada exitosamente' });

  } catch (error) {
    await t.rollback();
    responderError(res, error, 'Error al eliminar compra');
  }
};
