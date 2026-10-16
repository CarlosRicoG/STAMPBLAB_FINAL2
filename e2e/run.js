/**
 * Pruebas E2E con un navegador real (Chrome) usando puppeteer-core.
 *
 *   cd e2e && npm install && npm test
 *
 * Requisitos: frontend (http://127.0.0.1:5173) y backend (http://127.0.0.1:3000) corriendo, con la base de
 * demostracion (npm run db:reset y node scripts/seed-demo-flujo.js en backend/).
 * Variables: BASE_URL, API_URL, CHROME_PATH.  Sale con codigo 1 si algo falla.
 *
 * Nota: en Chrome headless el teclado a veces no llega a los inputs, por eso los campos se rellenan
 * disparando los eventos de React directamente (setVal) y el formulario se envia con requestSubmit().
 */
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173';
const API = process.env.API_URL || 'http://127.0.0.1:3000/api';
const CHROMES = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const CHROME = CHROMES.find((p) => fs.existsSync(p));
if (!CHROME) { console.error('No encuentro Chrome. Define CHROME_PATH.'); process.exit(2); }

const ADMIN = ['admin@stamplab.com', 'Admin123*'];
const CLIENTE = ['cliente@stamplab.com', 'Cliente123*'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fallos = 0;
const ok = (nombre, cond, detalle = '') => { if (!cond) fallos++; console.log(`${cond ? '  ✔' : '  ✘'} ${nombre}${!cond && detalle ? '  -> ' + detalle : ''}`); };

async function nuevaPagina(browser) {
    const pg = await browser.newPage();
    await pg.setViewport({ width: 1400, height: 900 });
    pg.problemas = [];
    pg.on('pageerror', (e) => pg.problemas.push('pageerror: ' + String(e).slice(0, 140)));
    pg.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) pg.problemas.push('console: ' + m.text().slice(0, 140)); });
    pg.on('response', (r) => { if (r.status() >= 500) pg.problemas.push('HTTP ' + r.status() + ' ' + r.url().replace(API, '')); });
    return pg;
}

const setVal = (pg, selector, valor) => pg.evaluate((sel, v) => {
    const el = document.querySelector(sel);
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
}, selector, valor);

async function login(pg, [correo, clave]) {
    await pg.goto(BASE + '/login', { waitUntil: 'networkidle2' });
    await setVal(pg, 'input[type=email],input[placeholder*="orreo"]', correo);
    await setVal(pg, 'input[type=password]', clave);
    await pg.evaluate(() => document.querySelector('button[type=submit]').form.requestSubmit());
    await sleep(3500);
}

const clickTexto = (pg, re) => pg.evaluate((src) => {
    const b = [...document.querySelectorAll('button')].filter((x) => x.offsetParent).find((x) => new RegExp(src, 'i').test((x.innerText || x.title || '').trim()));
    b?.click(); return !!b;
}, re.source);

async function api(metodo, ruta, cuerpo, token) {
    const r = await fetch(API + ruta, { method: metodo, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
    return { s: r.status, j: await r.json().catch(() => null) };
}

(async () => {
    const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
    try {
        console.log('\n▶ Tienda publica (sin sesion)');
        let pg = await nuevaPagina(browser);
        for (const ruta of ['/landing', '/servicios', '/productosLanding', '/cotizacionesLanding', '/login', '/signup']) {
            pg.problemas.length = 0;
            await pg.goto(BASE + ruta, { waitUntil: 'networkidle2' }); await sleep(900);
            const texto = await pg.evaluate(() => document.body.innerText.trim().length);
            ok(`${ruta} carga con contenido y sin errores`, texto > 200 && !pg.problemas.length, pg.problemas.join(' | '));
        }
        pg.problemas.length = 0;
        await pg.goto(BASE + '/dashboard', { waitUntil: 'networkidle2' }); await sleep(800);
        ok('/dashboard sin sesion redirige al login', pg.url().endsWith('/login'));
        await pg.close();

        console.log('\n▶ Acceso por rol');
        pg = await nuevaPagina(browser);
        await login(pg, CLIENTE);
        ok('cliente entra a /landing', pg.url().endsWith('/landing'), pg.url());
        await pg.goto(BASE + '/dashboard/ventas', { waitUntil: 'networkidle2' }); await sleep(900);
        ok('cliente NO puede abrir el panel (lo devuelve a la tienda)', pg.url().endsWith('/landing'), pg.url());
        await pg.close();
        pg = await nuevaPagina(browser);
        await login(pg, ADMIN);
        ok('administrador entra a /dashboard', pg.url().includes('/dashboard'), pg.url());

        console.log('\n▶ Panel de administracion');
        const rutas = ['', '/ventas', '/ventas-pendientes', '/cotizaciones', '/roles', '/insumos', '/pedidos', '/productos', '/agregar-producto',
            '/colores', '/tallas', '/usuarios', '/clientes', '/proveedores', '/tecnicas', '/mediciondesempeño'];
        for (const r of rutas) {
            pg.problemas.length = 0;
            await pg.goto(BASE + '/dashboard' + r, { waitUntil: 'networkidle2' }); await sleep(900);
            const n = await pg.evaluate(() => document.body.innerText.trim().length);
            ok(`/dashboard${r} carga sin errores`, n > 300 && !pg.problemas.length, pg.problemas.join(' | '));
        }
        await pg.close();

        console.log('\n▶ Compra del cliente y cancelacion');
        pg = await nuevaPagina(browser);
        await login(pg, CLIENTE);
        const token = await pg.evaluate(() => localStorage.getItem('token'));
        const stock = async () => { const a = (await api('GET', '/inventarioproducto/producto/1')).j; const l = a.datos || a.variantes || a; return (l.find((v) => v.InventarioID === 1) || {}).Stock; };
        const stock0 = await stock();
        const idsAntes = new Set((await api('GET', '/ventas?documentoID=1000000002&limit=500&page=1', null, token)).j.datos.map((v) => v.VentaID));
        await pg.goto(BASE + '/productosLanding', { waitUntil: 'networkidle2' }); await sleep(1200);
        await clickTexto(pg, /^\s*Agregar\s*$/); await sleep(900);
        await pg.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent).find((b) => (b.title || b.innerText).trim() === 'Blanco')?.click()); await sleep(300);
        await pg.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent).find((b) => b.innerText.trim() === 'S')?.click()); await sleep(300);
        await clickTexto(pg, /Agregar al carrito/); await sleep(1500);
        await pg.evaluate(() => document.querySelector('.swal2-confirm')?.click()); await sleep(500);
        await clickTexto(pg, /Comprar ahora|Finalizar/); await sleep(900);
        await pg.evaluate(() => {
            const c = [...document.querySelectorAll('div,button,label')].filter((e) => e.offsetParent && /^Contra entrega/.test(e.innerText.trim()) && e.innerText.length < 80);
            c.sort((a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height); c.pop()?.click();
        }); await sleep(600);
        await setVal(pg, 'input[placeholder="Nombre completo"]', 'ZZ E2E');
        await setVal(pg, 'input[placeholder*="300 123"]', '300 123 4567');
        await setVal(pg, 'input[placeholder*="Calle, barrio"]', 'Calle E2E # 1-2');
        await sleep(300); await clickTexto(pg, /Confirmar pedido/); await sleep(3500);
        const lista = async () => (await api('GET', '/ventas?documentoID=1000000002&limit=500&page=1', null, token)).j.datos || [];
        const mis = await lista();
        const pedido = mis.find((v) => !idsAntes.has(v.VentaID));
        ok('el pedido quedo registrado (Pendiente)', !!pedido && pedido.EstadoID === 8);
        ok('el stock bajo en 1', (await stock()) === stock0 - 1, `antes ${stock0}, ahora ${await stock()}`);
        if (pedido) {
            await pg.goto(BASE + '/miscompras', { waitUntil: 'networkidle2' }); await sleep(1500);
            ok('aparece el boton "Cancelar pedido"', await pg.evaluate(() => !!document.querySelector('.mc-cancel')));
            await pg.evaluate(() => document.querySelector('.mc-cancel')?.click()); await sleep(800);
            await pg.evaluate(() => document.querySelector('.swal2-confirm')?.click()); await sleep(2800);
            const despues = (await api('GET', '/ventas/' + pedido.VentaID, null, token)).j;
            ok('tras cancelar el estado es Cancelada (12)', despues.EstadoID === 12);
            ok('el stock volvio a su valor', (await stock()) === stock0, `esperado ${stock0}, ahora ${await stock()}`);
            const adm = (await api('POST', '/login', { Correo: ADMIN[0], 'Contraseña': ADMIN[1] })).j.token;
            await api('DELETE', '/ventas/' + pedido.VentaID, null, adm);
        }
        ok('sin errores de consola en el flujo', !pg.problemas.length, pg.problemas.join(' | '));
        await pg.close();

        console.log('\n▶ Registro de un cliente nuevo');
        pg = await nuevaPagina(browser);
        const doc = String(4000000000 + Math.floor(Math.random() * 99999999));
        const correo = `e2e_${doc}@test.com`;
        await pg.goto(BASE + '/signup', { waitUntil: 'networkidle2' }); await sleep(1200);
        const valores = ['ZZ Prueba Registro', doc, correo, '3105551234', 'Calle 7 # 8-9', 'Registro123*', 'Registro123*'];
        for (let i = 0; i < valores.length; i++) {
            await pg.evaluate((n, v) => { const el = document.querySelectorAll('form input')[n]; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('blur', { bubbles: true })); }, i, valores[i]);
        }
        await pg.evaluate(() => document.querySelector('form').requestSubmit()); await sleep(3500);
        const swalTexto = await pg.evaluate(() => document.querySelector('.swal2-popup')?.innerText || '');
        ok('el registro muestra exito', /Registro exitoso/i.test(swalTexto), swalTexto.slice(0, 80));
        const l = await api('POST', '/login', { Correo: correo, 'Contraseña': 'Registro123*' });
        ok('el nuevo cliente puede iniciar sesion (rol 2, documento de 10 digitos)', l.s === 200 && l.j.rol === 2 && Number(l.j.DocumentoID) === Number(doc));
        const adm = (await api('POST', '/login', { Correo: ADMIN[0], 'Contraseña': ADMIN[1] })).j.token;
        await api('DELETE', '/usuarios/' + doc, null, adm);
        await pg.close();
    } finally {
        await browser.close();
    }
    console.log('\n' + (fallos ? `✘ ${fallos} comprobaciones fallaron` : '✔ Todas las pruebas E2E pasaron'));
    process.exit(fallos ? 1 : 0);
})().catch((e) => { console.error('ERROR en la ejecucion E2E:', e); process.exit(2); });
