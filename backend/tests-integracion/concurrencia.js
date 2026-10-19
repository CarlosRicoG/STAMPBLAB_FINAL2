/**
 * Concurrencia: peticiones SIMULTANEAS sobre el mismo stock. Reproduce los fallos reales que tuvo el sistema:
 *  - sobreventa (12 compradores a la vez sobre 3 unidades vendían 12, stock -9)
 *  - devolucion multiple de stock al cancelar el mismo pedido varias veces a la vez
 *  - convertir dos veces la misma cotizacion
 * Requisitos: backend corriendo (API_URL, por defecto http://127.0.0.1:3000/api) con la base de demostracion.
 * Usa la variante 1 (Producto 1, Color 1, Talla 1) y la deja como la encontro.
 */
const U = process.env.API_URL || 'http://127.0.0.1:3000/api';
const call = async (m, p, b, t) => {
    const r = await fetch(U + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined });
    let j; try { j = await r.json(); } catch { j = null; }
    return { s: r.status, j };
};
let bad = 0;
const si = (n, c, d = '') => { if (!c) bad++; console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (!c && d ? '  -> ' + d : '')); };

(async () => {
    const adm = (await call('POST', '/login', { Correo: 'admin@stamplab.com', 'Contraseña': 'Admin123*' })).j.token;
    const cli = (await call('POST', '/login', { Correo: 'cliente@stamplab.com', 'Contraseña': 'Cliente123*' })).j.token;
    const stock = async () => { const a = (await call('GET', '/inventarioproducto/1')).j; return a.Stock ?? a.datos?.Stock; };
    const fijarStock = (n) => call('PUT', '/inventarioproducto/1', { Stock: n, TelaID: 1, Estado: true }, adm);
    const original = await stock();
    const det = (q = 1) => [{ ProductoID: 1, ColorID: 1, TallaID: 1, Cantidad: q, PrecioUnitario: 25000, InventarioID: 1 }];
    const venta = (q = 1) => call('POST', '/ventas', { Subtotal: 25000 * q, Total: 25000 * q, detalles: det(q) }, cli);
    const limpiarVentas = async (lista) => { for (const r of lista) if (r.j?.venta) { await call('PATCH', `/ventas/${r.j.venta.VentaID}/cancelar`, null, adm); await call('DELETE', '/ventas/' + r.j.venta.VentaID, null, adm); } };

    try {
        console.log('--- 1. Sobreventa: 12 compradores simultáneos, 3 unidades');
        await fijarStock(3);
        const rondas = await Promise.all(Array.from({ length: 12 }, () => venta(1)));
        const ok = rondas.filter((r) => r.s === 201).length;
        const rechazadas = rondas.filter((r) => r.s === 400).length;
        const final = await stock();
        si(`se aceptan exactamente 3 ventas (aceptadas: ${ok})`, ok === 3);
        si(`las otras 9 se rechazan con 400 por falta de stock (rechazadas: ${rechazadas})`, rechazadas === 9);
        si(`el stock queda en 0 y nunca negativo (stock: ${final})`, final === 0);
        await limpiarVentas(rondas);

        console.log('--- 2. Pedido enorme y pequeños a la vez: nunca se cruzan');
        await fijarStock(5);
        const mezcla = await Promise.all([venta(4), venta(4), venta(1), venta(1), venta(1)]);
        const unidades = mezcla.filter((r) => r.s === 201).reduce((t, r) => t + Number(r.j.venta.Total) / 25000, 0);
        si(`las unidades vendidas (${unidades}) nunca superan el stock inicial (5)`, unidades <= 5);
        si(`el stock final cuadra: 5 - vendidas = ${5 - unidades} (stock: ${await stock()})`, (await stock()) === 5 - unidades);
        await limpiarVentas(mezcla);

        console.log('--- 3. Cancelar el MISMO pedido 8 veces a la vez');
        await fijarStock(10);
        const v = await venta(1);
        const antes = await stock();
        const cancel = await Promise.all(Array.from({ length: 8 }, () => call('PATCH', `/ventas/${v.j.venta.VentaID}/cancelar`, null, cli)));
        const despues = await stock();
        si(`el stock se devuelve UNA sola vez (${antes} -> ${despues}, esperado ${antes + 1})`, despues === antes + 1);
        si('solo una cancelación tuvo efecto; el resto avisa que ya estaba cancelada o es ignorada', cancel.filter((r) => r.s === 200 && r.j?.stockDevuelto === true).length === 1);
        await call('DELETE', '/ventas/' + v.j.venta.VentaID, null, adm);

        console.log('--- 4. Borrar el mismo pedido pendiente varias veces a la vez');
        await fijarStock(10);
        const v2 = await venta(2);
        const antes2 = await stock();
        const borrados = await Promise.all(Array.from({ length: 5 }, () => call('DELETE', '/ventas/' + v2.j.venta.VentaID, null, adm)));
        const despues2 = await stock();
        si(`el stock se devuelve una sola vez (${antes2} -> ${despues2}, esperado ${antes2 + 2})`, despues2 === antes2 + 2);
        si('solo un borrado tuvo éxito, los demás responden 404', borrados.filter((r) => r.s === 200).length === 1 && borrados.filter((r) => r.s === 404).length === 4);

        console.log('--- 5. Editar la misma venta a la vez (cada edición reemplaza a la anterior)');
        await fijarStock(10);
        const v3 = await venta(2);
        const ediciones = await Promise.all([1, 2, 3, 4].map((q) => call('PUT', '/ventas/' + v3.j.venta.VentaID, { EstadoID: 8, Subtotal: 25000 * q, Total: 25000 * q, detalles: det(q) }, adm)));
        const detalle = (await call('GET', '/ventas/' + v3.j.venta.VentaID, null, adm)).j;
        const unidadesVenta = (detalle.detalles || []).reduce((t, d) => t + d.Cantidad, 0);
        si(`el stock refleja exactamente lo que quedó en la venta (${unidadesVenta} uds -> stock ${await stock()}, esperado ${10 - unidadesVenta})`, (await stock()) === 10 - unidadesVenta);
        si('todas las ediciones respondieron sin error 500', ediciones.every((r) => r.s !== 500), ediciones.map((r) => r.s).join(','));
        await call('PATCH', `/ventas/${v3.j.venta.VentaID}/cancelar`, null, adm);
        await call('DELETE', '/ventas/' + v3.j.venta.VentaID, null, adm);

        console.log('--- 6. Convertir la MISMA cotización dos veces a la vez');
        await fijarStock(10);
        const te = (await call('GET', '/tecnicas')).j; const tecnicaID = (te.datos || te)[0].TecnicaID;
        const pa = (await call('GET', '/partes')).j; const parteID = (pa.datos || pa)[0].ParteID;
        const cot = await call('POST', '/cotizaciones/completa', { DocumentoID: 1000000002, FechaCotizacion: new Date().toISOString(), ValorTotal: 0, EstadoID: 1, detalles: [{ ProductoID: 1, Cantidad: 2, TraePrenda: false, tallas: [{ TallaID: 1, Cantidad: 2, PrecioTalla: 0 }], colores: [{ ColorID: 1, Cantidad: 2 }], insumos: [{ InsumoID: 1, CantidadRequerida: 2 }], tecnicas: [{ TecnicaID: tecnicaID, ParteID: parteID, ImagenDiseño: '', Observaciones: 'concurrencia', CostoTecnica: 0 }] }] }, adm);
        const CID = cot.j.cotizacion?.CotizacionID ?? cot.j.CotizacionID ?? cot.j.datos?.CotizacionID;
        const det0 = (await call('GET', '/cotizaciones/' + CID, null, adm)).j;
        for (const d of det0.detalles || []) for (const t of d.tecnicas || []) await call('PUT', '/cotizaciontecnicas/' + t.CotizacionTecnicaID, { CostoTecnica: 5000 }, adm);
        await call('PUT', '/cotizaciones/' + CID, { EstadoID: 2 }, adm);
        const antes3 = await stock();
        const conv = await Promise.all([1, 2, 3, 4].map(() => call('POST', `/cotizaciones/${CID}/convertir-a-venta`, null, adm)));
        const creadas = conv.filter((r) => r.s === 201);
        const despues3 = await stock();
        si(`solo UNA conversión crea venta (creadas: ${creadas.length})`, creadas.length === 1);
        si(`el stock bajó una sola vez: ${antes3} -> ${despues3} (esperado ${antes3 - 2})`, despues3 === antes3 - 2);
        si('las demás responden 400 (ya convertida), nunca 500', conv.filter((r) => r.s !== 201).every((r) => r.s === 400), conv.map((r) => r.s).join(','));
        await limpiarVentas(creadas);
        await call('DELETE', '/cotizaciones/' + CID, null, adm);
    } finally {
        await fijarStock(original);
    }
    console.log(bad ? ('\n' + bad + ' FALLOS') : '\nTODO OK');
})().catch((e) => { console.log('EXC', e); process.exit(1); });
