// Sesiones: el cierre de sesión corta toda la cadena de renovaciones y la sesión tiene un tope absoluto de vida
jest.mock('../models', () => ({
    SesionRevocada: { destroy: jest.fn().mockResolvedValue(0), findAll: jest.fn().mockResolvedValue([]), findOrCreate: jest.fn().mockResolvedValue([{}, true]) },
    Usuario: { findAll: jest.fn().mockResolvedValue([]) },
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
