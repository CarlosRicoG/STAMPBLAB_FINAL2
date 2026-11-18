const { errorDeComprobante } = require('../utils/comprobante');

const dataUrl = (tipo, bytes) => `data:${tipo};base64,${Buffer.from(bytes).toString('base64')}`;
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40)]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(40)]);
const PDF = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(40)]);

describe('Comprobante de transferencia (validación en el servidor)', () => {
    test('acepta PNG, JPG y PDF reales', () => {
        expect(errorDeComprobante(dataUrl('image/png', PNG))).toBe('');
        expect(errorDeComprobante(dataUrl('image/jpeg', JPG))).toBe('');
        expect(errorDeComprobante(dataUrl('application/pdf', PDF))).toBe('');
    });

    test('vacío o no texto: pide adjuntarlo', () => {
        for (const v of ['', '   ', null, undefined, 123, {}]) expect(errorDeComprobante(v)).toMatch(/adjuntar/);
    });

    test('rechaza URLs externas y texto libre', () => {
        expect(errorDeComprobante('https://atacante.tld/recibo.png')).toMatch(/imagen/);
        expect(errorDeComprobante('javascript:alert(1)')).toMatch(/imagen/);
        expect(errorDeComprobante('ya pagué')).toMatch(/imagen/);
    });

    test('rechaza tipos no permitidos (html, svg)', () => {
        expect(errorDeComprobante(dataUrl('text/html', Buffer.from('<script>')))).toMatch(/imagen/);
        expect(errorDeComprobante(dataUrl('image/svg+xml', Buffer.from('<svg/>')))).toMatch(/imagen/);
    });

    test('rechaza contenido que no coincide con el tipo declarado', () => {
        expect(errorDeComprobante(dataUrl('image/png', Buffer.alloc(60, 1)))).toMatch(/no es un archivo válido/);
        expect(errorDeComprobante(dataUrl('application/pdf', PNG))).toMatch(/no es un archivo válido/);
    });

    test('rechaza archivos de más de 5 MB', () => {
        const grande = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]);
        expect(errorDeComprobante(dataUrl('image/png', grande))).toMatch(/5 MB/);
    });
});
