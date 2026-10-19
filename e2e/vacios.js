/**
 * ESTADOS VACIOS: recorre TODAS las pantallas contra una instancia SIN datos (solo roles, estados y admin) y
 * comprueba que ninguna se rompe: sin errores, sin pantalla en blanco, y con un mensaje o acceso para empezar.
 *
 *   BASE_URL=http://127.0.0.1:5175 API_URL=http://localhost:3002/api node vacios.js
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5175';
const API = process.env.API_URL || 'http://localhost:3002/api';
const CHROME = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find((p) => fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SHOTS = path.join(__dirname, 'capturas', 'vacios'); fs.mkdirSync(SHOTS, { recursive: true });
let fallos = 0;
const ok = (n, c, d = '') => { if (!c) fallos++; console.log(`  ${c ? '✔' : '✘'} ${n}${!c && d ? '  -> ' + d : ''}`); };
const setVal = (pg, sel, v) => pg.evaluate((s, v) => { const el = document.querySelector(s); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); }, sel, v);

(async () => {
    const br = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
    try {
        const pg = await br.newPage(); await pg.setViewport({ width: 1400, height: 900 });
        let problemas = [];
        pg.on('pageerror', (e) => problemas.push('pageerror: ' + String(e).slice(0, 120)));
        pg.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) problemas.push('console: ' + m.text().slice(0, 120)); });
        pg.on('response', (r) => { if (r.status() >= 500) problemas.push('HTTP ' + r.status() + ' ' + r.url().replace(API, '')); });

        const visita = async (ruta, etiqueta, { min = 120, esperar = [] } = {}) => {
            problemas = [];
            await pg.goto(BASE + ruta, { waitUntil: 'networkidle2' }); await sleep(1100);
            const t = await pg.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
            await pg.screenshot({ path: path.join(SHOTS, etiqueta.replace(/\W+/g, '_') + '.png') });
            ok(`${etiqueta}: carga sin errores ni pantalla en blanco`, t.length >= min && !problemas.length, problemas.join(' | ') || `solo ${t.length} caracteres`);
            for (const re of esperar) ok(`${etiqueta}: muestra ${re}`, re.test(t), t.slice(0, 160));
            return t;
        };

        console.log('\n▶ Tienda del cliente con catálogo VACÍO');
        await visita('/landing', 'Inicio', { esperar: [/Productos/i] });
        await visita('/productosLanding', 'Catálogo sin productos', { esperar: [/0 productos|no hay productos|sin productos|no se encontraron|Aún no/i] });
        await visita('/servicios', 'Servicios sin técnicas');
        await visita('/cotizacionesLanding', 'Cotizar sin productos ni técnicas');

        console.log('\n▶ Panel de administración SIN datos');
        await pg.goto(BASE + '/login', { waitUntil: 'networkidle2' });
        await setVal(pg, 'input[type=email]', 'admin@stamplab.com'); await setVal(pg, 'input[type=password]', 'Admin123*');
        await pg.evaluate(() => document.querySelector('button[type=submit]').form.requestSubmit()); await sleep(3500);
        ok('el administrador entra al panel', pg.url().includes('/dashboard'), pg.url());
        const modulos = [['', 'Indicadores (sin ventas)'], ['/ventas', 'Pedidos'], ['/ventas-pendientes', 'Pedidos pendientes'], ['/cotizaciones', 'Cotizaciones'],
            ['/roles', 'Roles'], ['/insumos', 'Insumos'], ['/pedidos', 'Compras'], ['/productos', 'Productos'], ['/colores', 'Colores'], ['/tallas', 'Tallas'],
            ['/usuarios', 'Usuarios'], ['/clientes', 'Clientes'], ['/proveedores', 'Proveedores'], ['/tecnicas', 'Técnicas'], ['/mediciondesempeño', 'Medición y desempeño']];
        for (const [ruta, nombre] of modulos) await visita('/dashboard' + ruta, nombre, { min: 300 });

        console.log('\n▶ Formularios del panel abren aunque no haya datos de apoyo');
        for (const [ruta, boton] of [['/pedidos', /Agregar Compra/i], ['/ventas', /Agregar Pedido/i], ['/cotizaciones', /Agregar Cotizaci/i], ['/productos', /Agregar Producto/i]]) {
            problemas = [];
            await pg.goto(BASE + '/dashboard' + ruta, { waitUntil: 'networkidle2' }); await sleep(900);
            const clic = await pg.evaluate((src) => { const b = [...document.querySelectorAll('button')].filter((x) => x.offsetParent).find((x) => new RegExp(src, 'i').test((x.innerText || x.title || '').trim())); b?.click(); return !!b; }, boton.source);
            await sleep(1500);
            const t = await pg.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
            await pg.screenshot({ path: path.join(SHOTS, 'form_' + ruta.replace(/\W/g, '') + '.png') });
            ok(`formulario de ${ruta.slice(1)} abre sin romperse (hay botón, contenido y sin errores)`, clic && t.length > 300 && !problemas.length, problemas.join(' | '));
        }

        console.log('\n▶ Cliente nuevo ante tienda vacía');
        const ctx = await br.createBrowserContext(); const pc = await ctx.newPage(); await pc.setViewport({ width: 1400, height: 900 });
        const doc = String(4200000000 + Math.floor(Math.random() * 8999999));
        await pc.goto(BASE + '/signup', { waitUntil: 'networkidle2' }); await sleep(1000);
        const v = ['Cliente Vacio', doc, `vacio_${doc}@test.com`, '3105550000', 'Calle 1 # 2-3', 'Vacio12345*', 'Vacio12345*'];
        for (let i = 0; i < v.length; i++) await pc.evaluate((n, x) => { const el = document.querySelectorAll('form input')[n]; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, x); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('blur', { bubbles: true })); }, i, v[i]);
        await pc.evaluate(() => document.querySelector('form').requestSubmit()); await sleep(3000);
        for (const ruta of ['/miscompras', '/miscotizaciones', '/editarperfil']) {
            await pc.goto(BASE + ruta, { waitUntil: 'networkidle2' }); await sleep(900);
        }
        const adm = (await (await fetch(API + '/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ Correo: 'admin@stamplab.com', 'Contraseña': 'Admin123*' }) })).json()).token;
        await fetch(API + '/usuarios/' + doc, { method: 'DELETE', headers: { Authorization: 'Bearer ' + adm } });
    } finally { await br.close(); }
    console.log('\n' + (fallos ? `✘ ${fallos} comprobaciones fallaron (capturas en e2e/capturas/vacios)` : '✔ Todos los estados vacíos están bien'));
    process.exit(fallos ? 1 : 0);
})().catch((e) => { console.error('ERROR:', e); process.exit(2); });
