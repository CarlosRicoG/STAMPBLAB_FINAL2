const { InventarioProducto, Producto, Color, Talla, Insumo } = require('../models');

// Obtener todas las variantes (inventario)
exports.getAllInventario = async (req, res) => {
    try {
        const inventario = await InventarioProducto.findAll({
            include: [
                {
                    model: Producto,
                    as: 'producto',
                    attributes: ['ProductoID', 'Nombre', 'Descripcion', 'PrecioBase']
                },
                {
                    model: Color,
                    as: 'color',
                    attributes: ['ColorID', 'Nombre']
                },
                {
                    model: Talla,
                    as: 'talla',
                    attributes: ['TallaID', 'Nombre', 'Precio']
                },
                {
                    model: Insumo,
                    as: 'tela',
                    attributes: ['InsumoID', 'Nombre', 'PrecioTela'],
                    required: false 
                }
            ]
        });

        res.json({
            estado: true,
            mensaje: 'Inventario obtenido exitosamente',
            datos: inventario
        });
    } catch (error) {
        console.error('Error al obtener inventario:', error);
        res.status(500).json({
            estado: false,
            mensaje: 'Error al obtener inventario',
            error: error.message
        });
    }
};

// Obtener variantes de un producto específico
exports.getInventarioByProducto = async (req, res) => {
    try {
        const { productoId } = req.params;

        const inventario = await InventarioProducto.findAll({
            where: { ProductoID: productoId },
            include: [
                {
                    model: Color,
                    as: 'color',
                    attributes: ['ColorID', 'Nombre']
                },
                {
                    model: Talla,
                    as: 'talla',
                    attributes: ['TallaID', 'Nombre', 'Precio']
                },
                {
                    model: Insumo,
                    as: 'tela',
                    attributes: ['InsumoID', 'Nombre', 'PrecioTela'],
                    required: false // LEFT JOIN para que funcione aunque no tenga tela
                }
            ]
        });

        res.json({
            estado: true,
            mensaje: 'Variantes obtenidas exitosamente',
            datos: inventario
        });
    } catch (error) {
        console.error('Error al obtener variantes:', error);
        res.status(500).json({
            estado: false,
            mensaje: 'Error al obtener variantes',
            error: error.message
        });
    }
};

// Obtener una variante por ID
exports.getInventarioById = async (req, res) => {
    try {
        const inventario = await InventarioProducto.findByPk(req.params.id, {
            include: [
                { 
                    model: Producto, 
                    as: 'producto',
                    attributes: ['ProductoID', 'Nombre', 'PrecioBase']
                },
                { 
                    model: Color, 
                    as: 'color',
                    attributes: ['ColorID', 'Nombre']
                },
                { 
                    model: Talla, 
                    as: 'talla',
                    attributes: ['TallaID', 'Nombre', 'Precio']
                },
                {
                    model: Insumo,
                    as: 'tela',
                    attributes: ['InsumoID', 'Nombre', 'PrecioTela'],
                    required: false
                }
            ]
        });

        if (!inventario) {
            return res.status(404).json({
                estado: false,
                mensaje: 'Variante no encontrada'
            });
        }

        res.json({
            estado: true,
            mensaje: 'Variante obtenida exitosamente',
            datos: inventario
        });
    } catch (error) {
        res.status(500).json({
            estado: false,
            mensaje: 'Error al obtener variante',
            error: error.message
        });
    }
};

// Crear una nueva variante
exports.createInventario = async (req, res) => {
    try {
        const { ProductoID, ColorID, TallaID, TelaID, Stock, Estado } = req.body;

        // Validaciones
        if (!ProductoID || !ColorID || !TallaID) {
            return res.status(400).json({
                estado: false,
                mensaje: 'ProductoID, ColorID y TallaID son obligatorios'
            });
        }

        // Validar que no exista ya esa combinación (incluyendo tela)
        const existe = await InventarioProducto.findOne({
            where: {
                ProductoID,
                ColorID,
                TallaID,
                TelaID: TelaID || null
            }
        });

        if (existe) {
            return res.status(400).json({
                estado: false,
                mensaje: 'Ya existe una variante con esa combinación de color, talla y tela'
            });
        }

        const nuevoInventario = await InventarioProducto.create({
            ProductoID: parseInt(ProductoID),
            ColorID: parseInt(ColorID),
            TallaID: parseInt(TallaID),
            TelaID: TelaID ? parseInt(TelaID) : null,
            Stock: Stock !== undefined ? parseInt(Stock) : 0,
            Estado: Estado !== undefined ? (Estado ? 1 : 0) : 1
        });

        // Obtener la variante completa con relaciones
        const varianteCompleta = await InventarioProducto.findByPk(nuevoInventario.InventarioID, {
            include: [
                { model: Color, as: 'color', attributes: ['ColorID', 'Nombre'] },
                { model: Talla, as: 'talla', attributes: ['TallaID', 'Nombre', 'Precio'] },
                { model: Insumo, as: 'tela', attributes: ['InsumoID', 'Nombre', 'PrecioTela'], required: false }
            ]
        });

        res.status(201).json({
            estado: true,
            mensaje: 'Variante creada exitosamente',
            datos: varianteCompleta
        });
    } catch (error) {
        console.error('Error al crear variante:', error);
        res.status(500).json({
            estado: false,
            mensaje: 'Error al crear variante',
            error: error.message
        });
    }
};

// Actualizar una variante
exports.updateInventario = async (req, res) => {
    try {
        const { Stock, TelaID, Estado } = req.body;

        const inventario = await InventarioProducto.findByPk(req.params.id);

        if (!inventario) {
            return res.status(404).json({
                estado: false,
                mensaje: 'Variante no encontrada'
            });
        }

        // Preparar datos de actualización
        const updateData = {};
        if (Stock !== undefined) updateData.Stock = parseInt(Stock);
        if (TelaID !== undefined) updateData.TelaID = TelaID ? parseInt(TelaID) : null;
        if (Estado !== undefined) updateData.Estado = Estado ? 1 : 0;

        await inventario.update(updateData);

        // Obtener la variante actualizada con relaciones
        const varianteActualizada = await InventarioProducto.findByPk(inventario.InventarioID, {
            include: [
                { model: Color, as: 'color', attributes: ['ColorID', 'Nombre'] },
                { model: Talla, as: 'talla', attributes: ['TallaID', 'Nombre', 'Precio'] },
                { model: Insumo, as: 'tela', attributes: ['InsumoID', 'Nombre', 'PrecioTela'], required: false }
            ]
        });

        res.json({
            estado: true,
            mensaje: 'Variante actualizada exitosamente',
            datos: varianteActualizada
        });
    } catch (error) {
        console.error('Error al actualizar variante:', error);
        res.status(500).json({
            estado: false,
            mensaje: 'Error al actualizar variante',
            error: error.message
        });
    }
};

// Eliminar una variante
exports.deleteInventario = async (req, res) => {
    try {
        const inventario = await InventarioProducto.findByPk(req.params.id);

        if (!inventario) {
            return res.status(404).json({
                estado: false,
                mensaje: 'Variante no encontrada'
            });
        }

        await inventario.destroy();

        res.json({
            estado: true,
            mensaje: 'Variante eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar variante:', error);
        res.status(500).json({
            estado: false,
            mensaje: 'Error al eliminar variante',
            error: error.message
        });
    }
};