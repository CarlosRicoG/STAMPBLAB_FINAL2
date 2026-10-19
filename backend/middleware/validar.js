/**
 * Validación de entrada (Joi) para los endpoints críticos. Mensajes en español.
 * Uso:  router.post('/', validar(esquemas.venta), controlador)
 * Responde 400 con { estado:false, mensaje, message, errores:[...] } si el cuerpo no cumple.
 */
const Joi = require('joi');

const mensajes = {
    'any.required': '{{#label}} es obligatorio',
    'string.empty': '{{#label}} no puede estar vacío',
    'string.base': '{{#label}} debe ser texto',
    'string.email': '{{#label}} no es un correo válido',
    'string.min': '{{#label}} debe tener al menos {{#limit}} caracteres',
    'string.max': '{{#label}} no puede superar {{#limit}} caracteres',
    'string.pattern.base': '{{#label}} no tiene un formato válido',
    'number.base': '{{#label}} debe ser un número',
    'number.integer': '{{#label}} debe ser un número entero',
    'number.min': '{{#label}} debe ser mayor o igual a {{#limit}}',
    'number.max': '{{#label}} no puede ser mayor a {{#limit}}',
    'number.positive': '{{#label}} debe ser mayor a 0',
    'array.min': '{{#label}} debe tener al menos {{#limit}} elemento(s)',
    'array.base': '{{#label}} debe ser una lista',
    'any.only': '{{#label}} no tiene un valor permitido',
};

const opciones = { abortEarly: false, allowUnknown: true, messages: mensajes, convert: true, errors: { wrap: { label: false } } };

const validar = (esquema, origen = 'body') => (req, res, next) => {
    const { error, value } = esquema.validate(req[origen], opciones);
    if (error) {
        const errores = error.details.map((d) => d.message);
        const mensaje = errores.join('. ');
        return res.status(400).json({ estado: false, mensaje, message: mensaje, errores });
    }
    req[origen] = value;
    next();
};

// ── Piezas reutilizables ──
const documento = Joi.alternatives().try(
    Joi.number().integer().min(10000).max(999999999999999),
    Joi.string().pattern(/^\d{5,15}$/)
).label('El documento (solo números, 5 a 15 dígitos)');
const correo = Joi.string().trim().email({ minDomainSegments: 2, tlds: { allow: false } }).max(150).label('El correo');
const telefono = Joi.string().trim().allow('', null).pattern(/^[0-9+\-\s()]{7,20}$/).label('El teléfono');
const entero = (label, min = 1, max = 1000000) => Joi.number().integer().min(min).max(max).label(label);
const dinero = (label) => Joi.number().min(0).max(1e10).label(label);

// ── Esquemas ──
const esquemas = {
    login: Joi.object({
        Correo: correo.required(),
        Contraseña: Joi.string().required().max(200).label('La contraseña'),
    }),

    registro: Joi.object({
        DocumentoID: documento.required(),
        Nombre: Joi.string().trim().min(2).max(100).required().label('El nombre'),
        Correo: correo.required(),
        Telefono: telefono,
        Direccion: Joi.string().trim().allow('', null).max(200).label('La dirección'),
        Contraseña: Joi.string().min(8).max(100).pattern(/[A-Za-z]/).pattern(/\d/).required()
            .messages({ 'string.pattern.base': 'La contraseña debe incluir letras y números' }).label('La contraseña'),
    }),

    // Cada producto de un pedido/venta: cantidades enteras positivas, precios no negativos
    venta: Joi.object({
        DocumentoID: documento,
        Subtotal: dinero('El subtotal'),
        Total: dinero('El total'),
        metodoPago: Joi.string().valid('transferencia', 'contraentrega').allow(null, ''),
        detalles: Joi.array().min(1).max(200).items(Joi.object({
            ProductoID: entero('El producto').required(),
            ColorID: Joi.number().integer().positive().allow(null),
            TallaID: Joi.number().integer().positive().allow(null),
            TelaID: Joi.number().integer().positive().allow(null),
            InventarioID: Joi.number().integer().positive().allow(null),
            Cantidad: entero('La cantidad', 1, 100000).required(),
            PrecioUnitario: dinero('El precio unitario').required(),
        }).unknown(true)).required().label('Los productos de la venta'),
    }),

    // Editar una venta: puede venir solo el estado o también los productos
    ventaEdicion: Joi.object({
        Subtotal: dinero('El subtotal'),
        Total: dinero('El total'),
        detalles: Joi.array().min(1).max(200).items(Joi.object({
            ProductoID: entero('El producto').required(),
            Cantidad: entero('La cantidad', 1, 100000).required(),
            PrecioUnitario: dinero('El precio unitario').required(),
        }).unknown(true)),
    }),

    cotizacion: Joi.object({
        detalles: Joi.array().min(1).max(100).items(Joi.object({
            Cantidad: entero('La cantidad', 1, 100000).required(),
        }).unknown(true)).required().label('Los productos de la cotización'),
    }),
};

module.exports = { validar, esquemas };
