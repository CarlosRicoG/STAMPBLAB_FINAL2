const { Talla, Producto } = require("../models");

// Obtener todas las tallas
exports.getAllTallas = async (req, res) => {
    try {
        const tallas = await Talla.findAll();
        res.json({ estado: true, datos: tallas });
    } catch (error) {
        res.status(500).json({ estado: false, mensaje: error.message });
    }
};

// Obtener talla por ID
exports.getTallaById = async (req, res) => {
    try {
        const talla = await Talla.findByPk(req.params.id, {
            include: [{ model: Producto, as: "productos", through: { attributes: [] } }]
        });

        if (!talla)
            return res.status(404).json({ estado: false, mensaje: "Talla no encontrada" });

        res.json({ estado: true, datos: talla });
    } catch (error) {
        res.status(500).json({ estado: false, mensaje: error.message });
    }
};

// Crear talla
exports.createTalla = async (req, res) => {
    try {
        const { Nombre, Precio } = req.body;

        if (!Nombre || Nombre.trim() === "") {
            return res.status(400).json({ estado: false, mensaje: "El nombre es obligatorio" });
        }

        let precioFinal = null;

        // Solo XXL y XXXL deben tener precio
        if (["XXL", "XXXL"].includes(Nombre.toUpperCase())) {
            if (Precio === null || Precio === undefined || Precio === "") {
                return res.status(400).json({ estado: false, mensaje: "El precio es obligatorio para tallas grandes" });
            }

            if (isNaN(Precio)) {
                return res.status(400).json({ estado: false, mensaje: "El precio debe ser un número" });
            }

            precioFinal = parseFloat(Precio);
        }

        const nueva = await Talla.create({ Nombre, Precio: precioFinal });

        res.status(201).json({
            estado: true,
            mensaje: "Talla creada",
            datos: nueva
        });

    } catch (error) {
        res.status(500).json({ estado: false, mensaje: error.message });
    }
};

// Actualizar talla
exports.updateTalla = async (req, res) => {
    try {
        const { Nombre, Precio } = req.body;

        const talla = await Talla.findByPk(req.params.id);
        if (!talla)
            return res.status(404).json({ estado: false, mensaje: "Talla no encontrada" });

        let precioFinal = null;

        if (["XXL", "XXXL"].includes(Nombre.toUpperCase())) {
            if (!Precio && Precio !== 0)
                return res.status(400).json({ estado: false, mensaje: "El precio es obligatorio para tallas grandes" });

            if (isNaN(Precio))
                return res.status(400).json({ estado: false, mensaje: "El precio debe ser numérico" });

            precioFinal = parseFloat(Precio);
        }

        await talla.update({ Nombre, Precio: precioFinal });

        res.json({
            estado: true,
            mensaje: "Talla actualizada",
            datos: talla
        });

    } catch (error) {
        res.status(500).json({ estado: false, mensaje: error.message });
    }
};

// Eliminar talla
exports.deleteTalla = async (req, res) => {
    try {
        const talla = await Talla.findByPk(req.params.id);
        if (!talla)
            return res.status(404).json({ estado: false, mensaje: "Talla no encontrada" });

        await talla.destroy();
        res.json({ estado: true, mensaje: "Talla eliminada" });

    } catch (error) {
        res.status(500).json({ estado: false, mensaje: error.message });
    }
};
