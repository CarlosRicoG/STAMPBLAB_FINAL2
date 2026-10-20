const { contieneHtml, sinSecretos } = require('../middleware/saneamiento');
const { normalizarNombre } = require('../utils/nombres');

describe('Saneamiento de la API', () => {
    test('detecta etiquetas HTML en cualquier parte del cuerpo', () => {
        expect(contieneHtml({ Nombre: '<img src=x onerror=alert(1)>' })).toBe(true);
        expect(contieneHtml({ a: { b: ['ok', '<script>x</script>'] } })).toBe(true);
        expect(contieneHtml({ Nombre: '</div>' })).toBe(true);
    });

    test('no confunde texto normal con HTML', () => {
        expect(contieneHtml({ Nombre: 'Camiseta 5 < 6 y 7 > 3', Obs: 'Logo en el pecho, 8 cm' })).toBe(false);
        expect(contieneHtml({ Nombre: 'Ñandú & Cía' })).toBe(false);
    });

    test('las contraseñas pueden llevar cualquier símbolo', () => {
        expect(contieneHtml({ Contraseña: 'Ab1<a>cdef' })).toBe(false);
    });

    test('las respuestas nunca llevan hashes ni datos de sesión, ni anidados', () => {
        const salida = sinSecretos({ id: 1, usuario: { Nombre: 'Ana', Contraseña: '$2b$10$xx', SesionesVersion: 3 }, lista: [{ Contraseña: 'x', ok: true }] });
        expect(JSON.stringify(salida)).not.toMatch(/Contraseña|SesionesVersion|\$2b/);
        expect(salida.usuario.Nombre).toBe('Ana');
        expect(salida.lista[0].ok).toBe(true);
    });
});

describe('Comparación de nombres', () => {
    test('ignora mayúsculas, tildes y espacios de más', () => {
        expect(normalizarNombre(' SERIGRAFÍA ')).toBe(normalizarNombre('serigrafia'));
        expect(normalizarNombre('Algodón   180g')).toBe(normalizarNombre('algodon 180G'));
    });
});
