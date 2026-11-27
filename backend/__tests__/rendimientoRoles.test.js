// Roles: la pantalla de roles no muestra la lista de usuarios de cada rol. Por defecto se devuelve solo el número
// (CantidadUsuarios, con un COUNT agrupado) en vez de cargar todos los usuarios; ?usuarios=1 trae la lista como antes.
jest.mock('../models', () => ({
    Rol: { findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
    Usuario: { count: jest.fn() },
    Permiso: { findAll: jest.fn() },
}));

const { Rol, Usuario } = require('../models');
const controller = require('../controllers/rolController');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
const rol = (datos) => ({ ...datos, toJSON: () => ({ ...datos }), update: jest.fn() });
const alias = (opciones) => opciones.include.map((i) => i.as);

beforeEach(() => { jest.clearAllMocks(); });

describe('getAllRoles', () => {
    test('por defecto: sin la lista de usuarios, con CantidadUsuarios por rol (una consulta agrupada)', async () => {
        Rol.findAll.mockResolvedValue([rol({ RolID: 1, Nombre: 'Administrador', Estado: true, permisos: [] }), rol({ RolID: 2, Nombre: 'Cliente', Estado: true, permisos: [] }), rol({ RolID: 3, Nombre: 'Bodega', Estado: false, permisos: [] })]);
        Usuario.count.mockResolvedValue([{ RolID: 1, count: 2 }, { RolID: 2, count: 1500 }]);
        const res = mockRes();
        await controller.getAllRoles({ query: {} }, res);
        expect(alias(Rol.findAll.mock.calls[0][0])).toEqual(['permisos']);
        expect(Usuario.count).toHaveBeenCalledTimes(1);
        expect(Usuario.count.mock.calls[0][0]).toEqual(expect.objectContaining({ group: ['RolID'] }));
        const roles = res.json.mock.calls[0][0];
        expect(Array.isArray(roles)).toBe(true);
        expect(roles.map((r) => [r.RolID, r.Nombre, r.Estado, r.CantidadUsuarios])).toEqual([[1, 'Administrador', true, 2], [2, 'Cliente', true, 1500], [3, 'Bodega', false, 0]]);
        expect(roles[0]).toHaveProperty('permisos');
        expect(roles[0]).not.toHaveProperty('usuarios');
    });

    test('?usuarios=1: incluye la lista como antes (y el número)', async () => {
        Rol.findAll.mockResolvedValue([rol({ RolID: 1, Nombre: 'Administrador', usuarios: [{ DocumentoID: 1, Nombre: 'Ana' }], permisos: [] })]);
        Usuario.count.mockResolvedValue([{ RolID: 1, count: 1 }]);
        const res = mockRes();
        await controller.getAllRoles({ query: { usuarios: '1' } }, res);
        const usuarios = Rol.findAll.mock.calls[0][0].include.find((i) => i.as === 'usuarios');
        expect(usuarios.attributes).toEqual(['DocumentoID', 'Nombre']);
        expect(res.json.mock.calls[0][0][0]).toEqual(expect.objectContaining({ usuarios: [{ DocumentoID: 1, Nombre: 'Ana' }], CantidadUsuarios: 1 }));
    });
});

describe('getRolById', () => {
    test('por defecto: { estado, datos } sin la lista de usuarios, con CantidadUsuarios', async () => {
        Rol.findByPk.mockResolvedValue(rol({ RolID: 2, Nombre: 'Cliente', permisos: [] }));
        Usuario.count.mockResolvedValue([{ RolID: 2, count: 7 }]);
        const res = mockRes();
        await controller.getRolById({ params: { id: '2' }, query: {} }, res);
        expect(alias(Rol.findByPk.mock.calls[0][1])).toEqual(['permisos']);
        const cuerpo = res.json.mock.calls[0][0];
        expect(cuerpo.estado).toBe(true);
        expect(cuerpo.datos).toEqual(expect.objectContaining({ RolID: 2, Nombre: 'Cliente', CantidadUsuarios: 7 }));
        expect(cuerpo.datos).not.toHaveProperty('usuarios');
    });
});

describe('updateRol', () => {
    test('la respuesta no carga la lista de usuarios', async () => {
        const existente = rol({ RolID: 3, Nombre: 'Bodega', Descripcion: 'Maneja la bodega', Estado: true });
        Rol.findByPk.mockResolvedValueOnce(existente).mockResolvedValueOnce(rol({ RolID: 3, Nombre: 'Bodega', Estado: false, permisos: [] }));
        Usuario.count.mockResolvedValue([]);
        const res = mockRes();
        await controller.updateRol({ params: { id: '3' }, query: {}, body: { Estado: false } }, res);
        const recarga = Rol.findByPk.mock.calls[1][1];
        expect(alias(recarga)).toEqual(['permisos']);
        expect(res.json.mock.calls[0][0].datos).toEqual(expect.objectContaining({ RolID: 3, Estado: false, CantidadUsuarios: 0 }));
    });
});
