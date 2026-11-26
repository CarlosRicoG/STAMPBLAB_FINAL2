const { esquemas } = require('../middleware/validar');

const validar = (cuerpo) => esquemas.cotizacion.validate(cuerpo, { abortEarly: false, allowUnknown: true });
const detalle = (extra = {}) => ({ detalles: [{ Cantidad: 5, ...extra }] });

describe('Cotización: cantidades de insumo (tela)', () => {
    test('acepta una cantidad positiva', () => {
        expect(validar(detalle({ insumos: [{ InsumoID: 1, CantidadRequerida: 5 }] })).error).toBeUndefined();
    });

    test('acepta la cotización sin insumos', () => {
        expect(validar(detalle()).error).toBeUndefined();
        expect(validar(detalle({ insumos: [] })).error).toBeUndefined();
    });

    test('rechaza cantidades negativas o en cero (rebajarían el precio)', () => {
        expect(validar(detalle({ insumos: [{ InsumoID: 1, CantidadRequerida: -20 }] })).error).toBeDefined();
        expect(validar(detalle({ insumos: [{ InsumoID: 1, CantidadRequerida: 0 }] })).error).toBeDefined();
    });

    test('rechaza un insumo sin identificador', () => {
        expect(validar(detalle({ insumos: [{ CantidadRequerida: 2 }] })).error).toBeDefined();
    });
});

describe('Cotización: límites contra cuerpos enormes (DoS)', () => {
    const tecnica = (extra = {}) => ({ TecnicaID: 1, ParteID: 1, ...extra });
    test('acepta hasta 20 diseños por producto y rechaza más', () => {
        expect(validar(detalle({ tecnicas: Array.from({ length: 20 }, () => tecnica()) })).error).toBeUndefined();
        expect(validar(detalle({ tecnicas: Array.from({ length: 21 }, () => tecnica()) })).error).toBeDefined();
    });

    test('observaciones del diseño: hasta 1000 caracteres; vacías o nulas valen', () => {
        expect(validar(detalle({ tecnicas: [tecnica({ Observaciones: 'x'.repeat(1000) })] })).error).toBeUndefined();
        expect(validar(detalle({ tecnicas: [tecnica({ Observaciones: '' }), tecnica({ Observaciones: null })] })).error).toBeUndefined();
        expect(validar(detalle({ tecnicas: [tecnica({ Observaciones: 'x'.repeat(1001) })] })).error).toBeDefined();
    });

    test('descripción de la prenda: hasta 1000 caracteres', () => {
        expect(validar(detalle({ TraePrenda: true, PrendaDescripcion: 'x'.repeat(1000) })).error).toBeUndefined();
        expect(validar(detalle({ PrendaDescripcion: '' })).error).toBeUndefined();
        expect(validar(detalle({ PrendaDescripcion: 'x'.repeat(1001) })).error).toBeDefined();
    });

    test('nombre de la imagen del diseño: como mucho 255 caracteres (tamaño de la columna)', () => {
        expect(validar(detalle({ tecnicas: [tecnica({ 'ImagenDiseño': '123-456.png' })] })).error).toBeUndefined();
        expect(validar(detalle({ tecnicas: [tecnica({ 'ImagenDiseño': 'a'.repeat(256) })] })).error).toBeDefined();
    });
});
