// Datos base que el codigo da por existentes (IDs fijos). Seguro de repetir (upsert).
// Uso: node scripts/seed-base.js   (opcional: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_DOC)
const bcrypt = require('bcryptjs');
const db = require('../models');
const { ESTADOS_SEED } = require('../config/estados');

const ROLES = [
    { RolID: 1, Nombre: 'Administrador', Descripcion: 'Acceso total al dashboard', Estado: true },
    { RolID: 2, Nombre: 'Cliente', Descripcion: 'Usuario de la tienda', Estado: true },
];

// Los IDs viven en config/estados.js (fuente unica)
const ESTADOS = ESTADOS_SEED;

(async () => {
    try {
        for (const r of ROLES) await db.Rol.upsert(r);
        for (const e of ESTADOS) await db.Estado.upsert(e);

        const Correo = process.env.ADMIN_EMAIL || 'admin@stamplab.com';
        const pass = process.env.ADMIN_PASSWORD || 'Admin123*';
        if (process.env.NODE_ENV === 'production' && (!process.env.ADMIN_PASSWORD || pass === 'Admin123*')) {
            console.error('Seed cancelado: en produccion define ADMIN_PASSWORD (distinta a la clave de ejemplo).');
            process.exit(1);
        }
        if (pass.length < 8) { console.error('ADMIN_PASSWORD debe tener al menos 8 caracteres.'); process.exit(1); }
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
