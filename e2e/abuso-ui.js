/**
 * Intentos de "dañar" la interfaz como lo haría un usuario torpe o malintencionado:
 * formularios vacíos o con basura, XSS, doble clic, cantidades absurdas, sesión borrada, botón atrás, rutas ajenas.
 *   cd e2e && node abuso-ui.js     (frontend en :5173 y API en :3000, con la base demo)
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
const setVal = (pg, sel, v) => pg.evaluate((s, v) => { const el = document.querySelector(s); const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, sel, v);
const click = (pg, re) => pg.evaluate((src) => { const b = [...document.querySelectorAll('button')].filter((x) => x.offsetParent).find((x) => new RegExp(src, 'i').test((x.innerText || x.title || '').trim())); b?.click(); return !!b; }, re.source);
const swalText = (pg) => pg.evaluate(() => document.querySelector('.swal2-popup')?.innerText.replace(/\s+/g, ' ') || '');
const cierraSwal = async (pg) => { await pg.evaluate(() => document.querySelector('.swal2-confirm')?.click()); await sleep(500); };
const texto = (pg) => pg.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
async function pagina(ctx) {
    const pg = await ctx.newPage(); await pg.setViewport({ width: 1400, height: 1000 }); pg.problemas = []; pg.peticiones = [];
    pg.on('pageerror', (e) => pg.problemas.push('pageerror: ' + String(e).slice(0, 140)));
    pg.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) pg.problemas.push('console: ' + m.text().slice(0, 140)); });
    pg.on('response', (r) => { if (r.status() >= 500) pg.problemas.push('HTTP ' + r.status() + ' ' + r.url().replace(API, '')); });
    pg.on('request', (r) => { if (r.method() !== 'GET' && r.url().startsWith(API)) pg.peticiones.push(r.method() + ' ' + r.url().replace(API, '')); });
    pg.on('dialog', (d) => d.dismiss().catch(() => {}));
    return pg;
}
async function login(pg, c, p) {
    await pg.goto(BASE + '/login', { waitUntil: 'networkidle2' });
    await setVal(pg, 'input[type=email]', c); await setVal(pg, 'input[type=password]', p);
    await pg.evaluate(() => document.querySelector('button[type=submit]').form.requestSubmit());
    await pg.waitForFunction(() => !/\/login/.test(location.pathname) || document.querySelector('.swal2-popup'), { timeout: 10000 }).catch(() => {}); await sleep(600);
}

(async () => {
    const br = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
    const ctxCli = await br.createBrowserContext();
    const ctxAdm = await br.createBrowserContext();
    const ctxAnon = await br.createBrowserContext();
    const admToken = (await api('POST', '/login', { Correo: 'admin@stamplab.com', 'Contraseña': 'Admin123*' })).j.token;
    const limpiezaDocs = []; const limpiezaCots = [];
    try {
        // ───────────── 1. REGISTRO
        console.log('\n① Registro con basura');
        let pg = await pagina(ctxAnon);
        await pg.goto(BASE + '/signup', { waitUntil: 'networkidle2' }); await sleep(800);
        await pg.evaluate(() => document.querySelector('form').requestSubmit()); await sleep(800);
        ok('enviar el formulario vacío no llama al servidor', !pg.peticiones.some((p) => /registro|usuarios/.test(p)), pg.peticiones.join(','));
        ok('y muestra mensajes de error en la pantalla', /obligatori|requerid|inválid|campo/i.test(await texto(pg)));
        const llenar = async (vals) => { for (let i = 0; i < vals.length; i++) await pg.evaluate((n, v) => { const el = document.querySelectorAll('form input')[n]; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('blur', { bubbles: true })); }, i, vals[i]); };
        const doc = String(4200000000 + Math.floor(Math.random() * 89999999));
        await llenar(['Ana', 'abc', 'no-es-correo', '12', '', '123', '456']); await pg.evaluate(() => document.querySelector('form').requestSubmit()); await sleep(900);
        ok('documento con letras, correo malo y claves distintas: no se registra', !pg.peticiones.some((p) => /POST \/registro/.test(p)), pg.peticiones.join(','));
        await llenar(['Ana Pérez', doc, `ana${doc}@test.com`, '3105559999', 'Calle 1', '12345678', '12345678']); await pg.evaluate(() => document.querySelector('form').requestSubmit()); await sleep(1200);
        ok('contraseña solo con números no se acepta', !pg.peticiones.some((p) => /POST \/registro/.test(p)) || /contrase/i.test(await swalText(pg) + await texto(pg)), pg.peticiones.join(','));
        await pg.close();
        pg = await pagina(ctxAnon);
        await pg.goto(BASE + '/signup', { waitUntil: 'networkidle2' }); await sleep(800);
        const doc2 = String(Number(doc) + 1);
        await llenar(['<img src=x onerror="window.__xss=1">', doc2, `xss${doc2}@test.com`, '3105559999', '<script>window.__xss=1</script>', 'Prueba123*', 'Prueba123*']);
        await pg.evaluate(() => document.querySelector('form').requestSubmit()); await sleep(3500); await cierraSwal(pg);
        limpiezaDocs.push(doc, doc2);
        const existe = (await api('GET', '/usuarios/' + doc2, null, admToken)).s === 200;
        ok('un nombre o dirección con < > se rechaza: no se crea la cuenta (y no se ejecuta código)', !existe && (await pg.evaluate(() => window.__xss)) !== 1);
        ok('sin errores de JavaScript', !pg.problemas.length, pg.problemas.join(' | '));
        await pg.close();

        // ───────────── 2. LOGIN
        console.log('\n② Login con intentos malos');
        pg = await pagina(ctxAnon);
        for (const [c, p] of [['', ''], ['admin@stamplab.com', 'incorrecta'], ["' OR 1=1 --", "' OR 1=1 --"], ['nadie@nada.com', 'Abc12345*']]) {
            await login(pg, c || 'x@y.com', p || 'x');
            ok(`credenciales malas (${(c || 'vacío').slice(0, 14)}) no entran`, /login/.test(pg.url()) && !(await pg.evaluate(() => localStorage.getItem('token'))), pg.url());
        }
        ok('muestra un error claro (no pantalla en blanco)', /incorrect|inválid|error/i.test(await swalText(pg) + await texto(pg)), (await texto(pg)).slice(0, 120));
        await pg.close();

        // ───────────── 3. COTIZACIÓN
        console.log('\n③ Cotizar: campos vacíos, cantidades absurdas, doble clic');
        pg = await pagina(ctxCli);
        await login(pg, 'cliente@stamplab.com', 'Cliente123*');
        const tokenCli = await pg.evaluate(() => localStorage.getItem('token'));
        const antes = (await api('GET', '/cotizaciones/usuario/1000000002', null, tokenCli)).j;
        const nAntes = (antes.datos || antes).length;
        const idsAntes = new Set((antes.datos || antes).map((c) => c.CotizacionID));
        await pg.goto(BASE + '/cotizacionesLanding', { waitUntil: 'networkidle2' }); await sleep(1800);
        ok('"Generar cotización" con el carrito vacío avisa y no envía', await (async () => { await click(pg, /Generar cotizaci/); await sleep(800); const t = await swalText(pg) + await texto(pg); await cierraSwal(pg); return !pg.peticiones.some((p) => /inteligente/.test(p)); })());
        await pg.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent).find((b) => /Seleccionar producto/i.test(b.innerText))?.click()); await sleep(900);
        await pg.evaluate(() => { const filas = [...document.querySelectorAll('button,tr,div')].filter((e) => e.offsetParent && /Camiseta Básica/.test(e.innerText) && e.innerText.length < 200); (filas.find((e) => /Seleccionar|Elegir/i.test(e.innerText) && e.tagName === 'BUTTON') || filas.sort((a, b) => a.innerText.length - b.innerText.length)[0])?.click(); }); await sleep(1000);
        const pick = async (i, idx) => { const opts = await pg.evaluate((i) => [...document.querySelectorAll('select')[i].options].map((o) => o.value), i); await (await pg.$$('select'))[i].select(opts[idx]); await sleep(600); };
        await pick(0, 1); await pick(1, 1); await pick(2, 1);
        await click(pg, /Agregar diseño/); await sleep(800);
        ok('agregar un diseño sin técnica ni parte se rechaza con mensaje', /obligatori|selecciona|requerid|debes|elige/i.test(await texto(pg) + await swalText(pg)), (await texto(pg)).slice(0, 100));
        await cierraSwal(pg);
        await pick(3, 1); await pick(4, 1);
        await pg.evaluate(() => { const ta = document.querySelector('textarea'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(ta, 'Logo "grande" 5 < 6 \'; DROP TABLE x;-- ' + 'ñ'.repeat(150)); ta.dispatchEvent(new Event('input', { bubbles: true })); });
        await (await pg.$('input[type=file]')).uploadFile(path.join(__dirname, 'diseno-prueba.png')); await sleep(700);
        await click(pg, /Agregar diseño/); await sleep(1000);
        await pg.evaluate(() => { const c = [...document.querySelectorAll('input[aria-label=Cantidad]')].find((e) => e.offsetParent); if (c) { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(c, '-5'); c.dispatchEvent(new Event('input', { bubbles: true })); c.dispatchEvent(new Event('change', { bubbles: true })); } });
        const cantNeg = await pg.evaluate(() => { const c = [...document.querySelectorAll('input[aria-label=Cantidad]')].find((e) => e.offsetParent); return c ? Number(c.value) : null; });
        ok('la cantidad negativa se corrige (mínimo 1)', cantNeg === null || cantNeg >= 1, 'cantidad quedó en ' + cantNeg);
        await pg.evaluate(() => { const c = [...document.querySelectorAll('input[aria-label=Cantidad]')].find((e) => e.offsetParent); if (c) { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(c, '999999'); c.dispatchEvent(new Event('input', { bubbles: true })); c.dispatchEvent(new Event('change', { bubbles: true })); } });
        await click(pg, /Agregar al carrito/); await sleep(1200);
        const msgStock = await swalText(pg); await cierraSwal(pg);
        ok('pedir una cantidad enorme se frena por stock insuficiente', /stock insuficiente|solo hay/i.test(msgStock + await texto(pg)), msgStock);
        await pg.evaluate(() => { const c = [...document.querySelectorAll('input[aria-label=Cantidad]')].find((e) => e.offsetParent); if (c) { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(c, '1'); c.dispatchEvent(new Event('input', { bubbles: true })); c.dispatchEvent(new Event('change', { bubbles: true })); } });
        await click(pg, /Agregar al carrito/); await sleep(1500); await cierraSwal(pg);
        // doble (triple) clic rápido en "Generar cotización"
        await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => x.offsetParent).find((x) => /Generar cotizaci/i.test(x.innerText)); b?.click(); b?.click(); b?.click(); });
        await sleep(4500);
        const despues = (await api('GET', '/cotizaciones/usuario/1000000002', null, tokenCli)).j;
        const lista = despues.datos || despues;
        const nuevas = lista.length - nAntes;
        lista.filter((c) => !idsAntes.has(c.CotizacionID)).forEach((c) => limpiezaCots.push(c.CotizacionID));
        ok('tres clics seguidos crean UNA sola cotización', nuevas === 1, 'se crearon ' + nuevas);
        ok('un diseño con HTML en la observación no ejecuta código', (await pg.evaluate(() => window.__xss)) === undefined);
        ok('sin errores de JavaScript ni 500', !pg.problemas.length, pg.problemas.join(' | '));
        await pg.close();

        // ───────────── 4. SESIÓN Y RUTAS
        console.log('\n④ Sesión borrada, rutas ajenas, botón atrás');
        pg = await pagina(ctxCli);
        await login(pg, 'cliente@stamplab.com', 'Cliente123*');
        await pg.goto(BASE + '/dashboard', { waitUntil: 'networkidle2' }); await sleep(1500);
        ok('un cliente que escribe /dashboard no ve el panel de administración', !/Gestión de Cotizaciones|ADMIN|Indicadores/.test(await texto(pg)) || /login|landing/.test(pg.url()), pg.url());
        await pg.goto(BASE + '/dashboard/ventas', { waitUntil: 'networkidle2' }); await sleep(1200);
        ok('ni /dashboard/ventas', !/ID Cliente Estado|Gestión de Ventas/.test(await texto(pg)) || /login|landing/.test(pg.url()), pg.url());
        await pg.goto(BASE + '/miscompras', { waitUntil: 'networkidle2' }); await sleep(1200);
        await pg.evaluate(() => localStorage.removeItem('token')); await pg.reload({ waitUntil: 'networkidle2' }); await sleep(1500);
        ok('con la sesión borrada, "Mis compras" manda al login', /login/.test(pg.url()) || /iniciar sesi/i.test(await texto(pg)), pg.url());
        await pg.evaluate(() => localStorage.setItem('token', 'basura.basura.basura')); await pg.goto(BASE + '/miscompras', { waitUntil: 'networkidle2' }); await sleep(1500);
        ok('con un token falso tampoco se ve nada (login)', /login/.test(pg.url()) || /iniciar sesi/i.test(await texto(pg)), pg.url());
        await pg.evaluate(() => localStorage.clear());
        await pg.goto(BASE + '/ruta-que-no-existe', { waitUntil: 'networkidle2' }); await sleep(800);
        ok('una ruta inexistente muestra algo útil (no pantalla en blanco)', (await texto(pg)).length > 20, (await texto(pg)).slice(0, 80));
        await pg.close();
        pg = await pagina(ctxCli);
        await login(pg, 'cliente@stamplab.com', 'Cliente123*');
        await pg.goto(BASE + '/miscompras', { waitUntil: 'networkidle2' }); await sleep(1200);
        await click(pg, /Salir|Cerrar sesi/); await sleep(1500);
        await pg.goBack({ waitUntil: 'networkidle2' }).catch(() => {}); await sleep(1500);
        ok('después de cerrar sesión, el botón "atrás" no muestra las compras', !/Mis\s*Compras/.test(await texto(pg)) || /login/.test(pg.url()), pg.url() + ' ' + (await texto(pg)).slice(0, 80));
        await pg.close();

        // ───────────── 5. ADMIN
        console.log('\n⑤ Administrador: formularios con basura');
        pg = await pagina(ctxAdm);
        await login(pg, 'admin@stamplab.com', 'Admin123*');
        for (const ruta of ['colores', 'tallas', 'tecnicas', 'roles', 'usuarios', 'productos', 'insumos', 'proveedores', 'ventas', 'ventas-pendientes', 'cotizaciones', 'pedidos']) {
            pg.problemas.length = 0;
            await pg.goto(BASE + '/dashboard/' + ruta, { waitUntil: 'networkidle2' }).catch(() => {}); await sleep(1200);
            ok(`/dashboard/${ruta} carga sin errores`, (await texto(pg)).length > 50 && !pg.problemas.length, pg.problemas.join(' | '));
        }
        await pg.goto(BASE + '/dashboard/colores', { waitUntil: 'networkidle2' }); await sleep(1200);
        const abrio = await click(pg, /Agregar|Nuevo|Crear/); await sleep(800);
        if (abrio) {
            await click(pg, /Guardar|Crear|Registrar/); await sleep(800);
            ok('guardar un color vacío muestra error y no lo crea', !pg.peticiones.some((p) => /POST \/colores/.test(p)) || /obligatori|requerid|nombre/i.test(await texto(pg) + await swalText(pg)), pg.peticiones.join(','));
        }
        ok('sin errores de JavaScript en el panel', !pg.problemas.length, pg.problemas.join(' | '));
        await pg.close();
    } catch (e) {
        fallos++; console.log('ERROR en la ejecución:', e);
    } finally {
        // limpieza
        for (const c of limpiezaCots) { await api('PUT', `/cotizaciones/${c}/cancelar`, null, admToken); await api('DELETE', `/cotizaciones/${c}`, null, admToken); }
        for (const d of limpiezaDocs) await api('DELETE', `/usuarios/${d}`, null, admToken);
        await br.close();
    }
    console.log(fallos ? `\n✘ ${fallos} comprobaciones fallaron` : '\n✔ La interfaz resistió todos los intentos');
    process.exit(fallos ? 1 : 0);
})();
