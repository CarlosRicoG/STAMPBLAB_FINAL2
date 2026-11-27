// Sesiones: el cierre de sesión corta toda la cadena de renovaciones y la sesión tiene un tope absoluto de vida
jest.mock('../models', () => ({
    SesionRevocada: { destroy: jest.fn().mockResolvedValue(0), findAll: jest.fn().mockResolvedValue([]), findOrCreate: jest.fn().mockResolvedValue([{}, true]) },
    Usuario: { findAll: jest.fn().mockResolvedValue([]), increment: jest.fn().mockResolvedValue([]), findByPk: jest.fn().mockResolvedValue({ SesionesVersion: 3 }) },
}));

const jwt = require('jsonwebtoken');
const db = require('../models');
const sesion = require('../services/sesion');

const ahora = () => Math.floor(Date.now() / 1000);
const usuario = { DocumentoID: 123, RolID: 2, SesionesVersion: 0 };
// Datos de un token (ya verificado) al que le queda poco: la renovación entra en juego
const casiVencido = (extra = {}) => ({ id: 123, rol: 2, sv: 0, jti: 'jti-a', sid: 'sid-1', ini: ahora() - 3600, iat: ahora() - 3600, exp: ahora() + 60, ...extra });

beforeEach(() => { db.SesionRevocada.findOrCreate.mockClear(); });

describe('Sesión: identificador estable (sid) y tope de vida', () => {
    test('emitir: el token nuevo trae sid (= su jti) e inicio de sesión', () => {
        const datos = jwt.decode(sesion.emitir(usuario));
        expect(datos.jti).toBeTruthy();
        expect(datos.sid).toBe(datos.jti);
        expect(Math.abs(datos.ini - ahora())).toBeLessThanOrEqual(2);
    });

    test('renovación: hereda sid e inicio, con otro jti', () => {
        const nuevo = jwt.decode(sesion.renovacion(casiVencido()));
        expect(nuevo.sid).toBe('sid-1');
        expect(nuevo.ini).toBe(casiVencido().ini);
        expect(nuevo.jti).not.toBe('jti-a');
    });

    test('renovación de un token anterior sin sid: usa su jti como sid (compatibilidad)', () => {
        const viejo = casiVencido({ sid: undefined, ini: undefined });
        const nuevo = jwt.decode(sesion.renovacion(viejo));
        expect(nuevo.sid).toBe('jti-a');
        expect(nuevo.ini).toBe(viejo.iat);
    });

    test('logout con el token renovado invalida también el token anterior copiado (misma sesión)', async () => {
        const original = jwt.decode(sesion.emitir(usuario));
        const renovado = jwt.decode(sesion.renovacion({ ...original, exp: ahora() + 60 }));
        expect(renovado.jti).not.toBe(original.jti);
        await sesion.revocar(renovado);
        expect(await sesion.estaVigente(original)).toBe(false);
        expect(await sesion.estaVigente(renovado)).toBe(false);
        // Se guarda el sid (no solo el jti) para que los demás procesos también lo corten
        expect(db.SesionRevocada.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({ where: { Jti: original.sid } }));
    });

    test('logout guarda la revocación hasta el fin de la vida máxima de la sesión (no solo hasta el exp del token)', async () => {
        const datos = casiVencido({ jti: 'jti-x', sid: 'sid-x' });
        await sesion.revocar(datos);
        const { defaults } = db.SesionRevocada.findOrCreate.mock.calls[0][0];
        expect(defaults.Expira.getTime()).toBeGreaterThanOrEqual((datos.ini + 24 * 3600) * 1000);
    });

    test('otra sesión del mismo usuario sigue vigente tras el logout', async () => {
        await sesion.revocar(casiVencido({ jti: 'jti-b', sid: 'sid-b' }));
        expect(await sesion.estaVigente(casiVencido({ jti: 'jti-c', sid: 'sid-c' }))).toBe(true);
    });

    test('pasada la vida máxima (24 h por defecto) ya no se renueva', () => {
        expect(sesion.renovacion(casiVencido({ ini: ahora() - 24 * 3600 - 5 }))).toBeNull();
    });

    test('el token renovado no vive más allá del tope de la sesión', () => {
        const ini = ahora() - 24 * 3600 + 1800; // quedan 30 min de vida de sesión
        const nuevo = jwt.decode(sesion.renovacion(casiVencido({ ini })));
        expect(nuevo.exp).toBeLessThanOrEqual(ini + 24 * 3600);
    });

    test('la vida máxima se configura con SESION_VIDA_MAXIMA_HORAS', () => {
        const antes = process.env.SESION_VIDA_MAXIMA_HORAS;
        process.env.SESION_VIDA_MAXIMA_HORAS = '2';
        try {
            expect(sesion.renovacion(casiVencido({ ini: ahora() - 3 * 3600 }))).toBeNull();
        } finally {
            if (antes === undefined) delete process.env.SESION_VIDA_MAXIMA_HORAS; else process.env.SESION_VIDA_MAXIMA_HORAS = antes;
        }
    });
});

describe('Sesión: cuenta eliminada y vuelta a registrar con el mismo documento', () => {
    const token = (id, extra = {}) => ({ id, rol: 2, sv: 0, jti: 'j-' + Math.random(), sid: 's-' + Math.random(), ini: ahora(), iat: ahora(), exp: ahora() + 3600, ...extra });
    afterEach(() => { db.SesionRevocada.findAll.mockResolvedValue([]); db.Usuario.findAll.mockResolvedValue([]); });

    test('tras eliminar la cuenta, sus tokens anteriores no valen pero los de la cuenta nueva sí (sv 0)', async () => {
        await sesion.revocarTodas(901); // había cambiado la clave: versión 3 en memoria
        await sesion.cerrarCuenta(901);
        expect(await sesion.estaVigente(token(901, { ini: ahora() - 60, sv: 3 }))).toBe(false);
        // La cuenta nueva empieza en SesionesVersion 0 y su sesión se abre después de la eliminación
        expect(await sesion.estaVigente(token(901, { ini: ahora() + 1 }))).toBe(true);
        // Se guarda en la base para que los demás servidores también corten
        expect(db.SesionRevocada.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({ defaults: expect.objectContaining({ DocumentoID: 901 }) }));
    });

    test('otro servidor: el corte por cuenta eliminada llega desde la base al refrescar', async () => {
        const corte = ahora() - 100;
        db.SesionRevocada.findAll.mockResolvedValue([{ Jti: `usuario:902:${corte}`, DocumentoID: 902, Expira: new Date(Date.now() + 3600e3) }]);
        await sesion.refrescar(true);
        expect(await sesion.estaVigente(token(902, { ini: corte - 10 }))).toBe(false);
        expect(await sesion.estaVigente(token(902, { ini: corte + 10 }))).toBe(true);
    });

    test('refrescar reconstruye las versiones: un usuario que ya no tiene versión (borrado y nuevo) deja de arrastrar la anterior', async () => {
        db.Usuario.findAll.mockResolvedValue([{ DocumentoID: 903, SesionesVersion: 2 }]);
        await sesion.refrescar(true);
        expect(await sesion.estaVigente(token(903))).toBe(false);
        db.Usuario.findAll.mockResolvedValue([]); // la fila se borró y se volvió a registrar con SesionesVersion 0
        await sesion.refrescar(true);
        expect(await sesion.estaVigente(token(903))).toBe(true);
    });

    test('si la base falla al refrescar se conservan las versiones que ya había', async () => {
        db.Usuario.findAll.mockResolvedValue([{ DocumentoID: 904, SesionesVersion: 1 }]);
        await sesion.refrescar(true);
        db.Usuario.findAll.mockRejectedValue(new Error('caída'));
        const error = jest.spyOn(console, 'error').mockImplementation(() => {});
        await sesion.refrescar(true);
        error.mockRestore();
        expect(await sesion.estaVigente(token(904))).toBe(false);
    });
});

describe('Sesión: cuenta borrada en un servidor y recreada en otro (antes del refresco de 30 s)', () => {
    const token = (id, extra = {}) => ({ id, rol: 2, sv: 0, jti: 'j-' + Math.random(), sid: 's-' + Math.random(), ini: ahora(), iat: ahora(), exp: ahora() + 3600, ...extra });
    afterEach(() => { jest.restoreAllMocks(); db.SesionRevocada.findAll.mockResolvedValue([]); db.Usuario.findAll.mockResolvedValue([]); });

    test('un token rechazado por versión fuerza un refresco: la versión vieja de la cuenta borrada no tumba la sesión nueva', async () => {
        db.Usuario.findAll.mockResolvedValue([{ DocumentoID: 910, SesionesVersion: 4 }]); // servidor B: cuenta vieja con clave cambiada
        await sesion.refrescar(true);
        // En el servidor A se borró la cuenta y se volvió a crear (versión 0)
        const corte = ahora();
        db.SesionRevocada.findAll.mockResolvedValue([{ Jti: `usuario:910:${corte}`, DocumentoID: 910, Expira: new Date(Date.now() + 3600e3) }]);
        db.Usuario.findAll.mockResolvedValue([]);
        const real = Date.now();
        jest.spyOn(Date, 'now').mockReturnValue(real + 2000); // pasó más de 1 s desde el último refresco
        expect(await sesion.estaVigente(token(910, { ini: corte + 1 }))).toBe(true);
        expect(await sesion.estaVigente(token(910, { ini: corte - 30, sv: 4 }))).toBe(false); // sesión de la cuenta borrada
    });

    test('con el corte conocido, una versión leída antes del corte no se aplica a sesiones posteriores (aunque la base falle)', async () => {
        db.Usuario.findAll.mockResolvedValue([{ DocumentoID: 911, SesionesVersion: 3 }]);
        await sesion.refrescar(true);
        const real = Date.now();
        const corte = Math.floor(real / 1000) + 5; // la cuenta se borró 5 s después de leer la versión
        db.SesionRevocada.findAll.mockResolvedValue([{ Jti: `usuario:911:${corte}`, DocumentoID: 911, Expira: new Date(real + 3600e3) }]);
        db.Usuario.findAll.mockRejectedValue(new Error('caída')); // los cortes se leen, las versiones no
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(Date, 'now').mockReturnValue(real + 7000);
        await sesion.refrescar(true);
        expect(await sesion.estaVigente(token(911, { ini: corte + 1 }))).toBe(true);
        expect(await sesion.estaVigente(token(911, { ini: corte - 10 }))).toBe(false);
    });

    test('pero si la versión se leyó DESPUÉS del corte (cuenta nueva que cambió su clave) sí se aplica', async () => {
        const real = Date.now();
        const corte = Math.floor(real / 1000) - 10;
        db.SesionRevocada.findAll.mockResolvedValue([{ Jti: `usuario:912:${corte}`, DocumentoID: 912, Expira: new Date(real + 3600e3) }]);
        db.Usuario.findAll.mockResolvedValue([{ DocumentoID: 912, SesionesVersion: 1 }]);
        await sesion.refrescar(true);
        expect(await sesion.estaVigente(token(912, { ini: corte + 2, sv: 0 }))).toBe(false);
        expect(await sesion.estaVigente(token(912, { ini: corte + 2, sv: 1 }))).toBe(true);
    });

    test('cerrarCuenta con transacción: guarda dentro de ella y solo corta en memoria al llamar a aplicar (tras el commit)', async () => {
        const tx = { id: 'tx' };
        const aplicar = await sesion.cerrarCuenta(913, { transaction: tx });
        expect(db.SesionRevocada.findOrCreate).toHaveBeenLastCalledWith(expect.objectContaining({ transaction: tx }));
        const vieja = token(913, { ini: ahora() - 60 });
        expect(await sesion.estaVigente(vieja)).toBe(true); // aún no se aplicó (p. ej. la transacción se deshizo)
        aplicar();
        expect(await sesion.estaVigente(vieja)).toBe(false);
    });
});

describe('Sesión: revocarTodas dentro de una transacción', () => {
    const token = (id, extra = {}) => ({ id, rol: 2, sv: 0, jti: 'j-' + Math.random(), sid: 's-' + Math.random(), ini: ahora() - 60, iat: ahora() - 60, exp: ahora() + 3600, ...extra });

    test('no toca la memoria hasta que el llamador aplica (tras el commit)', async () => {
        db.Usuario.findByPk.mockResolvedValueOnce({ SesionesVersion: 1 });
        const aplicar = await sesion.revocarTodas(9301, { id: 'tx' });
        expect(db.Usuario.increment).toHaveBeenCalledWith('SesionesVersion', expect.objectContaining({ transaction: { id: 'tx' } }));
        expect(await sesion.estaVigente(token(9301))).toBe(true); // si la transacción se deshiciera, la sesión seguiría
        aplicar();
        expect(await sesion.estaVigente(token(9301))).toBe(false);
    });

    test('sin transacción se aplica en el acto (cambio de contraseña)', async () => {
        db.Usuario.findByPk.mockResolvedValueOnce({ SesionesVersion: 1 });
        await sesion.revocarTodas(9302);
        expect(await sesion.estaVigente(token(9302))).toBe(false);
    });
});
