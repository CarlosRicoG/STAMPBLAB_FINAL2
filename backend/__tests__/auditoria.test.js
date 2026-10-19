jest.mock('../models', () => ({ Auditoria: { create: jest.fn() } }));
const { resumir, idCreado } = require('../services/auditoria');

describe('Auditoría: resumir (no debe filtrar secretos)', () => {
    test('redacta contraseñas, tokens, comprobantes e imágenes por el nombre del campo', () => {
        const r = resumir({ Nombre: 'Ana', Contraseña: 'secreta1', nuevaContraseña: 'x', token: 'abc', comprobanteTransferencia: 'data:...', ImagenProducto: 'data:image/png;base64,AAA', password: 'p' });
        expect(r.Nombre).toBe('Ana');
        for (const k of ['Contraseña', 'nuevaContraseña', 'token', 'comprobanteTransferencia', 'ImagenProducto', 'password']) expect(r[k]).toBe('***');
        expect(JSON.stringify(r)).not.toMatch(/secreta1|abc|AAA/);
    });
    test('redacta también dentro de objetos y listas anidados', () => {
        const r = resumir({ detalles: [{ Cantidad: 1, imagen: 'zzz' }], usuario: { contrasena: 'q' } });
        expect(JSON.stringify(r)).not.toMatch(/zzz|"q"/);
    });
    test('recorta textos largos y resume listas grandes', () => {
        const r = resumir({ texto: 'x'.repeat(500), lista: Array.from({ length: 20 }, (_, i) => i) });
        expect(r.texto.length).toBeLessThan(130);
        expect(r.lista.length).toBe(6); // 5 elementos + "… +15"
        expect(r.lista[5]).toBe('… +15');
    });
    test('valores nulos y primitivos pasan sin romper', () => {
        expect(resumir(null)).toBeNull();
        expect(resumir(5)).toBe(5);
        expect(resumir(undefined)).toBeUndefined();
    });
});

describe('Auditoría: idCreado (qué se creó)', () => {
    test('toma la clave primaria del objeto creado', () => {
        expect(idCreado({ message: 'ok', venta: { VentaID: 42, DocumentoID: 1 } })).toBe('42');
        expect(idCreado({ estado: true, color: { ColorID: 8, Nombre: 'x' } })).toBe('8');
        expect(idCreado({ datos: { ProductoID: '7' } })).toBe('7');
    });
    test('sin ID en la respuesta devuelve null', () => {
        expect(idCreado({ message: 'ok' })).toBeNull();
        expect(idCreado(null)).toBeNull();
        expect(idCreado('texto')).toBeNull();
    });
});
