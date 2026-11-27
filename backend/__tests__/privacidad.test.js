// ============================================================
// Habeas data (Ley 1581 de 2012 / Decreto 1377 de 2013) en el registro y el inicio de sesión:
//  - el registro exige la autorización expresa (AceptaPrivacidad: true) y la versión de la política aceptada
//  - se guarda la prueba de la autorización (fecha y versión)
//  - una cuenta suprimida no inicia sesión ni recupera la contraseña; su titular puede volver a registrarse
// ============================================================
jest.mock('../models', () => ({
    Usuario: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn(), update: jest.fn(), findAll: jest.fn().mockResolvedValue([]) },
    Notificacion: { destroy: jest.fn() },
    Carrito: { destroy: jest.fn() },
    sequelize: { transaction: jest.fn(async (cb) => cb({ id: 'tx' })) },
    SesionRevocada: { destroy: jest.fn().mockResolvedValue(0), findAll: jest.fn().mockResolvedValue([]), findOrCreate: jest.fn() },
}));
jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hash-nuevo'),
    hashSync: jest.fn().mockReturnValue('hash-relleno'),
    compare: jest.fn(),
}));
jest.mock('../services/sesion', () => ({ emitir: jest.fn().mockReturnValue('token-sesion'), revocar: jest.fn(), revocarTodas: jest.fn() }));
jest.mock('nodemailer', () => ({ createTransport: jest.fn(() => ({ sendMail: jest.fn().mockResolvedValue() })) }));

const db = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { esquemas } = require('../middleware/validar');
const router = require('../routes/auth');
const { Op } = require('sequelize');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
// Ejecuta la cadena de middlewares de una ruta del router como lo haría Express
const ejecutar = async (ruta, req) => {
    const capa = router.stack.find((c) => c.route?.path === ruta && c.route.methods.post);
    const res = mockRes();
    for (const { handle } of capa.route.stack) {
        let siguio = false;
        await handle(req, res, () => { siguio = true; });
        if (!siguio) break;
    }
    return res;
};
const cuerpoRegistro = (extra = {}) => ({
    DocumentoID: '1234567', Nombre: 'Ana Pérez', Correo: 'ana@correo.com', Telefono: '3001234567', Direccion: 'Calle 1 # 2-3',
    Contraseña: 'Clave1234', AceptaPrivacidad: true, VersionPolitica: '1.0-2026-11-27', ...extra,
});

beforeEach(() => {
    jest.clearAllMocks();
    db.Usuario.findOne.mockResolvedValue(null);
    db.Usuario.findByPk.mockResolvedValue(null);
    db.Usuario.create.mockImplementation(async (datos) => ({ ...datos, toJSON: () => ({ ...datos }) }));
});

describe('esquema de registro: autorización de tratamiento de datos', () => {
    const validar = (cuerpo) => esquemas.registro.validate(cuerpo, { abortEarly: false, allowUnknown: true });

    test('acepta el registro con la autorización y la versión de la política', () => {
        expect(validar(cuerpoRegistro()).error).toBeUndefined();
    });

    test.each([
        ['sin AceptaPrivacidad', { AceptaPrivacidad: undefined }],
        ['con AceptaPrivacidad: false', { AceptaPrivacidad: false }],
        ['sin VersionPolitica', { VersionPolitica: undefined }],
        ['con VersionPolitica vacía', { VersionPolitica: '' }],
        ['con VersionPolitica demasiado larga', { VersionPolitica: 'x'.repeat(51) }],
    ])('rechaza el registro %s', (_, extra) => {
        expect(validar(cuerpoRegistro(extra)).error).toBeDefined();
    });

    test('el mensaje explica que hace falta autorizar el tratamiento de datos', () => {
        const { error } = validar(cuerpoRegistro({ AceptaPrivacidad: false }));
        expect(error.message).toMatch(/autorizar el tratamiento de tus datos/i);
    });
});

describe('POST /registro', () => {
    test('400 si no se acepta la política (no crea el usuario)', async () => {
        const res = await ejecutar('/registro', { body: cuerpoRegistro({ AceptaPrivacidad: false }) });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(db.Usuario.create).not.toHaveBeenCalled();
    });

    test('guarda la prueba de la autorización: fecha y versión de la política', async () => {
        const antes = Date.now();
        const res = await ejecutar('/registro', { body: cuerpoRegistro() });
        expect(res.status).toHaveBeenCalledWith(201);
        const datos = db.Usuario.create.mock.calls[0][0];
        expect(datos.PrivacidadVersion).toBe('1.0-2026-11-27');
        expect(datos.PrivacidadAceptadaEn).toBeInstanceOf(Date);
        expect(datos.PrivacidadAceptadaEn.getTime()).toBeGreaterThanOrEqual(antes);
        expect(datos.RolID).toBe(2);
        // No se guardan como columnas los campos del formulario que no existen en la tabla
        expect(datos.AceptaPrivacidad).toBeUndefined();
    });

    test('el documento de una cuenta activa sigue sin poder registrarse otra vez', async () => {
        db.Usuario.findByPk.mockResolvedValue({ DocumentoID: 1234567, SuprimidoEn: null });
        const res = await ejecutar('/registro', { body: cuerpoRegistro() });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].mensaje).toMatch(/documento ya está registrado/);
    });

    describe('documento de una cuenta suprimida', () => {
        const suprimida = { DocumentoID: 1234567, RolID: 2, SuprimidoEn: new Date('2026-01-01'), SesionesVersion: 3 };
        const reutilizada = { DocumentoID: 1234567, RolID: 2, Nombre: 'Ana Pérez', Correo: 'ana@correo.com', Contraseña: 'hash-nuevo', SesionesVersion: 3, toJSON() { const { toJSON, ...r } = this; return r; } };
        beforeEach(() => {
            db.Usuario.findByPk.mockReset()
                .mockResolvedValueOnce(suprimida) // comprobación inicial
                .mockResolvedValueOnce(reutilizada); // fila ya actualizada, dentro de la transacción
            db.Usuario.update.mockResolvedValue([1]);
        });

        test('se reutiliza la fila de forma atómica (solo si SIGUE suprimida) y con HistorialDesde = el SuprimidoEn guardado', async () => {
            const res = await ejecutar('/registro', { body: cuerpoRegistro() });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(db.Usuario.create).not.toHaveBeenCalled();
            const [datos, opciones] = db.Usuario.update.mock.calls[0];
            expect(datos).toMatchObject({ Nombre: 'Ana Pérez', Correo: 'ana@correo.com', SuprimidoEn: null, RolID: 2, PrivacidadVersion: '1.0-2026-11-27' });
            expect(datos.PrivacidadAceptadaEn).toBeInstanceOf(Date);
            expect(datos.HistorialDesde).toBe(suprimida.SuprimidoEn); // todo lo del titular anterior es <= a esta fecha
            expect(opciones.where).toEqual({ DocumentoID: 1234567, SuprimidoEn: { [Op.ne]: null } });
            expect(opciones.transaction).toEqual(expect.objectContaining({ id: 'tx' }));
            expect(res.json.mock.calls[0][0].usuario.Contraseña).toBeUndefined();
        });

        test('borra los avisos y el carrito anteriores del documento (eran del titular suprimido)', async () => {
            await ejecutar('/registro', { body: cuerpoRegistro() });
            expect(db.Notificacion.destroy).toHaveBeenCalledWith(expect.objectContaining({ where: { DocumentoID: 1234567 }, transaction: expect.objectContaining({ id: 'tx' }) }));
            expect(db.Carrito.destroy).toHaveBeenCalledWith(expect.objectContaining({ where: { DocumentoID: 1234567 } }));
        });

        test('409 si otro registro simultáneo ya reutilizó la fila (0 filas afectadas)', async () => {
            db.Usuario.update.mockResolvedValue([0]);
            const res = await ejecutar('/registro', { body: cuerpoRegistro() });
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json.mock.calls[0][0].mensaje).toMatch(/documento ya está registrado/);
            expect(db.Notificacion.destroy).not.toHaveBeenCalled();
        });
    });
});

describe('cuenta suprimida', () => {
    const suprimida = { DocumentoID: 99, Correo: 'suprimido-99@invalid', Contraseña: 'hash', SuprimidoEn: new Date(), RolID: 2 };

    test('no puede iniciar sesión aunque la contraseña coincida (misma respuesta que credenciales malas)', async () => {
        db.Usuario.findOne.mockResolvedValue(suprimida);
        bcrypt.compare.mockResolvedValue(true);
        const res = await ejecutar('/login', { body: { Correo: 'suprimido-99@invalid.co', Contraseña: 'x' } });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json.mock.calls[0][0].token).toBeUndefined();
    });

    test('no recibe enlace de recuperación de contraseña', async () => {
        db.Usuario.findOne.mockResolvedValue(suprimida);
        const firmar = jest.spyOn(jwt, 'sign');
        const res = mockRes();
        const capa = router.stack.find((c) => c.route?.path === '/recuperar-password');
        await capa.route.stack[0].handle({ body: { Correo: 'suprimido-99@invalid' } }, res);
        expect(firmar).not.toHaveBeenCalled();
        expect(res.json.mock.calls[0][0].mensaje).toMatch(/Si el correo existe/);
        firmar.mockRestore();
    });

    test('un enlace de recuperación emitido antes de la supresión ya no sirve', async () => {
        // La huella coincide con la contraseña guardada: solo la supresión debe impedir el cambio
        const ph = require('../utils/contrasenas').huella(suprimida.Contraseña);
        const token = jwt.sign({ id: 99, tipo: 'recuperacion', ph }, require('../config/jwt'));
        db.Usuario.findByPk.mockResolvedValue({ ...suprimida, update: jest.fn() });
        const res = mockRes();
        const capa = router.stack.find((c) => c.route?.path === '/restablecer-password');
        await capa.route.stack[0].handle({ body: { token, nuevaContraseña: 'Nueva1234' } }, res);
        expect(res.status).toHaveBeenCalledWith(401);
    });
});
