// Datos base que el codigo da por existentes (IDs fijos). Seguro de repetir (upsert).
// Uso: node scripts/seed-base.js   (opcional: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_DOC)
const bcrypt = require('bcryptjs');
const db = require('../models');

const ROLES = [
    { RolID: 1, Nombre: 'Administrador', Descripcion: 'Acceso total al dashboard', Estado: true },
    { RolID: 2, Nombre: 'Cliente', Descripcion: 'Usuario de la tienda', Estado: true },
];

// Los IDs estan fijados en controllers/frontend: cotizacion 1-7, venta 8-13 (11 = Entregada, 12 = Cancelada: los usan ventaController y el front).
const ESTADOS = [
    { EstadoID: 1, Nombre: 'Pendiente', Tipo: 'cotizacion', Descripcion: 'Cotizacion recibida, esperando revision' },
    { EstadoID: 2, Nombre: 'Aprobada', Tipo: 'cotizacion', Descripcion: 'Cotizacion aprobada (stock reservado)' },
    { EstadoID: 3, Nombre: 'Rechazada', Tipo: 'cotizacion', Descripcion: 'Cotizacion rechazada' },
    { EstadoID: 4, Nombre: 'Cancelada', Tipo: 'cotizacion', Descripcion: 'Cotizacion cancelada' },
    { EstadoID: 5, Nombre: 'Procesada', Tipo: 'cotizacion', Descripcion: 'Cotizacion convertida a venta' },
    { EstadoID: 6, Nombre: 'En revision', Tipo: 'cotizacion', Descripcion: 'Cotizacion en revision' },
    { EstadoID: 7, Nombre: 'Vencida', Tipo: 'cotizacion', Descripcion: 'Cotizacion vencida' },
        { EstadoID: 8, Nombre: 'Pendiente', Tipo: 'venta', Descripcion: 'Venta registrada, pendiente de procesar' },
    { EstadoID: 9, Nombre: 'Pagada', Tipo: 'venta', Descripcion: 'Pago confirmado' },
    { EstadoID: 10, Nombre: 'En Producción', Tipo: 'venta', Descripcion: 'Pedido en proceso de producción' },
    { EstadoID: 11, Nombre: 'Entregada', Tipo: 'venta', Descripcion: 'Pedido entregado al cliente' },
    { EstadoID: 12, Nombre: 'Cancelada', Tipo: 'venta', Descripcion: 'Venta cancelada (devuelve stock si estaba pendiente)' },
    { EstadoID: 13, Nombre: 'Lista para Entrega', Tipo: 'venta', Descripcion: 'Pedido listo para entregar' },
];

(async () => {
    try {
        for (const r of ROLES) await db.Rol.upsert(r);
        for (const e of ESTADOS) await db.Estado.upsert(e);

        const Correo = process.env.ADMIN_EMAIL || 'admin@stamplab.com';
        const pass = process.env.ADMIN_PASSWORD || 'Admin123*';
        const [u] = await db.Usuario.findOrCreate({
            where: { Correo },
            defaults: {
                DocumentoID: process.env.ADMIN_DOC || '1000000001', Nombre: 'Administrador',
                Telefono: '3000000000', Direccion: 'Sede principal',
                Contraseña: await bcrypt.hash(pass, 10), RolID: 1,
            },
        });
        console.log(`Seed OK. Admin: ${u.Correo} (RolID ${u.RolID})`);
        process.exit(0);
    } catch (e) { console.error('Seed fallo:', e.message); process.exit(1); }
})();
