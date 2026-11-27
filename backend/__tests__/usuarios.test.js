// ============================================================
// PRUEBAS UNITARIAS - usuariosController.js
// Proyecto: STAMPLAB
// ============================================================

// --- Mocks de dependencias externas ---
jest.mock('../models', () => ({
    Usuario: {
        findAndCountAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
    },
    Rol: {},
    // Transacción administrada: si el callback lanza, se deshace
    sequelize: { transaction: jest.fn(async (cb) => { const tx = { id: 'tx' }; try { const r = await cb(tx); tx.confirmada = true; return r; } catch (e) { tx.deshecha = true; throw e; } }) },
}));

jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashedPassword123'),
    compare: jest.fn(),
}));

jest.mock('../services/sesion', () => ({
    cerrarCuenta: jest.fn().mockResolvedValue(() => {}),
    revocarTodas: jest.fn().mockResolvedValue(),
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('token_falso_123'),
}));

const { Usuario } = require('../models');
const bcrypt = require('bcryptjs');
const controller = require('../controllers/usuarioController');

// --- Helpers para simular req y res ---
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

// ============================================================
// BLOQUE 1: getAllUsuarios
// ============================================================
describe('getAllUsuarios', () => {

    test('retorna lista paginada de usuarios correctamente', async () => {
        const usuarioFalso = {
            toJSON: () => ({ DocumentoID: '123', Nombre: 'Ana', rol: { Nombre: 'Admin' } })
        };
        Usuario.findAndCountAll.mockResolvedValue({ count: 1, rows: [usuarioFalso] });

        const req = { query: { page: '1', limit: '10', search: '' } };
        const res = mockRes();

        await controller.getAllUsuarios(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            total: 1,
            pagina: 1,
        }));
    });

    test('retorna error 500 si falla la base de datos', async () => {
        Usuario.findAndCountAll.mockRejectedValue(new Error('DB caída'));

        const req = { query: {} };
        const res = mockRes();

        await controller.getAllUsuarios(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ estado: false }));
    });

});

// ============================================================
// BLOQUE 2: getUsuarioById
// ============================================================
describe('getUsuarioById', () => {

    test('retorna el usuario si existe', async () => {
        const usuarioFalso = {
            toJSON: () => ({ DocumentoID: '1', Nombre: 'Carlos', rol: { Nombre: 'Cliente' } })
        };
        Usuario.findByPk.mockResolvedValue(usuarioFalso);

        const req = { params: { id: '1' } };
        const res = mockRes();

        await controller.getUsuarioById(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ Nombre: 'Carlos' }));
    });

    test('retorna 404 si el usuario no existe', async () => {
        Usuario.findByPk.mockResolvedValue(null);

        const req = { params: { id: '9999' } };
        const res = mockRes();

        await controller.getUsuarioById(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            mensaje: 'Usuario no encontrado'
        }));
    });

});

// ============================================================
// BLOQUE 3: createUsuario
// ============================================================
describe('createUsuario', () => {

    test('retorna 400 si faltan campos obligatorios', async () => {
        const req = { body: { Nombre: 'Sin correo' } }; // faltan campos
        const res = mockRes();

        await controller.createUsuario(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ estado: false }));
    });

    test('rechaza una contraseña débil (menos de 8, sin letras o sin números)', async () => {
        for (const clave of ['1234', 'soloLetrasLargas', '123456789012']) {
            const res = mockRes();
            await controller.createUsuario({ body: { DocumentoID: '111', Nombre: 'Luis', Correo: 'l@mail.com', Contraseña: clave, RolID: 2 } }, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: expect.stringContaining('contraseña') }));
        }
    });

    test('retorna 400 si el correo ya está registrado', async () => {
        Usuario.findOne.mockResolvedValue({ Correo: 'ya@existe.com' }); // simula correo duplicado

        const req = {
            body: {
                DocumentoID: '111', Nombre: 'Luis', Correo: 'ya@existe.com',
                Contraseña: 'Segura1234', RolID: 2
            }
        };
        const res = mockRes();

        await controller.createUsuario(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            mensaje: expect.stringContaining('correo')
        }));
    });

    test('crea usuario correctamente con datos válidos', async () => {
        Usuario.findOne.mockResolvedValue(null);   // no existe correo duplicado
        Usuario.findByPk.mockResolvedValue(null);  // no existe documento duplicado

        const nuevoUsuario = {
            DocumentoID: '222', Nombre: 'María', Correo: 'maria@mail.com', RolID: 2,
            toJSON: () => ({ DocumentoID: '222', Nombre: 'María', Correo: 'maria@mail.com' })
        };
        Usuario.create.mockResolvedValue(nuevoUsuario);

        const req = {
            body: {
                DocumentoID: '222', Nombre: 'María', Correo: 'maria@mail.com',
                Contraseña: 'segura123', RolID: 2
            }
        };
        const res = mockRes();

        await controller.createUsuario(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            estado: true,
            mensaje: 'Usuario creado correctamente'
        }));
    });

});

// ============================================================
// BLOQUE 4: deleteUsuario
// ============================================================
describe('deleteUsuario', () => {

    test('retorna 404 si el usuario a eliminar no existe', async () => {
        Usuario.findByPk.mockResolvedValue(null);

        const req = { params: { id: '8888' } };
        const res = mockRes();

        await controller.deleteUsuario(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('no permite eliminar al administrador (RolID=1)', async () => {
        Usuario.findByPk.mockResolvedValue({ RolID: 1, destroy: jest.fn() });

        const req = { params: { id: '1' } };
        const res = mockRes();

        await controller.deleteUsuario(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            mensaje: 'No se puede eliminar al usuario Administrador'
        }));
    });

    test('elimina usuario correctamente si no es admin', async () => {
        const destroyMock = jest.fn().mockResolvedValue(true);
        Usuario.findByPk.mockResolvedValue({ RolID: 2, destroy: destroyMock });

        const req = { params: { id: '3' } };
        const res = mockRes();

        await controller.deleteUsuario(req, res);

        expect(destroyMock).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            estado: true,
            mensaje: 'Usuario eliminado exitosamente'
        }));
    });

    test('corta sus sesiones con un corte por documento (no subiendo la versión) antes de borrar la fila', async () => {
        const sesion = require('../services/sesion');
        sesion.cerrarCuenta.mockClear(); sesion.revocarTodas.mockClear();
        const orden = [];
        sesion.cerrarCuenta.mockImplementationOnce(async () => { orden.push('corte'); return () => orden.push('corte en memoria'); });
        const destroyMock = jest.fn(async () => { orden.push('borrado'); });
        Usuario.findByPk.mockResolvedValue({ DocumentoID: 3, RolID: 2, destroy: destroyMock });

        await controller.deleteUsuario({ params: { id: '3' } }, mockRes());

        // Corte y borrado en la misma transacción; el corte en memoria, solo después
        const tx = sesion.cerrarCuenta.mock.calls[0][1].transaction;
        expect(sesion.cerrarCuenta).toHaveBeenCalledWith(3, { transaction: tx });
        expect(destroyMock).toHaveBeenCalledWith({ transaction: tx });
        expect(sesion.revocarTodas).not.toHaveBeenCalled();
        expect(orden).toEqual(['corte', 'borrado', 'corte en memoria']);
    });

    test('si el borrado falla (clave foránea) se deshace el corte y no se aplica en memoria', async () => {
        const sesion = require('../services/sesion');
        const aplicar = jest.fn();
        sesion.cerrarCuenta.mockResolvedValueOnce(aplicar);
        const err = new Error('fk'); err.name = 'SequelizeForeignKeyConstraintError';
        Usuario.findByPk.mockResolvedValue({ DocumentoID: 4, RolID: 2, destroy: jest.fn().mockRejectedValue(err) });
        const res = mockRes();

        await controller.deleteUsuario({ params: { id: '4' } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(aplicar).not.toHaveBeenCalled();
        const tx = sesion.cerrarCuenta.mock.calls.at(-1)[1].transaction;
        expect(tx.deshecha).toBe(true);
    });

});

