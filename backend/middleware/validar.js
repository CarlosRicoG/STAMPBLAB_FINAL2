/**
 * Validación de entrada (Joi) para los endpoints críticos. Mensajes en español.
 * Uso:  router.post('/', validar(esquemas.venta), controlador)
 * Responde 400 con { estado:false, mensaje, message, errores:[...] } si el cuerpo no cumple.
 */
const Joi = require('joi');
const { ESTADO_VENTA } = require('../config/estados');

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

const validar = (esquema, origen = 'body') => function validarCuerpo(req, res, next) {
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
const nombre = Joi.string().trim().min(2).max(100).pattern(/^[^<>]*$/).messages({ 'string.pattern.base': 'El nombre no puede contener los símbolos < o >' }).label('El nombre');
const direccion = (max) => Joi.string().trim().allow('', null).max(max).pattern(/^[^<>]*$/).messages({ 'string.pattern.base': 'La dirección no puede contener los símbolos < o >' }).label('La dirección');
// Misma política que utils/contrasenas.validarContrasena
const contrasena = Joi.string().min(8).max(100).pattern(/[A-Za-z]/).pattern(/\d/)
    .messages({ 'string.pattern.base': 'La contraseña debe incluir letras y números' }).label('La contraseña');
const rol = Joi.number().integer().min(1).max(1000).label('El rol');
const entero = (label, min = 1, max = 1000000) => Joi.number().integer().min(min).max(max).label(label);
// Las columnas de dinero son DECIMAL(10,2): el máximo que caben es 99.999.999,99 (más daba error 500 de la base)
const dinero = (label) => Joi.number().min(0).max(99999999.99).label(label);
// Texto libre opcional con tope de longitud (evita cuerpos enormes guardados en columnas TEXT)
const textoLibre = (label, max = 1000) => Joi.string().max(max).allow('', null).label(label);

// ── Esquemas ──
const esquemas = {
    login: Joi.object({
        Correo: correo.required(),
        Contraseña: Joi.string().required().max(200).label('La contraseña'),
    }),

    registro: Joi.object({
        DocumentoID: documento.required(),
        Nombre: nombre.required(),
        Correo: correo.required(),
        Telefono: telefono,
        Direccion: direccion(200),
        Contraseña: contrasena.required(),
        // Autorización previa, expresa e informada (Ley 1581 de 2012, art. 9; Decreto 1377 de 2013, art. 5): la casilla
        // del formulario debe venir marcada, junto con la versión de la política que se mostró (prueba de la autorización)
        AceptaPrivacidad: Joi.boolean().valid(true).required()
            .messages({ 'any.only': 'Debes autorizar el tratamiento de tus datos personales para registrarte', 'any.required': 'Debes autorizar el tratamiento de tus datos personales para registrarte' }),
        VersionPolitica: Joi.string().trim().min(1).max(50).required().label('La versión de la política de tratamiento de datos'),
    }),

    // El administrador crea un usuario desde el panel (la dirección admite lo que cabe en la columna: 255)
    usuarioCreacion: Joi.object({
        DocumentoID: documento.required(),
        Nombre: nombre.required(),
        Correo: correo.required(),
        Telefono: telefono,
        Direccion: direccion(255),
        Contraseña: contrasena.required(),
        RolID: rol.required(),
    }),

    // Editar usuario (panel o "Mis datos"): todo opcional; contraseña vacía = no se cambia
    usuarioEdicion: Joi.object({
        DocumentoID: documento,
        Nombre: nombre,
        Correo: correo,
        Telefono: telefono,
        Direccion: direccion(255),
        Contraseña: contrasena.allow('', null),
        RolID: rol,
    }),

    // Cada producto de un pedido/venta: cantidades enteras positivas, precios no negativos
    venta: Joi.object({
        DocumentoID: documento,
        Subtotal: dinero('El subtotal'),
        Total: dinero('El total'),
        // Un pedido nace Pendiente o, si el administrador ya cobró, Pagada; nunca en producción, entregado o cancelado
        EstadoID: Joi.number().integer().valid(ESTADO_VENTA.PENDIENTE, ESTADO_VENTA.PAGADA).label('El estado inicial del pedido'),
        metodoPago: Joi.string().valid('transferencia', 'contraentrega').allow(null, ''),
        // Datos de entrega: los límites son los de las columnas (un teléfono de 21 caracteres daba un error 500 sin explicación)
        nombreReceptor: Joi.string().trim().max(100).allow('', null).label('El nombre de quien recibe'),
        telefonoEntrega: Joi.string().trim().max(20).allow('', null).label('El teléfono de entrega'),
        direccionEntrega: Joi.string().trim().max(255).allow('', null).label('La dirección de entrega'),
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
            PrendaDescripcion: textoLibre('La descripción de la prenda'),
            // Diseños (técnica + parte + imagen): a lo sumo 20 por producto
            tecnicas: Joi.array().max(20).items(Joi.object({
                Observaciones: textoLibre('Las observaciones del diseño'),
                ImagenDiseño: textoLibre('La imagen del diseño', 255),
                ImagenDiseno: textoLibre('La imagen del diseño', 255),
            }).unknown(true)).label('Los diseños del producto'),
            // Cantidades por talla y color: enteros positivos (una cantidad negativa restaría del precio de la cotización)
            tallas: Joi.array().max(50).items(Joi.object({
                TallaID: entero('La talla').required(),
                Cantidad: entero('La cantidad de la talla', 1, 100000),
            }).unknown(true)),
            colores: Joi.array().max(50).items(Joi.object({
                ColorID: entero('El color').required(),
                Cantidad: entero('La cantidad del color', 1, 100000),
            }).unknown(true)),
            // La tela se cobra por unidad: una cantidad negativa o en cero restaría del precio
            insumos: Joi.array().max(50).items(Joi.object({
                InsumoID: entero('El insumo').required(),
                CantidadRequerida: entero('La cantidad del insumo', 1, 100000),
            }).unknown(true)),
        }).unknown(true).custom((d, helpers) => {
            // Si cada talla trae su cantidad, deben sumar la cantidad del producto (se cobra una cantidad y se reserva otra si no)
            const t = d.tallas || [];
            if (t.length && t.every((x) => Number(x.Cantidad) > 0)) {
                const suma = t.reduce((s, x) => s + Number(x.Cantidad), 0);
                if (suma !== Number(d.Cantidad)) return helpers.message('Las cantidades por talla deben sumar la cantidad del producto');
            }
            return d;
        })).required().label('Los productos de la cotización'),
    }),
};

module.exports = { validar, esquemas };
