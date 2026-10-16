// Datos de demostracion para que ningun modulo se vea vacio. Idempotente (findOrCreate).
// Uso: node scripts/seed-base.js && node scripts/seed-demo.js
const bcrypt = require('bcryptjs');
const db = require('../models');

const svg = (txt, bg) => 'data:image/svg+xml;base64,' + Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="${bg}"/>` +
    `<text x="200" y="215" font-family="Arial" font-size="34" fill="#fff" text-anchor="middle">${txt}</text></svg>`).toString('base64');

const get = async (Model, where, defaults = {}) => (await Model.findOrCreate({ where, defaults: { ...where, ...defaults } }))[0];

(async () => {
    try {
        const colores = {};
        for (const [n] of [['Blanco'], ['Negro'], ['Rojo'], ['Azul'], ['Gris']]) colores[n] = await get(db.Color, { Nombre: n });
        const tallas = {};
        for (const [n, p] of [['S', 0], ['M', 0], ['L', 2000], ['XL', 3000]]) tallas[n] = await get(db.Talla, { Nombre: n }, { Precio: p });
        const partes = {};
        for (const n of ['Pecho', 'Espalda', 'Manga izquierda', 'Manga derecha', 'Cuello']) partes[n] = await get(db.Parte, { Nombre: n });
        const tecnicas = {};
        for (const [n, d, bg] of [['Serigrafía', 'Estampado por capas de tinta, ideal para tirajes grandes', '#1e3a5f'], ['Bordado', 'Bordado a máquina de alta durabilidad', '#7c3aed'], ['Sublimación', 'Impresión full color para telas claras', '#0f766e']])
            tecnicas[n] = await get(db.Tecnica, { Nombre: n }, { Descripcion: d, imagenTecnica: svg(n, bg), Estado: true });
        const telas = {};
        for (const [n, pr, st] of [['Algodón 180g', 15000, 40], ['Jersey', 12000, 30], ['Poliéster', 10000, 25]])
            telas[n] = await get(db.Insumo, { Nombre: n }, { Tipo: 'Tela', Stock: st, Estado: true, PrecioTela: pr });
        for (const [n, st] of [['Hilo negro', 80], ['Tinta blanca', 20], ['Etiquetas', 200]])
            await get(db.Insumo, { Nombre: n }, { Tipo: 'Insumo', Stock: st, Estado: true });
        const prov = await get(db.Proveedor, { Nit: '900123456' }, { Nombre: 'Textiles del Valle SAS', Correo: 'ventas@textilesvalle.com', Telefono: '3001234567', Direccion: 'Cra 10 # 20-30, Cali', Estado: true });
        await get(db.Proveedor, { Nit: '800765432' }, { Nombre: 'Insumos y Tintas Ltda', Correo: 'contacto@insumostintas.com', Telefono: '3109876543', Direccion: 'Calle 5 # 8-12, Bogotá', Estado: true });

        const prods = [
            ['Camiseta Básica', 'Camiseta 100% algodón, ideal para estampar', 25000, '#1e3a5f', ['Blanco', 'Negro', 'Rojo'], ['S', 'M', 'L', 'XL'], 'Algodón 180g'],
            ['Camiseta Oversize', 'Corte amplio, tela jersey suave', 35000, '#0f766e', ['Negro', 'Gris'], ['M', 'L', 'XL'], 'Jersey'],
            ['Polo Deportivo', 'Polo en poliéster de secado rápido', 30000, '#b91c1c', ['Azul', 'Blanco'], ['S', 'M', 'L'], 'Poliéster'],
        ];
        for (const [nom, desc, precio, bg, cols, tals, tela] of prods) {
            const p = await get(db.Producto, { Nombre: nom }, { Descripcion: desc, PrecioBase: precio, ImagenProducto: svg(nom, bg) });
            for (const c of cols) for (const t of tals) {
                await db.InventarioProducto.findOrCreate({
                    where: { ProductoID: p.ProductoID, ColorID: colores[c].ColorID, TallaID: tallas[t].TallaID, TelaID: telas[tela].InsumoID },
                    defaults: { Stock: 25, Estado: true },
                });
            }
        }
        const [cli] = await db.Usuario.findOrCreate({
            where: { Correo: 'cliente@stamplab.com' },
            defaults: { DocumentoID: '1000000002', Nombre: 'Cliente Demo', Telefono: '3011112222', Direccion: 'Calle 1 # 2-3', Contraseña: await bcrypt.hash('Cliente123*', 10), RolID: 2 },
        });
        console.log('Seed demo OK. Cliente demo:', cli.Correo);
        process.exit(0);
    } catch (e) { console.error('Seed demo fallo:', e.message); process.exit(1); }
})();
