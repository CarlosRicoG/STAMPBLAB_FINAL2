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
