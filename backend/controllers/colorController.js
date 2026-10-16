const db = require('../models');
const Color = db.Color;
const InventarioProducto = db.InventarioProducto;
const CotizacionColor = db.CotizacionColor;
const DetalleVenta = db.DetalleVenta;


// Busca otro color con el mismo nombre (sin distinguir mayúsculas)
const existeNombre = async (nombre, exceptoID = null) => {
    if (typeof Color.findOne !== 'function') return false;
    const { Op, fn, col, where } = require('sequelize');
    const cond = [where(fn('LOWER', col('Nombre')), nombre.toLowerCase())];
    if (exceptoID) cond.push({ ColorID: { [Op.ne]: exceptoID } });
    return !!(await Color.findOne({ where: { [Op.and]: cond } }));
};

// Listar todos los colores
const getAllColores = async (req, res) => {
    try {
        const colores = await Color.findAll();
        res.json({ estado: true, datos: colores });
    } catch (error) {
        console.error(error);
        res.status(500).json({ estado: false, mensaje: "Error al obtener colores" });
    }
};

// Obtener color por ID
const getColorById = async (req, res) => {
    try {
        const color = await Color.findByPk(req.params.id);
        if (!color)
            return res.status(404).json({ estado: false, mensaje: "Color no encontrado" });

        res.json({ estado: true, datos: color });
    } catch (error) {
        console.error(error);
        res.status(500).json({ estado: false, mensaje: "Error al obtener color" });
    }
};

// Crear color
const createColor = async (req, res) => {
    try {
        const { Nombre } = req.body;
        if (!Nombre || Nombre.trim() === "") {
            return res.status(400).json({ estado: false, mensaje: "El nombre es obligatorio" });
        }

        if (await existeNombre(Nombre.trim())) {
            return res.status(400).json({ estado: false, mensaje: `Ya existe un color llamado "${Nombre.trim()}"` });
        }

        const nuevoColor = await Color.create({ Nombre: Nombre.trim() });
        res.status(201).json({ estado: true, mensaje: "Color creado correctamente", datos: nuevoColor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ estado: false, mensaje: "Error al crear color" });
    }
};

// Actualizar color
const updateColor = async (req, res) => {
    try {
        const { Nombre } = req.body;

        if (!Nombre || Nombre.trim() === "") {
            return res.status(400).json({ estado: false, mensaje: "El nombre es obligatorio" });
        }

        const color = await Color.findByPk(req.params.id);
        if (!color)
            return res.status(404).json({ estado: false, mensaje: "Color no encontrado" });

        if (await existeNombre(Nombre.trim(), color.ColorID)) {
            return res.status(400).json({ estado: false, mensaje: `Ya existe un color llamado "${Nombre.trim()}"` });
        }

        await color.update({ Nombre: Nombre.trim() });

        res.json({
            estado: true,
            mensaje: "Color actualizado correctamente",
            datos: color
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ estado: false, mensaje: "Error al actualizar color" });
    }
};

// Eliminar color - CON VALIDACIÓN DE ASOCIACIONES
const deleteColor = async (req, res) => {
    try {
        const colorID = req.params.id;

        const color = await Color.findByPk(colorID);
        if (!color) {
            return res.status(404).json({ 
                estado: false, 
                mensaje: "Color no encontrado" 
            });
        }

        // VALIDAR SI EL COLOR ESTÁ ASOCIADO A PRODUCTOS
        const variantesConColor = await InventarioProducto.count({
            where: { ColorID: colorID }
        });

        if (variantesConColor > 0) {
            return res.status(400).json({
                estado: false,
                mensaje: `No se puede eliminar el color "${color.Nombre}" porque está asociado a ${variantesConColor} variante(s) de producto(s)`,
                detalles: {
                    colorID: colorID,
                    colorNombre: color.Nombre,
                    variantesAsociadas: variantesConColor
                }
            });
        }

        // VALIDAR SI EL COLOR ESTÁ EN COTIZACIONES
        const cotizacionesConColor = await CotizacionColor.count({
            where: { ColorID: colorID }
        });

        if (cotizacionesConColor > 0) {
            return res.status(400).json({
                estado: false,
                mensaje: `No se puede eliminar el color "${color.Nombre}" porque está asociado a ${cotizacionesConColor} cotización(es)`,
                detalles: {
                    colorID: colorID,
                    colorNombre: color.Nombre,
                    cotizacionesAsociadas: cotizacionesConColor
                }
            });
        }

        // VALIDAR SI EL COLOR ESTÁ EN VENTAS
        const ventasConColor = await DetalleVenta.count({
            where: { ColorID: colorID }
        });

        if (ventasConColor > 0) {
            return res.status(400).json({
                estado: false,
                mensaje: `No se puede eliminar el color "${color.Nombre}" porque está asociado a ${ventasConColor} venta(s)`,
                detalles: {
                    colorID: colorID,
                    colorNombre: color.Nombre,
                    ventasAsociadas: ventasConColor
                }
            });
        }

        // SI NO HAY ASOCIACIONES, ELIMINAR
        await color.destroy();
        
        res.json({ 
            estado: true, 
            mensaje: `Color "${color.Nombre}" eliminado correctamente` 
        });

    } catch (error) {
        console.error('Error al eliminar color:', error);
        res.status(500).json({ 
            estado: false, 
            mensaje: "Error al eliminar color",
            error: error.message 
        });
    }
};

module.exports = {
    getAllColores,
    getColorById,
    createColor,
    updateColor,
    deleteColor
};