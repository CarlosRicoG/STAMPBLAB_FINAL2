// Piezas del servidor: salud, orígenes CORS y apagado limpio
const { EventEmitter } = require('events');
const salud = require('../routes/salud');
const { origenesPermitidos } = require('../config/cors');
const { instalarApagado } = require('../services/apagado');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('GET /api/salud', () => {
    test('200 { estado: ok } si la base responde', async () => {
        const res = mockRes();
        await salud({ authenticate: jest.fn().mockResolvedValue() })({}, res);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ estado: 'ok' });
    });

    test('503 sin detalles internos si la base falla', async () => {
        const res = mockRes();
        await salud({ authenticate: jest.fn().mockRejectedValue(new Error('ECONNREFUSED 10.0.0.5:3306 usuario root')) })({}, res);
        expect(res.status).toHaveBeenCalledWith(503);
        expect(JSON.stringify(res.json.mock.calls[0][0])).not.toMatch(/ECONNREFUSED|root|3306/);
    });

    test('503 si la base no contesta a tiempo', async () => {
        const res = mockRes();
        await salud({ authenticate: () => new Promise(() => {}) }, { esperaMs: 20 })({}, res);
        expect(res.status).toHaveBeenCalledWith(503);
    });
});

describe('Orígenes CORS', () => {
    test('usa CORS_ORIGIN (separado por comas)', () => {
        expect(origenesPermitidos({ CORS_ORIGIN: 'https://a.com, https://b.com', NODE_ENV: 'production' })).toEqual(['https://a.com', 'https://b.com']);
    });

    test('en desarrollo, sin CORS_ORIGIN, permite el frontend local', () => {
        expect(origenesPermitidos({})).toEqual(expect.arrayContaining(['http://localhost:5173']));
    });

    test('en producción, sin CORS_ORIGIN, no arranca (no hay orígenes por defecto)', () => {
        expect(() => origenesPermitidos({ NODE_ENV: 'production' })).toThrow(/CORS_ORIGIN/);
        expect(() => origenesPermitidos({ NODE_ENV: 'production', CORS_ORIGIN: ' , ' })).toThrow(/CORS_ORIGIN/);
    });
});

describe('Apagado limpio (SIGTERM / SIGINT)', () => {
    const preparar = (extra = {}) => {
        const proceso = new EventEmitter();
        const orden = [];
        const servidor = { close: jest.fn((cb) => { orden.push('servidor'); cb(); }) };
        const sequelize = { close: jest.fn(async () => { orden.push('base'); }) };
        const detener = [jest.fn(() => orden.push('jobs'))];
        const salir = jest.fn();
        const error = jest.spyOn(console, 'error').mockImplementation(() => {});
        const info = jest.spyOn(console, 'log').mockImplementation(() => {});
        const apagar = instalarApagado({ servidor, sequelize, detener, salir, proceso, ...extra });
        return { proceso, orden, servidor, sequelize, salir, apagar, restaurar: () => { error.mockRestore(); info.mockRestore(); } };
    };

    test.each(['SIGTERM', 'SIGINT'])('%s: detiene jobs, cierra el servidor y la base, y sale con 0', async (senal) => {
        const p = preparar();
        p.proceso.emit(senal);
        await new Promise((r) => setImmediate(r));
        expect(p.orden).toEqual(['jobs', 'servidor', 'base']);
        expect(p.salir).toHaveBeenCalledWith(0);
        p.restaurar();
    });

    test('una segunda señal no repite el cierre', async () => {
        const p = preparar();
        p.proceso.emit('SIGTERM'); p.proceso.emit('SIGTERM');
        await new Promise((r) => setImmediate(r));
        expect(p.servidor.close).toHaveBeenCalledTimes(1);
        p.restaurar();
    });

    test('si algo se cuelga, el temporizador de seguridad fuerza la salida', async () => {
        jest.useFakeTimers();
        const p = preparar({ esperaMs: 10000 });
        p.servidor.close.mockImplementation(() => {}); // nunca termina (conexiones abiertas)
        p.proceso.emit('SIGTERM');
        jest.advanceTimersByTime(9999);
        expect(p.salir).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1);
        expect(p.salir).toHaveBeenCalledWith(1);
        jest.useRealTimers();
        p.restaurar();
    });
});
