// Correcciones de seguridad: secreto JWT obligatorio en producción y visor de imágenes sin salida de carpeta
const path = require('path');

describe('config/jwt', () => {
    const entorno = { ...process.env };
    afterEach(() => { process.env = { ...entorno }; jest.resetModules(); });

    test('en producción sin JWT_SECRET no arranca', () => {
        process.env.NODE_ENV = 'production';
        delete process.env.JWT_SECRET;
        expect(() => jest.isolateModules(() => require('../config/jwt'))).toThrow(/JWT_SECRET/);
    });

    test('en producción con el valor de ejemplo tampoco arranca', () => {
        process.env.NODE_ENV = 'production';
        process.env.JWT_SECRET = 'cambiar';
        expect(() => jest.isolateModules(() => require('../config/jwt'))).toThrow(/JWT_SECRET/);
    });

    test('en producción con un secreto real funciona', () => {
        process.env.NODE_ENV = 'production';
        process.env.JWT_SECRET = 'x'.repeat(48);
        let secreto;
        jest.isolateModules(() => { secreto = require('../config/jwt'); });
        expect(secreto).toBe('x'.repeat(48));
    });
});

describe('getImagenDiseno', () => {
    jest.mock('../models', () => ({ sequelize: {} }));
    const controller = require('../controllers/cotizacionController');
    const mockRes = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        res.sendFile = jest.fn();
        return res;
    };

    test.each(['../../server.js', '..\\..\\server.js', '../../.env', 'a/b.png'])('rechaza el nombre %s', async (nombre) => {
        const res = mockRes();
        await controller.getImagenDiseno({ params: { filename: nombre } }, res);
        expect(res.sendFile).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('un archivo inexistente da 404', async () => {
        const res = mockRes();
        await controller.getImagenDiseno({ params: { filename: 'no-existe.png' } }, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('un archivo de la carpeta de diseños se sirve', async () => {
        const fs = require('fs');
        const carpeta = path.resolve(__dirname, '..', 'uploads', 'disenos');
        const nombre = `test-${Date.now()}.png`;
        fs.mkdirSync(carpeta, { recursive: true });
        fs.writeFileSync(path.join(carpeta, nombre), 'x');
        try {
            const res = mockRes();
            await controller.getImagenDiseno({ params: { filename: nombre } }, res);
            expect(res.sendFile).toHaveBeenCalledWith(path.join(carpeta, nombre));
        } finally { fs.unlinkSync(path.join(carpeta, nombre)); }
    });
});
