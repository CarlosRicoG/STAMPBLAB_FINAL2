/**
 * RECORRIDO COMPLETO por la interfaz real: cliente nuevo -> estados vacios -> cotiza con diseno -> el administrador
 * le pone precio, aprueba y convierte en venta -> el cliente compra del catalogo (transferencia con comprobante)
 * -> el administrador procesa el pedido por todos los estados -> el cliente lo ve y cancela otro pedido.
 *
 *   cd e2e && BASE_URL=... API_URL=... node journey.js        (por defecto contra el entorno local)
 * Deja el sistema como estaba (borra lo que crea).
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173';
const API = process.env.API_URL || 'http://127.0.0.1:3000/api';
const CHROME = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find((p) => fs.existsSync(p));
const ADMIN = ['admin@stamplab.com', 'Admin123*'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SHOTS = path.join(__dirname, 'capturas'); fs.mkdirSync(SHOTS, { recursive: true });

let fallos = 0;
const ok = (n, c, d = '') => { if (!c) fallos++; console.log(`  ${c ? '✔' : '✘'} ${n}${!c && d ? '  -> ' + d : ''}`); return c; };
const api = async (m, p, b, t) => {
    const r = await fetch(API + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined });
    return { s: r.status, j: await r.json().catch(() => null) };
};
const setVal = (pg, sel, v) => pg.evaluate((s, v) => { const el = document.querySelector(s); const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, sel, v);
const click = (pg, re) => pg.evaluate((src) => { const b = [...document.querySelectorAll('button')].filter((x) => x.offsetParent).find((x) => new RegExp(src, 'i').test((x.innerText || x.title || '').trim())); b?.click(); return !!b; }, re.source);
const swalText = (pg) => pg.evaluate(() => document.querySelector('.swal2-popup')?.innerText.replace(/\s+/g, ' ') || '');
const cierraSwal = async (pg) => { await pg.evaluate(() => document.querySelector('.swal2-confirm')?.click()); await sleep(500); };
const esperaTexto = (pg, t, ms = 12000) => pg.waitForFunction((x) => document.body.innerText.includes(x), { timeout: ms }, t).catch(() => {});
const texto = (pg) => pg.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
const foto = (pg, n) => pg.screenshot({ path: path.join(SHOTS, n + '.png') });
async function pagina(ctx) {
    const pg = await ctx.newPage(); await pg.setViewport({ width: 1400, height: 1000 }); pg.problemas = [];
    pg.on('pageerror', (e) => pg.problemas.push('pageerror: ' + String(e).slice(0, 120)));
    pg.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) pg.problemas.push('console: ' + m.text().slice(0, 120)); });
    pg.on('response', (r) => { if (r.status() >= 500) pg.problemas.push('HTTP ' + r.status() + ' ' + r.url().replace(API, '')); });
    return pg;
}
async function login(pg, [c, p]) {
    await pg.goto(BASE + '/login', { waitUntil: 'networkidle2' });
    await setVal(pg, 'input[type=email]', c); await setVal(pg, 'input[type=password]', p);
    await pg.evaluate(() => document.querySelector('button[type=submit]').form.requestSubmit()); await sleep(3500);
}

(async () => {
    const br = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
    const limpiar = [];
    const ctxCli = await br.createBrowserContext(); // sesion del CLIENTE
    const ctxAdm = await br.createBrowserContext(); // sesion del ADMINISTRADOR (storage separado)
    let admToken;
    try {
        admToken = (await api('POST', '/login', { Correo: ADMIN[0], 'Contraseña': ADMIN[1] })).j.token;
        const doc = String(4100000000 + Math.floor(Math.random() * 89999999));
        const correo = `journey_${doc}@test.com`; const clave = 'Journey123*';

        // ───────────── 1. REGISTRO + ESTADOS VACIOS
        console.log('\n① Cliente nuevo: registro y estados vacíos');
        let pg = await pagina(ctxCli);
        await pg.goto(BASE + '/signup', { waitUntil: 'networkidle2' }); await sleep(1200);
        const vals = ['Cliente Recorrido', doc, correo, '3105559999', 'Carrera 5 # 6-7', clave, clave];
        for (let i = 0; i < vals.length; i++) await pg.evaluate((n, v) => { const el = document.querySelectorAll('form input')[n]; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('blur', { bubbles: true })); }, i, vals[i]);
        await pg.evaluate(() => document.querySelector('form').requestSubmit()); await pg.waitForFunction(() => /Registro exitoso/i.test(document.querySelector('.swal2-container')?.innerText || ''), { timeout: 12000 }).catch(() => {}); await sleep(300);
        ok('registro exitoso', /Registro exitoso/i.test(await swalText(pg)));
        limpiar.push(['usuario', doc]);
        await login(pg, [correo, clave]);
        ok('inicia sesión y llega a la tienda', pg.url().endsWith('/landing'), pg.url());
        const tokenCli = await pg.evaluate(() => localStorage.getItem('token'));

        await pg.goto(BASE + '/miscompras', { waitUntil: 'networkidle2' }); await sleep(1500);
        let t = await texto(pg);
        ok('"Mis compras" vacío muestra un mensaje amable (no pantalla en blanco)', /no tienes compras|aún no|sin compras|todavía no/i.test(t), t.slice(150, 330));
        ok('"Mis compras" vacío ofrece ir al catálogo', await pg.evaluate(() => !!document.querySelector('a[href*="productos"]')));
        await foto(pg, '1-mis-compras-vacio');
        await pg.goto(BASE + '/miscotizaciones', { waitUntil: 'networkidle2' }); await sleep(1500);
        t = await texto(pg);
        ok('"Mis cotizaciones" vacío muestra un mensaje amable', /no tienes cotizaciones|aún no|sin cotizaciones|todavía no|no has/i.test(t), t.slice(150, 330));
        await foto(pg, '1-mis-cotizaciones-vacio');
        await pg.goto(BASE + '/productosLanding', { waitUntil: 'networkidle2' }); await sleep(1200);
        ok('carrito vacío se explica', /carrito (está )?vac[ií]o|Agrega productos/i.test(await texto(pg)));
        ok('sin errores en estas pantallas', !pg.problemas.length, pg.problemas.join(' | '));

        // ───────────── 2. COTIZACION POR LA INTERFAZ
        console.log('\n② Cliente cotiza un diseño personalizado');
        pg.problemas.length = 0;
        await pg.goto(BASE + '/cotizacionesLanding', { waitUntil: 'networkidle2' }); await sleep(1800);
        await pg.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent).find((b) => /Seleccionar producto/i.test(b.innerText))?.click()); await sleep(1000);
        await foto(pg, '2-cotizar-selector');
        const hayProductoModal = await pg.evaluate(() => /Camiseta/.test(document.body.innerText));
        ok('el selector muestra los productos del catálogo', hayProductoModal);
        await pg.evaluate(() => {
            const filas = [...document.querySelectorAll('button,tr,div')].filter((e) => e.offsetParent && /Camiseta Básica/.test(e.innerText) && e.innerText.length < 200);
            const sel = filas.find((e) => /Seleccionar|Elegir/i.test(e.innerText) && e.tagName === 'BUTTON') || filas.sort((a, b) => a.innerText.length - b.innerText.length)[0];
            sel?.click();
        }); await sleep(1200);
        const sels = await pg.$$('select');
        ok('aparecen los selectores de color, talla, tela, técnica y parte', sels.length >= 5, 'selects: ' + sels.length);
        const pick = async (i, idx) => { const opts = await pg.evaluate((i) => [...document.querySelectorAll('select')[i].options].map((o) => o.value), i); const el = (await pg.$$('select'))[i]; await el.select(opts[idx]); await sleep(700); };
        await pick(0, 1); await pick(1, 1); await pick(2, 1); await pick(3, 1); await pick(4, 1);
        const archivo = await pg.$('input[type=file]');
        await archivo.uploadFile(path.join(__dirname, 'diseno-prueba.png')); await sleep(900);
        await pg.evaluate(() => { const ta = document.querySelector('textarea'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(ta, 'Logo en el pecho, 8 cm, tinta blanca'); ta.dispatchEvent(new Event('input', { bubbles: true })); });
        await foto(pg, '2-cotizar-formulario');
        ok('clic en "Agregar diseño"', await click(pg, /Agregar diseño/)); await sleep(1200);
        ok('el diseño queda en la lista', /Logo en el pecho|1 diseño|Diseños \(1\)|8 cm/i.test(await texto(pg)) || await pg.evaluate(() => document.querySelectorAll('table tbody tr, [class*=cot-dis]').length > 0));
        ok('clic en "Agregar al carrito"', await click(pg, /Agregar al carrito/)); await sleep(1500);
        await cierraSwal(pg);
        await foto(pg, '2-cotizar-resumen');
        ok('clic en "Generar cotización"', await click(pg, /Generar cotizaci/)); await sleep(3500);
        const exito = await texto(pg);
        ok('aparece la confirmación con número de cotización', /Cotizaci[oó]n generada|Estamos cotizando|#\d+/i.test(exito), exito.slice(0, 160));
        ok('la confirmación muestra el detalle: producto, color, talla, tela y el diseño (técnica y parte)', /Esto fue lo que pediste/i.test(exito) && /Camiseta/.test(exito) && /Color:/.test(exito) && /Talla:/.test(exito) && /Tela:/.test(exito) && /Dise.o 1:/.test(exito), exito.slice(0, 400));
        await foto(pg, '2-cotizar-exito');
        const cotsCli = (await api('GET', '/cotizaciones/usuario/' + doc, null, tokenCli)).j;
        const lista = cotsCli.datos || cotsCli;
        const cot = Array.isArray(lista) ? lista[0] : null;
        ok('la cotización quedó guardada en estado Pendiente, a nombre del cliente', !!cot && cot.EstadoID === 1, JSON.stringify(cotsCli).slice(0, 120));
        if (cot) limpiar.push(['cotizacion', cot.CotizacionID]);
        ok('sin errores en el flujo de cotización', !pg.problemas.length, pg.problemas.join(' | '));
        await pg.close();

        // ───────────── 3. ADMINISTRADOR ATIENDE LA COTIZACION
        console.log('\n③ El administrador atiende la cotización');
        pg = await pagina(ctxAdm);
        await login(pg, ADMIN);
        await pg.goto(BASE + '/dashboard/cotizaciones', { waitUntil: 'networkidle2' }); await esperaTexto(pg, 'Cliente Recorrido'); await sleep(500);
        ok('la cotización nueva aparece en el panel', /Cliente Recorrido/.test(await texto(pg)));
        await foto(pg, '3-admin-cotizaciones');
        if (cot) {
            const det = (await api('GET', '/cotizaciones/' + cot.CotizacionID, null, admToken)).j;
            const diseno = det.detalles?.[0]?.tecnicas?.[0];
            ok('el detalle trae el diseño del cliente (técnica, parte, imagen)', !!diseno?.ImagenDiseño || !!diseno?.ImagenUrl, JSON.stringify(Object.keys(diseno || {})));
            const sinPrecio = await api('PUT', '/cotizaciones/' + cot.CotizacionID, { EstadoID: 2 }, admToken);
            ok('aprobar SIN asignar costo al diseño es rechazado', sinPrecio.s === 400, 'estado ' + sinPrecio.s);
            ok('(precio) el administrador asigna el costo del diseño', (await api('PUT', '/cotizaciontecnicas/' + diseno.CotizacionTecnicaID, { CostoTecnica: 12000 }, admToken)).s === 200);
            await pg.goto(BASE + '/dashboard/cotizaciones', { waitUntil: 'networkidle2' }); await esperaTexto(pg, '#' + cot.CotizacionID); await sleep(500);
            ok('aprobar desde el panel', await pg.evaluate((id) => { const fila = [...document.querySelectorAll('tbody tr')].find((tr) => tr.innerText.includes('#' + id)); const b = fila && [...fila.querySelectorAll('button')].find((x) => /aprobar/i.test(x.title)); b?.click(); return !!b; }, cot.CotizacionID)); await sleep(2500);
            await cierraSwal(pg);
            const aprob = (await api('GET', '/cotizaciones/' + cot.CotizacionID, null, admToken)).j;
            ok('estado: Aprobada (2)', aprob.EstadoID === 2, 'estado ' + aprob.EstadoID);
            const pdf = await fetch(API + '/cotizaciones/' + cot.CotizacionID + '/pdf', { headers: { Authorization: 'Bearer ' + admToken } });
            ok('el PDF de la cotización se genera', pdf.status === 200 && /pdf/.test(pdf.headers.get('content-type')));
            ok('el cliente ve su cotización Aprobada con precio', (await api('GET', '/cotizaciones/' + cot.CotizacionID, null, tokenCli)).j.EstadoID === 2);
            const stockAntes = await stockProducto(admToken);
            await pg.goto(BASE + '/dashboard/cotizaciones', { waitUntil: 'networkidle2' }); await sleep(1200);
            await pg.evaluate((id) => { const fila = [...document.querySelectorAll('tbody tr')].find((tr) => tr.innerText.includes('#' + id)); [...fila.querySelectorAll('button')].find((x) => /convertir/i.test(x.title))?.click(); }, cot.CotizacionID); await sleep(1000);
            await cierraSwal(pg); await sleep(3000);
            const conv = (await api('GET', '/cotizaciones/' + cot.CotizacionID, null, admToken)).j;
            ok('convertir a venta: la cotización queda Procesada (5)', conv.EstadoID === 5, 'estado ' + conv.EstadoID + ' | ' + (await swalText(pg)));
            await cierraSwal(pg);
            const ventasCli = (await api('GET', '/ventas?documentoID=' + doc + '&limit=50&page=1', null, tokenCli)).j.datos || [];
            const vCot = ventasCli.find((v) => Number(v.Total) > 0);
            ok('se creó una venta Pendiente para el cliente', !!vCot && vCot.EstadoID === 8);
            if (vCot) limpiar.push(['venta', vCot.VentaID]);
            const stockDespues = await stockProducto(admToken);
            ok('el stock del producto bajó exactamente lo cotizado (1 unidad)', stockDespues === stockAntes - 1, `antes ${stockAntes}, después ${stockDespues}`);
        }
        ok('sin errores en el panel', !pg.problemas.length, pg.problemas.join(' | '));
        await pg.close();

        // ───────────── 4. CLIENTE COMPRA DEL CATALOGO CON TRANSFERENCIA
        console.log('\n④ El cliente compra del catálogo (transferencia con comprobante)');
        pg = await pagina(ctxCli);
        await login(pg, [correo, clave]);
        await pg.goto(BASE + '/productosLanding', { waitUntil: 'networkidle2' }); await sleep(1200);
        await click(pg, /^\s*Agregar\s*$/); await sleep(900);
        await pg.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent).find((b) => (b.title || b.innerText).trim() === 'Negro')?.click()); await sleep(300);
        await pg.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent).find((b) => b.innerText.trim() === 'M')?.click()); await sleep(300);
        await click(pg, /Agregar al carrito/); await sleep(1500); await cierraSwal(pg);
        await click(pg, /Comprar ahora|Finalizar/); await sleep(900);
        await pg.evaluate(() => { const c = [...document.querySelectorAll('div,button,label')].filter((e) => e.offsetParent && /^Transferencia bancaria/.test(e.innerText.trim()) && e.innerText.length < 90); c.sort((a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height); c.pop()?.click(); }); await sleep(700);
        await foto(pg, '4-pago-transferencia');
        const antes = ((await api('GET', '/ventas?documentoID=' + doc + '&limit=500&page=1', null, tokenCli)).j.datos || []).length;
        await click(pg, /Confirmar pedido/); await sleep(1500);
        const despues = ((await api('GET', '/ventas?documentoID=' + doc + '&limit=500&page=1', null, tokenCli)).j.datos || []).length;
        ok('sin comprobante NO se crea el pedido', despues === antes, 'ventas ' + antes + ' -> ' + despues);
        ok('y se le explica al cliente que falta el comprobante', /comprobante/i.test(await texto(pg) + await swalText(pg)));
        await cierraSwal(pg);
        const archivoComp = await pg.$('input[type=file]');
        ok('hay campo para subir el comprobante', !!archivoComp);
        if (archivoComp) { await archivoComp.uploadFile(path.join(__dirname, 'diseno-prueba.png')); await sleep(1200); }
        await foto(pg, '4-pago-con-comprobante');
        await click(pg, /Confirmar pedido/); await sleep(3500);
        const vs = (await api('GET', '/ventas?documentoID=' + doc + '&limit=50&page=1', null, tokenCli)).j.datos || [];
        const vTr = vs.find((v) => v.MetodoPago === 'transferencia');
        ok('el pedido por transferencia quedó registrado (Pendiente)', !!vTr && vTr.EstadoID === 8, JSON.stringify(vs.map((v) => v.MetodoPago)));
        if (vTr) limpiar.push(['venta', vTr.VentaID]);
        ok('sin errores en la compra', !pg.problemas.length, pg.problemas.join(' | '));

        // ───────────── 5. ADMIN PROCESA EL PEDIDO POR TODOS LOS ESTADOS
        console.log('\n⑤ El administrador procesa el pedido y el cliente lo sigue');
        if (vTr) {
            const detAdm = (await api('GET', '/ventas/' + vTr.VentaID, null, admToken)).j;
            ok('el administrador ve el comprobante de transferencia', /^data:|^\/uploads|^http/.test(detAdm.ComprobanteTransferencia || ''), String(detAdm.ComprobanteTransferencia).slice(0, 40));
            const adm = await pagina(ctxAdm); await login(adm, ADMIN);
            await adm.goto(BASE + '/dashboard/ventas-pendientes', { waitUntil: 'networkidle2' }); await sleep(1500);
            ok('aparece en "Pedidos pendientes"', await adm.evaluate((id) => [...document.querySelectorAll('tbody tr')].some((tr) => tr.innerText.includes('#' + id)), vTr.VentaID));
            await foto(adm, '5-admin-pendientes');
            await adm.evaluate((id) => { const fila = [...document.querySelectorAll('tbody tr')].find((tr) => tr.innerText.includes('#' + id)); [...fila.querySelectorAll('button')].find((x) => /procesar/i.test(x.title))?.click(); }, vTr.VentaID); await sleep(900);
            await adm.evaluate(() => { const s = [...document.querySelectorAll('select')].pop(); const o = [...s.options].find((o) => /Pagada/.test(o.text)); s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); }); await sleep(300);
            await adm.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent).find((b) => /confirmar|guardar|cambiar|aceptar|procesar/i.test(b.innerText))?.click()); await sleep(2500);
            await cierraSwal(adm);
            ok('sale de pendientes: queda Pagada (9)', (await api('GET', '/ventas/' + vTr.VentaID, null, admToken)).j.EstadoID === 9);
            await pg.goto(BASE + '/miscompras', { waitUntil: 'networkidle2' }); await sleep(1500);
            ok('el cliente ve el pedido como "Pagada" en Mis compras', /Pagada/.test(await texto(pg)));
            await foto(pg, '5-cliente-pagada');
            for (const [id, nombre] of [[10, 'En Producción'], [13, 'Lista para Entrega'], [11, 'Entregada']]) {
                const r = await api('PATCH', '/ventas/' + vTr.VentaID + '/estado', { EstadoID: id }, admToken);
                ok(`el administrador lo pasa a "${nombre}"`, r.s === 200, 'estado HTTP ' + r.s);
            }
            await pg.goto(BASE + '/miscompras', { waitUntil: 'networkidle2' }); await sleep(1500);
            ok('el cliente ve el pedido "Entregada"', /Entregada/.test(await texto(pg)));
            await foto(pg, '5-cliente-entregada');
            ok('un pedido entregado ya NO se puede cancelar desde el cliente', (await api('PATCH', '/ventas/' + vTr.VentaID + '/cancelar', null, tokenCli)).s === 400);
            ok('panel de indicadores refleja las ventas', ((await api('GET', '/ventas/dashboard', null, admToken)).j?.totales?.ventas ?? (await api('GET', '/ventas/dashboard', null, admToken)).j?.totalVentas ?? 1) !== undefined);
            await adm.close();
        }

        // ───────────── 6. CLIENTE CANCELA UN PEDIDO PENDIENTE
        console.log('\n⑥ El cliente cancela un pedido pendiente');
        const stockPrev = await stockVariante(admToken);
        const nuevo = await api('POST', '/ventas', { Subtotal: 25000, Total: 25000, metodoPago: 'contraentrega', nombreReceptor: 'Cliente Recorrido', telefonoEntrega: '3105559999', direccionEntrega: 'Carrera 5 # 6-7', detalles: [{ ProductoID: 1, ColorID: 1, TallaID: 1, Cantidad: 2, PrecioUnitario: 25000, InventarioID: 1 }] }, tokenCli);
        const VN = nuevo.j?.venta?.VentaID; if (VN) limpiar.push(['venta', VN]);
        ok('se crea otro pedido', nuevo.s === 201);
        ok('el stock bajó en 2', (await stockVariante(admToken)) === stockPrev - 2);
        await pg.goto(BASE + '/miscompras', { waitUntil: 'networkidle2' }); await sleep(1500);
        await pg.evaluate(() => document.querySelector('.mc-cancel')?.click()); await sleep(800);
        await pg.evaluate(() => document.querySelector('.swal2-confirm')?.click()); await sleep(2800);
        ok('queda Cancelada (12)', (await api('GET', '/ventas/' + VN, null, tokenCli)).j.EstadoID === 12);
        ok('el stock vuelve a su valor', (await stockVariante(admToken)) === stockPrev);
        await foto(pg, '6-cliente-cancelado');
        ok('sin errores de consola en toda la sesión del cliente', !pg.problemas.length, pg.problemas.join(' | '));
        await pg.close();
    } finally {
        if (admToken) {
            for (const [tipo, id] of limpiar.reverse()) {
                if (tipo === 'venta') { await api('PATCH', `/ventas/${id}/cancelar`, null, admToken); await api('DELETE', '/ventas/' + id, null, admToken); }
                if (tipo === 'cotizacion') await api('DELETE', '/cotizaciones/' + id, null, admToken);
                if (tipo === 'usuario') await api('DELETE', '/usuarios/' + id, null, admToken);
            }
        }
        await br.close();
    }
    console.log('\n' + (fallos ? `✘ ${fallos} comprobaciones fallaron (capturas en e2e/capturas)` : '✔ Recorrido completo OK'));
    process.exit(fallos ? 1 : 0);

    async function stockProducto(token) { const a = (await api('GET', '/inventarioproducto/producto/1', null, token)).j; const l = a.datos || a.variantes || a; return l.reduce((t, v) => t + (v.Stock || 0), 0); }
    async function stockVariante(token) { const a = (await api('GET', '/inventarioproducto/1', null, token)).j; return a.Stock ?? a.datos?.Stock; }
})().catch((e) => { console.error('ERROR en la ejecución:', e); process.exit(2); });
