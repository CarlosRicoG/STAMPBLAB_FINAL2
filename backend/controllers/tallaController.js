const { Talla, Producto } = require("../models");
const { existeNombreEquivalente } = require("../utils/nombres");

// XXL y XXXL deben tener precio (recargo) obligatorio. Las demás tallas pueden
// tener un recargo opcional (p. ej. L o XL); antes se borraba al editar.
const TALLAS_PRECIO_OBLIGATORIO = ["XXL", "XXXL"];

// Devuelve { error } o { precio } (precio puede ser null)
const resolverPrecio = (nombre, precio, mensajeNoNumero) => {
    const vacio = precio === null || precio === undefined || precio === "";
    if (TALLAS_PRECIO_OBLIGATORIO.includes(String(nombre).trim().toUpperCase()) && vacio) {
        return { error: "El precio es obligatorio para tallas grandes" };
    }
    if (vacio) return { precio: null };
    if (isNaN(precio)) return { error: mensajeNoNumero };
    if (parseFloat(precio) < 0) return { error: "El precio no puede ser negativo" };
    return { precio: parseFloat(precio) };
};

const esDuplicado = (error) => error?.name === "SequelizeUniqueConstraintError";

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
        const talla = await Talla.findByPk(req.params.id);

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

        const { error, precio } = resolverPrecio(Nombre, Precio, "El precio debe ser un número");
        if (error) return res.status(400).json({ estado: false, mensaje: error });

        if (await existeNombreEquivalente(Talla, 'TallaID', Nombre, null)) {
            return res.status(400).json({ estado: false, mensaje: "Ya existe una talla con ese nombre (se ignoran mayúsculas y tildes)", message: "Ya existe una talla con ese nombre (se ignoran mayúsculas y tildes)" });
        }

        const nueva = await Talla.create({ Nombre: Nombre.trim(), Precio: precio });

        res.status(201).json({
            estado: true,
            mensaje: "Talla creada",
            datos: nueva
        });

    } catch (error) {
        if (esDuplicado(error)) {
            return res.status(400).json({ estado: false, mensaje: "Ya existe una talla con ese nombre" });
        }
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

        const nombreFinal = Nombre !== undefined && Nombre !== null ? String(Nombre).trim() : talla.Nombre;
        if (!nombreFinal) {
            return res.status(400).json({ estado: false, mensaje: "El nombre es obligatorio" });
        }

        // Si no se envía Precio se conserva el actual
        const precioEntrada = Precio !== undefined ? Precio : talla.Precio;
        const { error, precio } = resolverPrecio(nombreFinal, precioEntrada, "El precio debe ser numérico");
        if (error) return res.status(400).json({ estado: false, mensaje: error });

        if (await existeNombreEquivalente(Talla, 'TallaID', nombreFinal, talla.TallaID)) {
            return res.status(400).json({ estado: false, mensaje: "Ya existe una talla con ese nombre (se ignoran mayúsculas y tildes)", message: "Ya existe una talla con ese nombre (se ignoran mayúsculas y tildes)" });
        }

        await talla.update({ Nombre: nombreFinal, Precio: precio });

        res.json({
            estado: true,
            mensaje: "Talla actualizada",
            datos: talla
        });

    } catch (error) {
        if (esDuplicado(error)) {
            return res.status(400).json({ estado: false, mensaje: "Ya existe una talla con ese nombre" });
        }
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
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            const msg = 'No se puede eliminar la talla: está en uso en variantes de productos, pedidos o cotizaciones.';
            return res.status(400).json({ estado: false, mensaje: msg, message: msg });
        }

        res.status(500).json({ estado: false, mensaje: error.message });
    }
};
