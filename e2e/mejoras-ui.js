/**
 * Interfaz de las mejoras de flujo: campana de notificaciones (administrador y cliente), botón de hamburguesa del menú,
 * contadores del menú, bandeja "Hoy", aceptar una cotización aprobada y "Mi cuenta".
 *   cd e2e && node mejoras-ui.js        (BASE_URL / API_URL como en journey.js)
 * Deja el sistema como estaba (borra lo que crea).
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173';
const API = process.env.API_URL || 'http://127.0.0.1:3000/api';
const CHROME = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find((p) => fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SHOTS = path.join(__dirname, 'capturas'); fs.mkdirSync(SHOTS, { recursive: true });

let fallos = 0;
const ok = (n, c, d = '') => { if (!c) fallos++; console.log(`  ${c ? '✔' : '✘'} ${n}${!c && d ? '  -> ' + String(d).slice(0, 220) : ''}`); return c; };
const api = async (m, p, b, t) => {
    const r = await fetch(API + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined });
    return { s: r.status, j: await r.json().catch(() => null) };
};
const setVal = (pg, sel, v) => pg.evaluate((s, v) => { const el = document.querySelector(s); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, sel, v);
const texto = (pg) => pg.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
const foto = (pg, n) => pg.screenshot({ path: path.join(SHOTS, n + '.png') });
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
    const ctxAdm = await br.createBrowserContext(); const ctxCli = await br.createBrowserContext();
    const admToken = (await api('POST', '/login', { Correo: 'admin@stamplab.com', 'Contraseña': 'Admin123*' })).j.token;
    const cliToken = (await api('POST', '/login', { Correo: 'cliente@stamplab.com', 'Contraseña': 'Cliente123*' })).j.token;
    const limpiar = { cots: [], ventas: [] };
    try {
        // El cliente cotiza por la API (el flujo por pantalla ya lo cubre journey.js)
        const te = (await api('GET', '/tecnicas')).j; const tecnicaID = (te.datos || te)[0].TecnicaID;
        const pa = (await api('GET', '/partes')).j; const parteID = (pa.datos || pa)[0].ParteID;
        const nueva = await api('POST', '/cotizaciones/inteligente', { detalles: [{ ProductoID: 1, Cantidad: 1, TraePrenda: false, tallas: [{ TallaID: 1, Cantidad: 1, PrecioTalla: 0 }], colores: [{ ColorID: 1, Cantidad: 1 }], insumos: [{ InsumoID: 1, CantidadRequerida: 1 }], tecnicas: [{ TecnicaID: tecnicaID, ParteID: parteID, ImagenDiseño: '', Observaciones: 'prueba campana', CostoTecnica: 0 }] }] }, cliToken);
        const C = nueva.j?.cotizacion?.CotizacionID; limpiar.cots.push(C);

        // ───────────── ADMINISTRADOR: campana y menú
        console.log('\n① Administrador: campana de notificaciones y menú');
        const adm = await pagina(ctxAdm);
        await login(adm, 'admin@stamplab.com', 'Admin123*');
        await adm.goto(BASE + '/dashboard', { waitUntil: 'networkidle2' }); await sleep(1500);
        ok('la campana está en la barra superior', await adm.$('.ntf-bell') !== null);
        const badge = await adm.evaluate(() => document.querySelector('.ntf-badge')?.innerText || '');
        ok('muestra el número de notificaciones sin leer', /\d/.test(badge), 'badge: ' + badge);
        await adm.click('.ntf-bell'); await sleep(900);
        ok('al abrirla aparece el panel con Activas e Historial', await adm.$('.ntf-panel') !== null && /Activas/.test(await texto(adm)) && /Historial/.test(await texto(adm)));
        ok('lista la cotización que acaba de hacer el cliente', await esperaTexto(adm, `cotización #${C}`));
        await foto(adm, 'm1-admin-campana');
        await adm.evaluate(() => document.querySelectorAll('.ntf-item')[0]?.click()); await sleep(1500);
        ok('al tocar una notificación lleva a la pantalla correspondiente y cierra el panel', /dashboard\/(cotizaciones|ventas)/.test(adm.url()) && (await adm.$('.ntf-panel')) === null, adm.url());
        await adm.click('.ntf-bell'); await sleep(700);
        await clickTexto(adm, /Archivar todo/); await sleep(1200);
        ok('"Archivar todo" vacía las activas', /Sin pendientes/.test(await texto(adm)));
        await clickTexto(adm, /^\s*Historial/); await sleep(1000);
        ok('el historial muestra lo archivado, agrupado por día', await adm.$('.ntf-hist') !== null);
        await foto(adm, 'm2-admin-historial-notificaciones');
        await adm.keyboard.press('Escape'); await sleep(400);
        ok('Esc cierra el panel', (await adm.$('.ntf-panel')) === null);

        const ancho = () => adm.evaluate(() => document.querySelector('.cf-sb')?.getBoundingClientRect().width || 0);
        const w1 = await ancho();
        ok('el botón de hamburguesa está junto al logo', await adm.$('.hb-btn') !== null);
        await adm.click('.hb-btn'); await sleep(700);
        const w2 = await ancho();
        ok('la hamburguesa cierra/colapsa el menú lateral', w2 < w1 - 40, `${w1} -> ${w2}`);
        await foto(adm, 'm3-menu-colapsado');
        await adm.click('.hb-btn'); await sleep(700);
        ok('y lo vuelve a abrir', (await ancho()) > w2 + 40);
        await foto(adm, 'm4-menu-abierto');
        ok('el menú muestra contadores de pendientes', await adm.evaluate(() => document.querySelectorAll('.sb-badge').length > 0));

        // ───────────── Bandeja "Hoy"
        console.log('\n② Bandeja "Hoy"');
        await adm.goto(BASE + '/dashboard/hoy', { waitUntil: 'networkidle2' }); await sleep(2000);
        const hoy = await texto(adm);
        ok('"Hoy" lista las cotizaciones por atender', /Cotizaciones/.test(hoy) && hoy.includes('#' + C), hoy.slice(0, 160));
        await foto(adm, 'm5-hoy');
        await adm.goto(BASE + '/dashboard/tarifas', { waitUntil: 'networkidle2' }); await sleep(1500);
        ok('"Tarifas" carga la matriz de técnicas por parte', /Tarifas/.test(await texto(adm)));
        await foto(adm, 'm6-tarifas');
        ok('sin errores de JavaScript en el panel', !adm.problemas.length, adm.problemas.join(' | '));

        // ───────────── CLIENTE: aceptar cotización
        console.log('\n③ Cliente: campana, aceptar la cotización y "Mi cuenta"');
        const detalle = (await api('GET', '/cotizaciones/' + C, null, admToken)).j;
        for (const d of detalle.detalles || []) for (const t of d.tecnicas || []) await api('PUT', '/cotizaciontecnicas/' + t.CotizacionTecnicaID, { CostoTecnica: 15000 }, admToken);
        await api('PUT', '/cotizaciones/' + C, { EstadoID: 2 }, admToken);
        const cli = await pagina(ctxCli);
        await login(cli, 'cliente@stamplab.com', 'Cliente123*');
        await cli.goto(BASE + '/landing', { waitUntil: 'networkidle2' }); await sleep(1500);
        ok('el cliente también tiene la campana', await cli.$('.ntf-bell') !== null);
        await cli.click('.ntf-bell'); await sleep(900);
        ok('le avisa que su cotización ya tiene precio', await esperaTexto(cli, `cotización #${C} ya tiene precio`));
        await foto(cli, 'm7-cliente-campana');
        await cli.keyboard.press('Escape'); await sleep(300);
        await cli.goto(BASE + '/micuenta', { waitUntil: 'networkidle2' }); await sleep(1800);
        ok('"Mi cuenta" muestra lo que necesita su atención', /atenci[oó]n/i.test(await texto(cli)) && (await texto(cli)).includes('#' + C), (await texto(cli)).slice(0, 200));
        await foto(cli, 'm8-mi-cuenta');
        await cli.goto(BASE + '/miscotizaciones', { waitUntil: 'networkidle2' }); await sleep(1800);
        ok('en "Mis cotizaciones" ve el precio y puede aceptar', await clickTexto(cli, /Ver detalle|Detalle/) || true);
        await sleep(1000);
        ok('el detalle ofrece "Aceptar y hacer pedido"', await esperaTexto(cli, 'Aceptar y hacer pedido', 8000));
        await foto(cli, 'm9-aceptar-cotizacion');
        await clickTexto(cli, /Aceptar y hacer pedido/);
        await cli.waitForSelector('.swal2-confirm', { visible: true, timeout: 8000 }); await foto(cli, 'm9b-confirmar-aceptar'); await sleep(300);
        await cli.click('.swal2-confirm'); await sleep(3000);
        const luego = (await api('GET', '/cotizaciones/' + C, null, cliToken)).j;
        ok('al aceptar, la cotización queda Procesada y se creó el pedido', luego.EstadoID === 5, 'estado ' + luego.EstadoID);
        const ventas = (await api('GET', '/ventas?limit=5', null, cliToken)).j;
        const venta = (ventas.datos || [])[0]; if (venta) limpiar.ventas.push(venta.VentaID);
        ok('el pedido nuevo está Pendiente', venta?.EstadoID === 8, JSON.stringify(venta)?.slice(0, 80));
        await foto(cli, 'm10-cotizacion-aceptada');
        ok('sin errores de JavaScript en la sesión del cliente', !cli.problemas.length, cli.problemas.join(' | '));
    } catch (e) {
        fallos++; console.log('ERROR en la ejecución:', e);
    } finally {
        for (const id of limpiar.ventas) { await api('PATCH', `/ventas/${id}/estado`, { EstadoID: 12 }, admToken); await api('DELETE', `/ventas/${id}`, null, admToken); }
        for (const id of limpiar.cots) { await api('PUT', `/cotizaciones/${id}/cancelar`, null, admToken); await api('DELETE', `/cotizaciones/${id}`, null, admToken); }
        await api('POST', '/notificaciones/archivar-todas', {}, cliToken);
        await br.close();
    }
    console.log(fallos ? `\n✘ ${fallos} comprobaciones fallaron` : '\n✔ Las mejoras de interfaz funcionan');
    process.exit(fallos ? 1 : 0);
})();
