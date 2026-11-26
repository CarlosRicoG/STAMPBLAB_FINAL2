// Limpieza periódica de imágenes de diseño huérfanas (subidas con /upload-diseno y nunca usadas en una cotización)
jest.mock('../models', () => ({ CotizacionTecnica: { findAll: jest.fn() } }));

const fs = require('fs');
const os = require('os');
const path = require('path');
const db = require('../models');
const limpieza = require('../services/limpiezaDisenos');

const HORA = 3600 * 1000;
const ahora = Date.parse('2026-11-26T12:00:00Z');

describe('seleccionarHuerfanos (regla pura)', () => {
    const archivos = [
        { nombre: 'viejo-sin-uso.png', mtimeMs: ahora - 30 * HORA },
        { nombre: 'viejo-usado.png', mtimeMs: ahora - 30 * HORA },
        { nombre: 'nuevo-sin-uso.png', mtimeMs: ahora - 2 * HORA },
        { nombre: 'usado-con-url.webp', mtimeMs: ahora - 99 * HORA },
        { nombre: 'usado-con-ruta.jpg', mtimeMs: ahora - 99 * HORA },
        { nombre: '.gitkeep', mtimeMs: ahora - 999 * HORA },
    ];
    const referencias = ['viejo-usado.png', 'http://api.x.com/api/cotizaciones/imagen/usado-con-url.webp', '/uploads/disenos/usado-con-ruta.jpg', '', null];

    test('solo los que tienen más de N horas y ninguna fila referencia (por nombre, URL o ruta)', () => {
        expect(limpieza.seleccionarHuerfanos(archivos, referencias, { ahora, horas: 24 })).toEqual(['viejo-sin-uso.png']);
    });

    test('la antigüedad es configurable', () => {
        expect(limpieza.seleccionarHuerfanos(archivos, referencias, { ahora, horas: 1 }).sort()).toEqual(['nuevo-sin-uso.png', 'viejo-sin-uso.png']);
        expect(limpieza.seleccionarHuerfanos(archivos, referencias, { ahora, horas: 48 })).toEqual([]);
    });

    test('nunca selecciona archivos ocultos ni nombres que no son de subida', () => {
        expect(limpieza.seleccionarHuerfanos([{ nombre: '.env', mtimeMs: 0 }, { nombre: 'a b.png', mtimeMs: 0 }], [], { ahora, horas: 24 })).toEqual([]);
    });
});

describe('limpiar (disco + base)', () => {
    let dir;
    const crear = (nombre, horasAtras) => {
        const f = path.join(dir, nombre);
        fs.writeFileSync(f, 'x');
        const t = new Date(ahora - horasAtras * HORA);
        fs.utimesSync(f, t, t);
    };
    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'disenos-'));
        crear('huerfano.png', 30); crear('usado.png', 30); crear('reciente.png', 1);
        fs.mkdirSync(path.join(dir, 'subcarpeta'));
    });
    afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

    test('borra solo los huérfanos viejos', async () => {
        db.CotizacionTecnica.findAll.mockResolvedValue([{ 'ImagenDiseño': 'usado.png' }]);
        const borrados = await limpieza.limpiar({ dir, ahora, horas: 24 });
        expect(borrados).toEqual(['huerfano.png']);
        expect(fs.readdirSync(dir).sort()).toEqual(['reciente.png', 'subcarpeta', 'usado.png']);
    });

    test('si la base falla no borra nada', async () => {
        db.CotizacionTecnica.findAll.mockRejectedValue(new Error('base caída'));
        await expect(limpieza.limpiar({ dir, ahora, horas: 24 })).rejects.toThrow();
        expect(fs.readdirSync(dir).length).toBe(4);
    });

    test('si la base no referencia ninguna imagen y hay candidatos, no borra nada y avisa', async () => {
        db.CotizacionTecnica.findAll.mockResolvedValue([]);
        const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
        expect(await limpieza.limpiar({ dir, ahora, horas: 24 })).toEqual([]);
        expect(aviso).toHaveBeenCalled();
        aviso.mockRestore();
        expect(fs.readdirSync(dir).length).toBe(4);
    });

    test('borra como mucho el tope por ronda', async () => {
        for (let i = 0; i < 5; i++) crear(`viejo-${i}.png`, 30);
        db.CotizacionTecnica.findAll.mockResolvedValue([{ 'ImagenDiseño': 'usado.png' }]);
        const borrados = await limpieza.limpiar({ dir, ahora, horas: 24, maximo: 3 });
        expect(borrados.length).toBe(3);
        expect(fs.readdirSync(dir).length).toBe(4 + 5 - 3);
    });

    test('el tope por defecto es 200', async () => {
        for (let i = 0; i < 205; i++) crear(`lote-${i}.png`, 30);
        db.CotizacionTecnica.findAll.mockResolvedValue([{ 'ImagenDiseño': 'usado.png' }]);
        expect((await limpieza.limpiar({ dir, ahora, horas: 24 })).length).toBe(200);
    });

    test('la carpeta no existe: no hace nada', async () => {
        db.CotizacionTecnica.findAll.mockResolvedValue([]);
        expect(await limpieza.limpiar({ dir: path.join(dir, 'no-existe'), ahora, horas: 24 })).toEqual([]);
    });
});

describe('horas configurables por entorno', () => {
    test('DISENOS_HUERFANOS_HORAS, 24 por defecto', () => {
        const antes = process.env.DISENOS_HUERFANOS_HORAS;
        try {
            delete process.env.DISENOS_HUERFANOS_HORAS;
            expect(limpieza.horasHuerfanos()).toBe(24);
            process.env.DISENOS_HUERFANOS_HORAS = '6';
            expect(limpieza.horasHuerfanos()).toBe(6);
            process.env.DISENOS_HUERFANOS_HORAS = 'basura';
            expect(limpieza.horasHuerfanos()).toBe(24);
        } finally {
            if (antes === undefined) delete process.env.DISENOS_HUERFANOS_HORAS; else process.env.DISENOS_HUERFANOS_HORAS = antes;
        }
    });
});
