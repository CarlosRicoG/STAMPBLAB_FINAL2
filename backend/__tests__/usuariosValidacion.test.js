// Validación (Joi) de crear y editar usuario: mismas reglas que el registro, sin romper lo que envían el panel y "Mis datos"
const { esquemas } = require('../middleware/validar');

const opciones = { abortEarly: false, allowUnknown: true, convert: true };
const crear = (cuerpo) => esquemas.usuarioCreacion.validate(cuerpo, opciones);
const editar = (cuerpo) => esquemas.usuarioEdicion.validate(cuerpo, opciones);

// Lo que envía hoy el formulario del panel (UsuariosForm / ClientesForm)
const delPanel = (extra = {}) => ({
    DocumentoID: '1023456789', Nombre: 'María Pérez', Correo: 'maria@mail.com',
    Telefono: '3001234567', Direccion: 'Calle 1 # 2-3', RolID: '2', Contraseña: 'Segura1234', ...extra,
});

describe('usuarioCreacion', () => {
    test('acepta lo que envía el panel', () => {
        const { error, value } = crear(delPanel());
        expect(error).toBeUndefined();
        expect(value.RolID).toBe(2);
    });

    test('exige documento, nombre, correo, contraseña y rol', () => {
        for (const campo of ['DocumentoID', 'Nombre', 'Correo', 'Contraseña', 'RolID']) {
            const cuerpo = delPanel(); delete cuerpo[campo];
            expect(crear(cuerpo).error).toBeDefined();
        }
    });

    test('rechaza datos inválidos', () => {
        expect(crear(delPanel({ Correo: 'no-es-correo' })).error).toBeDefined();
        expect(crear(delPanel({ DocumentoID: 'abc' })).error).toBeDefined();
        expect(crear(delPanel({ Telefono: 'llámame' })).error).toBeDefined();
        expect(crear(delPanel({ Nombre: '<script>' })).error).toBeDefined();
        expect(crear(delPanel({ Nombre: 'x'.repeat(101) })).error).toBeDefined();
        expect(crear(delPanel({ Direccion: 'x'.repeat(256) })).error).toBeDefined();
        expect(crear(delPanel({ RolID: 'admin' })).error).toBeDefined();
    });

    test('contraseña: misma política que el registro', () => {
        for (const clave of ['1234', 'soloLetrasLargas', '123456789012', '']) {
            expect(crear(delPanel({ Contraseña: clave })).error).toBeDefined();
        }
    });

    test('teléfono y dirección son opcionales', () => {
        expect(crear(delPanel({ Telefono: '', Direccion: '' })).error).toBeUndefined();
        expect(crear(delPanel({ Telefono: undefined, Direccion: null })).error).toBeUndefined();
    });
});

describe('usuarioEdicion', () => {
    test('acepta lo que envía "Mis datos" (sin contraseña) y con contraseña nueva', () => {
        const misDatos = { Nombre: 'Cliente Demo', Correo: 'cliente@stamplab.com', Telefono: '3001112222', Direccion: 'x' };
        expect(editar(misDatos).error).toBeUndefined();
        expect(editar({ ...misDatos, Contraseña: 'Nueva12345' }).error).toBeUndefined();
    });

    test('acepta lo que envía el panel al editar (con documento y rol, contraseña vacía o ausente)', () => {
        expect(editar(delPanel({ Contraseña: undefined })).error).toBeUndefined();
        expect(editar(delPanel({ Contraseña: '' })).error).toBeUndefined();
    });

    test('todos los campos son opcionales (edición parcial)', () => {
        expect(editar({}).error).toBeUndefined();
        expect(editar({ Telefono: '3112223333', Nombre: 'Cliente Demo' }).error).toBeUndefined();
    });

    test('rechaza datos inválidos y contraseñas débiles', () => {
        expect(editar({ Correo: 'no-es-correo' }).error).toBeDefined();
        expect(editar({ Nombre: '<img src=x>' }).error).toBeDefined();
        expect(editar({ Nombre: '' }).error).toBeDefined();
        expect(editar({ Telefono: '1'.repeat(30) }).error).toBeDefined();
        expect(editar({ Direccion: 'x'.repeat(256) }).error).toBeDefined();
        expect(editar({ RolID: 'admin' }).error).toBeDefined();
        for (const clave of ['abc', 'soloLetrasLargas', '123456789012']) expect(editar({ Contraseña: clave }).error).toBeDefined();
    });
});

describe('rutas de usuarios: validan antes del controlador', () => {
    jest.mock('../models', () => ({ SesionRevocada: {}, Usuario: {}, Rol: {} }));
    const router = require('../routes/usuarios');
    const capa = (metodo, ruta) => router.stack.find((c) => c.route?.path === ruta && c.route.methods[metodo]);
    const nombres = (c) => c.route.stack.map((s) => s.name);

    test('POST / y PUT /:id incluyen el validador', () => {
        expect(nombres(capa('post', '/'))).toContain('validarCuerpo');
        expect(nombres(capa('put', '/:id'))).toContain('validarCuerpo');
        // En la edición, primero se quitan rol y documento al cliente y después se valida
        const put = nombres(capa('put', '/:id'));
        expect(put.indexOf('sinCambiarRol')).toBeLessThan(put.indexOf('validarCuerpo'));
    });
});
