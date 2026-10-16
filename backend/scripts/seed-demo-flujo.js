// Movimientos de ejemplo (compras, ventas, cotizaciones) usando la API real, para que dashboards y listados tengan datos.
// Requiere el backend corriendo y haber ejecutado seed-base + seed-demo.  Uso: node scripts/seed-demo-flujo.js
const API = process.env.API_URL || 'http://127.0.0.1:3000/api';
const call = async (m, p, b, tk) => {
    const r = await fetch(API + p, { method: m, headers: { 'Content-Type': 'application/json', ...(tk ? { Authorization: 'Bearer ' + tk } : {}) }, body: b ? JSON.stringify(b) : undefined });
    const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; } return { s: r.status, j };
};
const all = (r) => r.j?.datos ?? r.j;

(async () => {
    const login = await call('POST', '/login', { Correo: 'admin@stamplab.com', 'Contraseña': process.env.ADMIN_PASSWORD || 'Admin123*' });
    if (!login.j.token) throw new Error('No se pudo iniciar sesion como admin');
    const tk = login.j.token;
    const ventas = await call('GET', '/ventas?limit=1&page=1');
    if ((ventas.j.total ?? all(ventas).length) > 0) { console.log('Ya hay ventas; no se agregan datos de ejemplo.'); return; }

    const productos = all(await call('GET', '/productos'));
    const prov = all(await call('GET', '/proveedores'))[0];
    const tecnica = all(await call('GET', '/tecnicas'))[0], parte = all(await call('GET', '/partes'))[0];
    const cliente = '1000000002';

    const variantes = async (p) => all(await call('GET', '/inventarioproducto/producto/' + p.ProductoID));
    const v1 = (await variantes(productos[0]))[0], v2 = (await variantes(productos[1]))[0];

    const ok = (n, r) => console.log((r.s < 300 ? 'OK   ' : 'FAIL ') + n + (r.s < 300 ? '' : ' ' + JSON.stringify(r.j).slice(0, 200)));
    const det = (p, v, q) => ({ ProductoID: p.ProductoID, ColorID: v.ColorID, TallaID: v.TallaID, TelaID: v.TelaID, InventarioID: v.InventarioID, Cantidad: q, PrecioUnitario: Number(p.PrecioBase) });

    ok('compra producto', await call('POST', '/compras', { ProveedorRefId: prov.id, detalles: [{ TipoSeleccion: 'producto', ...det(productos[0], v1, 10), PrecioUnitario: 12000, PrecioVenta: Number(productos[0].PrecioBase) }] }));
    ok('compra insumo', await call('POST', '/compras', { ProveedorRefId: prov.id, detalles: [{ TipoSeleccion: 'insumo', InsumoID: 4, Cantidad: 20, PrecioUnitario: 800 }] }));

    const v = await call('POST', '/ventas', { DocumentoID: cliente, Subtotal: 50000, Total: 50000, EstadoID: 8, metodoPago: 'contraentrega', nombreReceptor: 'Cliente Demo', telefonoEntrega: '3011112222', direccionEntrega: 'Calle 1 # 2-3', detalles: [det(productos[0], v1, 2)] });
    ok('venta pendiente', v);
    const v2r = await call('POST', '/ventas', { DocumentoID: cliente, Subtotal: 105000, Total: 105000, EstadoID: 9, detalles: [det(productos[1], v2, 3)] });
    ok('venta pagada', v2r);
    const v3 = await call('POST', '/ventas', { DocumentoID: cliente, Subtotal: 35000, Total: 35000, EstadoID: 8, detalles: [det(productos[1], v2, 1)] });
    if (v3.j.venta) ok('venta entregada', await call('PATCH', `/ventas/${v3.j.venta.VentaID}/estado`, { EstadoID: 11 }));

    const cot = (p, v, q) => ({ ProductoID: p.ProductoID, Cantidad: q, TraePrenda: false, PrendaDescripcion: '', tallas: [{ TallaID: v.TallaID, Cantidad: q, PrecioTalla: 0 }], colores: [{ ColorID: v.ColorID, Cantidad: q }], insumos: v.TelaID ? [{ InsumoID: v.TelaID, CantidadRequerida: q }] : [], tecnicas: [{ TecnicaID: tecnica.TecnicaID, ParteID: parte.ParteID, ImagenDiseño: '', Observaciones: 'Logo de la empresa', CostoTecnica: 0 }] });
    const c1 = await call('POST', '/cotizaciones/completa', { DocumentoID: Number(cliente), FechaCotizacion: new Date().toISOString(), ValorTotal: 0, EstadoID: 1, detalles: [cot(productos[0], v1, 5)] });
    ok('cotizacion pendiente', c1);
    const c2 = await call('POST', '/cotizaciones/completa', { DocumentoID: Number(cliente), FechaCotizacion: new Date().toISOString(), ValorTotal: 0, EstadoID: 1, detalles: [cot(productos[1], v2, 4)] });
    ok('cotizacion #2', c2);
    const id2 = c2.j.cotizacion?.CotizacionID ?? c2.j.CotizacionID ?? c2.j.datos?.CotizacionID;
    if (id2) {
        const g = await call('GET', '/cotizaciones/' + id2);
        for (const d of g.j.detalles || []) for (const t of d.tecnicas || []) await call('PUT', '/cotizaciontecnicas/' + t.CotizacionTecnicaID, { CostoTecnica: 8000 });
        ok('cotizacion aprobada', await call('PUT', '/cotizaciones/' + id2, { EstadoID: 2 }));
    }
    console.log('Seed de flujo listo.');
})().catch(e => { console.error('Fallo:', e.message); process.exit(1); });
