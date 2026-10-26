/**
 * Revisión de las pantallas del CLIENTE con datos reales: seguimiento, comprobante rechazado, "Volver a pedir",
 * tipo de entrega en el pago, estimado al cotizar y "Mi cuenta". Toma capturas en e2e/capturas (rv-*.png).
 *   cd e2e && node revision-cliente.js
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173';
const API = process.env.API_URL || 'http://127.0.0.1:3000/api';
const CHROME = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find((p) => fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SHOTS = path.join(__dirname, 'capturas'); fs.mkdirSync(SHOTS, { recursive: true });
const PNG = 'data:image/png;base64,' + Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40)]).toString('base64');

let fallos = 0;
const ok = (n, c, d = '') => { if (!c) fallos++; console.log(`  ${c ? '✔' : '✘'} ${n}${!c && d ? '  -> ' + String(d).slice(0, 240) : ''}`); return c; };
const api = async (m, p, b, t) => {
    const r = await fetch(API + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined });
    return { s: r.status, j: await r.json().catch(() => null) };
};
const setVal = (pg, sel, v) => pg.evaluate((s, v) => { const el = document.querySelector(s); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, sel, v);
const texto = (pg) => pg.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
const foto = (pg, n, completa = false) => pg.screenshot({ path: path.join(SHOTS, 'rv-' + n + '.png'), fullPage: completa });
const clickTexto = (pg, re) => pg.evaluate((src) => { const b = [...document.querySelectorAll('button,a')].filter((x) => x.offsetParent).find((x) => new RegExp(src, 'i').test((x.innerText || x.title || x.getAttribute('aria-label') || '').trim())); b?.click(); return !!b; }, re.source);
const esperaTexto = (pg, t, ms = 12000) => pg.waitForFunction((x) => document.body.innerText.includes(x), { timeout: ms }, t).then(() => true).catch(() => false);
async function pagina(ctx) {
    const pg = await ctx.newPage(); await pg.setViewport({ width: 1400, height: 950 }); pg.problemas = [];
    pg.on('pageerror', (e) => pg.problemas.push('pageerror: ' + String(e).slice(0, 140)));
    pg.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) pg.problemas.push('console: ' + m.text().slice(0, 140)); });
    pg.on('response', (r) => { if (r.status() >= 500) pg.problemas.push('HTTP ' + r.status() + ' ' + r.url().replace(API, '')); });
    pg.on('dialog', (d) => d.dismiss().catch(() => {}));
    return pg;
}
async function login(pg, c, p) {
    await pg.goto(BASE + '/login', { waitUntil: 'networkidle2' });
    await setVal(pg, 'input[type=email]', c); await setVal(pg, 'input[type=password]', p);
    await pg.evaluate(() => document.querySelector('button[type=submit]').form.requestSubmit());
    await pg.waitForFunction(() => !/\/login/.test(location.pathname), { timeout: 12000 }).catch(() => {}); await sleep(900);
}

(async () => {
    const br = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
    const ctx = await br.createBrowserContext();
    const adm = (await api('POST', '/login', { Correo: 'admin@stamplab.com', 'Contraseña': 'Admin123*' })).j.token;
    const cli = (await api('POST', '/login', { Correo: 'cliente@stamplab.com', 'Contraseña': 'Cliente123*' })).j.token;
    const limpiar = { ventas: [], cots: [] };
    try {
        const linea = { ProductoID: 1, ColorID: 1, TallaID: 1, Cantidad: 1, PrecioUnitario: 99999 };
        // Pedido A: transferencia con comprobante rechazado (pendiente, con plazo de pago)
        const A = (await api('POST', '/ventas', { Subtotal: 99999, Total: 99999, metodoPago: 'transferencia', comprobanteTransferencia: PNG, detalles: [linea] }, cli)).j.venta.VentaID; limpiar.ventas.push(A);
        await api('PATCH', `/ventas/${A}/rechazar-comprobante`, { motivo: 'La imagen está borrosa, súbela de nuevo' }, adm);
        // Pedido B: entregado, con historial, nota y fecha estimada
        const B = (await api('POST', '/ventas', { Subtotal: 99999, Total: 99999, tipoEntrega: 'envio', nombreReceptor: 'María Gómez', telefonoEntrega: '3105550000', direccionEntrega: 'Calle 10 # 20-30', metodoPago: 'transferencia', comprobanteTransferencia: PNG, detalles: [linea] }, cli)).j.venta.VentaID; limpiar.ventas.push(B);
        const futura = new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10);
        await api('PATCH', `/ventas/${B}/estado`, { EstadoID: 9, nota: 'Pago verificado' }, adm);
        await api('PATCH', `/ventas/${B}/estado`, { EstadoID: 10, nota: 'Estamos estampando tu pedido', fechaEstimadaEntrega: futura }, adm);
        await api('PATCH', `/ventas/${B}/estado`, { EstadoID: 11, nota: 'Entregado en portería' }, adm);
        // Cotización aprobada por aceptar
        const te = (await api('GET', '/tecnicas')).j; const tecnicaID = (te.datos || te)[0].TecnicaID;
        const pa = (await api('GET', '/partes')).j; const parteID = (pa.datos || pa)[0].ParteID;
        const C = (await api('POST', '/cotizaciones/inteligente', { detalles: [{ ProductoID: 1, Cantidad: 2, TraePrenda: false, tallas: [{ TallaID: 1, Cantidad: 2, PrecioTalla: 0 }], colores: [{ ColorID: 1, Cantidad: 2 }], insumos: [{ InsumoID: 1, CantidadRequerida: 2 }], tecnicas: [{ TecnicaID: tecnicaID, ParteID: parteID, ImagenDiseño: '', Observaciones: 'Logo grande al frente', CostoTecnica: 0 }] }] }, cli)).j.cotizacion.CotizacionID; limpiar.cots.push(C);
        const det = (await api('GET', '/cotizaciones/' + C, null, adm)).j;
        for (const d of det.detalles) for (const t of d.tecnicas) await api('PUT', '/cotizaciontecnicas/' + t.CotizacionTecnicaID, { CostoTecnica: 18000 }, adm);
        await api('PUT', '/cotizaciones/' + C, { EstadoID: 2 }, adm);

        const pg = await pagina(ctx);
        await login(pg, 'cliente@stamplab.com', 'Cliente123*');

        console.log('\n① Mis compras: seguimiento, comprobante rechazado y volver a pedir');
        await pg.goto(BASE + '/miscompras', { waitUntil: 'networkidle2' }); await sleep(2000);
        await foto(pg, '1-mis-compras-lista');
        const lista = await texto(pg);
        ok('la tarjeta del pedido pendiente muestra "Paga antes de"', /Paga antes de/i.test(lista), lista.slice(0, 200));
        ok('y avisa que el comprobante fue rechazado', /rechaz/i.test(lista));
        ok('el pedido entregado ofrece "Volver a pedir"', /Volver a pedir/i.test(lista));
        // detalle del pedido pendiente (A)
        await pg.evaluate((id) => { const t = [...document.querySelectorAll('div,article,section')].filter((e) => e.innerText && e.innerText.includes('#' + id) && /Ver detalle/.test(e.innerText)).sort((a, b) => a.innerText.length - b.innerText.length)[0]; [...(t?.querySelectorAll('button') || [])].find((b) => /Ver detalle/.test(b.innerText))?.click(); }, A);
        await sleep(1800);
        const detA = await texto(pg);
        ok('el detalle muestra el motivo del rechazo', detA.includes('La imagen está borrosa'), detA.slice(0, 200));
        ok('ofrece "Subir un nuevo comprobante"', /nuevo comprobante/i.test(detA));
        ok('muestra el seguimiento (línea de tiempo)', /Seguimiento/i.test(detA));
        await foto(pg, '2-detalle-pedido-rechazado');
        await pg.keyboard.press('Escape'); await sleep(500);
        await pg.evaluate(() => document.querySelector('[aria-label="Cerrar"], .mc-mclose')?.click()); await sleep(400);
        // detalle del pedido entregado (B)
        await pg.goto(BASE + '/miscompras', { waitUntil: 'networkidle2' }); await sleep(1800);
        await pg.evaluate((id) => { const t = [...document.querySelectorAll('div,article,section')].filter((e) => e.innerText && e.innerText.includes('#' + id) && /Ver detalle/.test(e.innerText)).sort((a, b) => a.innerText.length - b.innerText.length)[0]; [...(t?.querySelectorAll('button') || [])].find((b) => /Ver detalle/.test(b.innerText))?.click(); }, B);
        await sleep(1800);
        const detB = await texto(pg);
        ok('el pedido entregado muestra todos los pasos con sus notas', /Pago verificado/.test(detB) && /Estamos estampando/.test(detB) && /Entregado en portería/.test(detB), detB.slice(0, 300));
        ok('y los datos de envío (dirección y receptor)', /Calle 10 # 20-30/.test(detB) && /María Gómez/.test(detB));
        await foto(pg, '3-detalle-pedido-entregado');
        await pg.keyboard.press('Escape'); await sleep(500);

        console.log('\n② Volver a pedir');
        await pg.goto(BASE + '/miscompras', { waitUntil: 'networkidle2' }); await sleep(1800);
        await clickTexto(pg, /Volver a pedir/); await sleep(2500);
        ok('avisa que agregó el producto al carrito con los precios actuales', /producto(s)? agregado|agregado al carrito|agregados al carrito/i.test(await texto(pg)), (await texto(pg)).slice(0, 200));
        await foto(pg, '4-volver-a-pedir');
        await pg.evaluate(() => document.querySelector('.swal2-confirm')?.click()); await sleep(1500);
        ok('"Ir al carrito" lleva al catálogo', /productosLanding/.test(pg.url()), pg.url());
        const carrito = await pg.evaluate(() => { try { return JSON.parse(localStorage.getItem('cart_productos_landing') || '[]'); } catch { return []; } });
        ok('el carrito tiene el producto del pedido', carrito.length >= 1, JSON.stringify(carrito).slice(0, 120));

        console.log('\n③ Pago: tipo de entrega');
        await pg.goto(BASE + '/productosLanding', { waitUntil: 'networkidle2' }); await sleep(1500);
        await clickTexto(pg, /carrito/i); await sleep(1000);
        await foto(pg, '5-carrito');
        await clickTexto(pg, /Finalizar|Pagar|Continuar|Comprar/i); await sleep(1500);
        const pago = await texto(pg);
        ok('el pago permite elegir "Recoger en tienda" o "Envío a domicilio"', /Recoger en tienda/i.test(pago) && /Env[ií]o a domicilio/i.test(pago), pago.slice(0, 200));
        await foto(pg, '6-pago-tipo-entrega');
        await pg.evaluate(() => { const c = [...document.querySelectorAll('*')].filter((e) => e.offsetParent && /Env[ií]o a domicilio/.test(e.textContent) && e.textContent.length < 120 && e.children.length < 6).sort((a, b) => a.textContent.length - b.textContent.length)[0]; c?.click(); }); await sleep(700);
        ok('con envío pide la dirección del receptor', /Direcci[oó]n/i.test(await texto(pg)));
        await foto(pg, '7-pago-envio');

        console.log('\n④ Cotizar: estimado de precio');
        await pg.goto(BASE + '/cotizacionesLanding', { waitUntil: 'networkidle2' }); await sleep(1800);
        await pg.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent).find((b) => /Seleccionar producto/i.test(b.innerText))?.click()); await sleep(900);
        await pg.evaluate(() => { const filas = [...document.querySelectorAll('button,tr,div')].filter((e) => e.offsetParent && /Camiseta Básica/.test(e.innerText) && e.innerText.length < 200); (filas.find((e) => /Seleccionar|Elegir/i.test(e.innerText) && e.tagName === 'BUTTON') || filas.sort((a, b) => a.innerText.length - b.innerText.length)[0])?.click(); }); await sleep(1000);
        const pick = async (i, idx) => { const opts = await pg.evaluate((i) => [...document.querySelectorAll('select')[i].options].map((o) => o.value), i); await (await pg.$$('select'))[i].select(opts[idx]); await sleep(600); };
        for (const i of [0, 1, 2, 3, 4]) await pick(i, 1);
        await (await pg.$('input[type=file]')).uploadFile(path.join(__dirname, 'diseno-prueba.png')); await sleep(700);
        await clickTexto(pg, /Agregar diseño/); await sleep(1000);
        await clickTexto(pg, /Agregar al carrito/); await sleep(1500);
        await pg.evaluate(() => document.querySelector('.swal2-confirm')?.click()); await sleep(500);
        const est = await texto(pg);
        ok('muestra el estimado antes de generar la cotización', /Estimado/i.test(est), est.slice(0, 200));
        ok('aclara que el precio final lo confirma StampLab', /confirma StampLab|precio final/i.test(est));
        await foto(pg, '8-cotizar-estimado', true);

        console.log('\n⑤ Mi cuenta y aceptar la cotización');
        await pg.goto(BASE + '/micuenta', { waitUntil: 'networkidle2' }); await sleep(2000);
        const mc = await texto(pg);
        ok('Mi cuenta destaca la cotización aprobada por aceptar', mc.includes('#' + C) && /acept/i.test(mc), mc.slice(0, 250));
        ok('y el comprobante rechazado del pedido', /comprobante/i.test(mc) && mc.includes('#' + A), mc.slice(0, 250));
        await foto(pg, '9-mi-cuenta', true);
        ok('sin errores de JavaScript ni 500 en toda la revisión', !pg.problemas.length, pg.problemas.join(' | '));
    } catch (e) {
        fallos++; console.log('ERROR en la ejecución:', e);
    } finally {
        for (const id of limpiar.ventas) { await api('PATCH', `/ventas/${id}/estado`, { EstadoID: 12 }, adm); await api('DELETE', `/ventas/${id}`, null, adm); }
        for (const id of limpiar.cots) { await api('PUT', `/cotizaciones/${id}/cancelar`, null, adm); await api('DELETE', `/cotizaciones/${id}`, null, adm); }
        await api('POST', '/notificaciones/archivar-todas', {}, cli);
        await br.close();
    }
    console.log(fallos ? `\n✘ ${fallos} comprobaciones fallaron` : '\n✔ Las pantallas del cliente funcionan');
    process.exit(fallos ? 1 : 0);
})();
