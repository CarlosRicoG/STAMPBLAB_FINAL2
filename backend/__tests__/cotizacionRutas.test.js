// Rutas de cotizaciones: comprobación de técnicas y partes del cliente con UNA consulta por tabla (no 2 por diseño)
jest.mock('../models', () => ({
    Cotizacion: { findByPk: jest.fn() },
    Tecnica: { findAll: jest.fn(), findByPk: jest.fn() },
    Parte: { findAll: jest.fn(), findByPk: jest.fn() },
    SesionRevocada: { destroy: jest.fn().mockResolvedValue(0), findAll: jest.fn().mockResolvedValue([]) },
    Usuario: { findAll: jest.fn().mockResolvedValue([]) },
}));

const { Tecnica, Parte } = require('../models');
const { cotizacionDelCliente } = require('../routes/cotizaciones');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
const cliente = { id: 555, rol: 2 };
const disenos = (n, extra = {}) => Array.from({ length: n }, (_, i) => ({ TecnicaID: (i % 3) + 1, ParteID: (i % 2) + 1, ...extra }));

beforeEach(() => {
    jest.clearAllMocks();
    Tecnica.findAll.mockResolvedValue([{ TecnicaID: 1 }, { TecnicaID: 2 }, { TecnicaID: 3 }]);
    Parte.findAll.mockResolvedValue([{ ParteID: 1 }, { ParteID: 2 }]);
});

describe('cotizacionDelCliente', () => {
    test('valida todas las técnicas y partes con una sola consulta por tabla', async () => {
        const req = { usuario: cliente, body: { detalles: [{ Cantidad: 1, tecnicas: disenos(10) }, { Cantidad: 1, tecnicas: disenos(10) }] } };
        const next = jest.fn();
        await cotizacionDelCliente(req, mockRes(), next);
        expect(next).toHaveBeenCalledWith();
        expect(Tecnica.findAll).toHaveBeenCalledTimes(1);
        expect(Parte.findAll).toHaveBeenCalledTimes(1);
        expect(Tecnica.findByPk).not.toHaveBeenCalled();
        expect(Parte.findByPk).not.toHaveBeenCalled();
        expect(Tecnica.findAll.mock.calls[0][0].where.TecnicaID.sort()).toEqual([1, 2, 3]);
        expect(req.body.DocumentoID).toBe(555);
        expect(req.body.detalles[0].tecnicas.every((t) => t.CostoTecnica === 0)).toBe(true);
    });

    test('400 si alguna técnica o parte no existe', async () => {
        Parte.findAll.mockResolvedValue([{ ParteID: 1 }]);
        const res = mockRes(); const next = jest.fn();
        await cotizacionDelCliente({ usuario: cliente, body: { detalles: [{ Cantidad: 1, tecnicas: disenos(2) }] } }, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    test('400 si un diseño no trae técnica o parte', async () => {
        const res = mockRes(); const next = jest.fn();
        await cotizacionDelCliente({ usuario: cliente, body: { detalles: [{ Cantidad: 1, tecnicas: [{ TecnicaID: 1 }] }] } }, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    test('sin diseños no consulta la base', async () => {
        const next = jest.fn();
        await cotizacionDelCliente({ usuario: cliente, body: { detalles: [{ Cantidad: 1 }] } }, mockRes(), next);
        expect(next).toHaveBeenCalledWith();
        expect(Tecnica.findAll).not.toHaveBeenCalled();
    });

    test('el administrador no pasa por estas comprobaciones', async () => {
        const next = jest.fn();
        await cotizacionDelCliente({ usuario: { id: 1, rol: 1 }, body: { detalles: [{ tecnicas: disenos(3) }] } }, mockRes(), next);
        expect(next).toHaveBeenCalledWith();
        expect(Tecnica.findAll).not.toHaveBeenCalled();
    });
});

describe('upload-diseno: límite de subidas por usuario y hora', () => {
    const express = require('express');
    const { crearLimiteDisenos } = require('../routes/cotizaciones');
    let servidor, url;
    beforeAll(async () => {
        const antes = process.env.DISENOS_MAX_HORA;
        process.env.DISENOS_MAX_HORA = '2';
        const limite = crearLimiteDisenos();
        if (antes === undefined) delete process.env.DISENOS_MAX_HORA; else process.env.DISENOS_MAX_HORA = antes;
        const app = express();
        app.use((req, res, next) => { req.usuario = { id: req.headers['x-usuario'], rol: req.headers['x-usuario'] === 'admin' ? 1 : 2 }; next(); });
        app.post('/subir', limite, (req, res) => res.json({ ok: true }));
        await new Promise((r) => { servidor = app.listen(0, '127.0.0.1', r); });
        url = `http://127.0.0.1:${servidor.address().port}/subir`;
    });
    afterAll(() => new Promise((r) => servidor.close(r)));
    const subir = (usuario) => fetch(url, { method: 'POST', headers: { 'x-usuario': usuario } }).then((r) => r.status);

    test('pasado el máximo (DISENOS_MAX_HORA) responde 429, contado por usuario y no por IP', async () => {
        expect(await subir('ana')).toBe(200);
        expect(await subir('ana')).toBe(200);
        expect(await subir('ana')).toBe(429);
        expect(await subir('luis')).toBe(200); // misma IP, otro usuario
    });

    test('el administrador no tiene límite', async () => {
        for (let i = 0; i < 5; i++) expect(await subir('admin')).toBe(200);
    });
});
