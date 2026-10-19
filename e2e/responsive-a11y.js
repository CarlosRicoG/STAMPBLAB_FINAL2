/**
 * Celular (390px) y accesibilidad basica de todas las pantallas del cliente y del panel.
 *  - sin desbordes horizontales (scroll lateral)
 *  - imagenes con texto alternativo, botones/enlaces con nombre, campos con etiqueta
 *   BASE_URL=... node responsive-a11y.js
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SHOTS = path.join(__dirname, 'capturas', 'movil'); fs.mkdirSync(SHOTS, { recursive: true });
let fallos = 0;
const ok = (n, c, d = '') => { if (!c) fallos++; console.log(`  ${c ? '✔' : '✘'} ${n}${!c && d ? '  -> ' + d : ''}`); };

const auditar = () => {
    const nombre = (el) => (el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || el.textContent || '').trim();
    const visible = (el) => !!(el.offsetParent || el.getClientRects().length) && getComputedStyle(el).visibility !== 'hidden';
    return {
        desborde: document.documentElement.scrollWidth - window.innerWidth,
        imgSinAlt: [...document.images].filter((i) => i.getAttribute('alt') === null && visible(i)).map((i) => (i.currentSrc || i.src).split('/').pop().slice(0, 40)),
        botonesSinNombre: [...document.querySelectorAll('button,a[href]')].filter((b) => visible(b) && !nombre(b) && !b.querySelector('img[alt]:not([alt=""])')).map((b) => (b.className || b.tagName).toString().slice(0, 40)),
        camposSinEtiqueta: [...document.querySelectorAll('input:not([type=hidden]):not([type=file]),select,textarea')].filter((i) => visible(i) && !i.getAttribute('aria-label') && !i.getAttribute('placeholder') && !i.id && !i.closest('label') && !i.getAttribute('title')).length,
        h1: document.querySelectorAll('h1').length,
        idioma: document.documentElement.lang,
    };
};

(async () => {
    const br = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
    const ctx = await br.createBrowserContext(); const pg = await ctx.newPage();
    await pg.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    const set = (s, v) => pg.evaluate((s, v) => { const el = document.querySelector(s); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); }, s, v);
    const login = async (c, p) => { await pg.goto(BASE + '/login', { waitUntil: 'networkidle2' }); await set('input[type=email]', c); await set('input[type=password]', p); await pg.evaluate(() => document.querySelector('button[type=submit]').form.requestSubmit()); await sleep(3500); };
    const resultados = [];
    const revisar = async (ruta, etiqueta) => {
        await pg.goto(BASE + ruta, { waitUntil: 'networkidle2' }); await sleep(1300);
        await pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); } window.scrollTo(0, 0); });
        await sleep(400);
        const a = await pg.evaluate(auditar);
        resultados.push({ etiqueta, a });
        await pg.screenshot({ path: path.join(SHOTS, etiqueta.replace(/\W+/g, '_') + '.png') });
        ok(`${etiqueta}: sin scroll horizontal`, a.desborde <= 2, `sobra ${a.desborde}px`);
    };

    console.log('\n▶ Páginas públicas (390px)');
    for (const [r, e] of [['/landing', 'Inicio'], ['/servicios', 'Servicios'], ['/productosLanding', 'Catálogo'], ['/cotizacionesLanding', 'Cotizar'], ['/login', 'Login'], ['/signup', 'Registro'], ['/recuperarcontraseña', 'Recuperar']]) await revisar(r, e);
    console.log('\n▶ Zona del cliente (390px)');
    await login('cliente@stamplab.com', 'Cliente123*');
    for (const [r, e] of [['/miscompras', 'Mis compras'], ['/miscotizaciones', 'Mis cotizaciones'], ['/editarperfil', 'Editar perfil']]) await revisar(r, e);

    console.log('\n▶ Accesibilidad básica (todas las pantallas revisadas)');
    for (const { etiqueta, a } of resultados) {
        const problemas = [];
        if (a.imgSinAlt.length) problemas.push(`${a.imgSinAlt.length} imagen(es) sin alt (${a.imgSinAlt.slice(0, 2).join(', ')})`);
        if (a.botonesSinNombre.length) problemas.push(`${a.botonesSinNombre.length} botón(es)/enlace(s) sin nombre accesible (${a.botonesSinNombre.slice(0, 2).join(' | ')})`);
        if (a.camposSinEtiqueta) problemas.push(`${a.camposSinEtiqueta} campo(s) sin etiqueta`);
        if (a.h1 !== 1) problemas.push(`${a.h1} títulos h1 (debe haber 1)`);
        ok(`${etiqueta}: ${problemas.length ? '' : 'imágenes, botones y campos con nombre; 1 solo h1'}`, !problemas.length, problemas.join('; '));
    }
    console.log(`\nIdioma declarado en <html lang>: "${resultados[0].a.idioma}" ${resultados[0].a.idioma === 'es' ? '✔' : '✘ (debería ser "es")'}`);
    if (resultados[0].a.idioma !== 'es') fallos++;
    await br.close();
    console.log('\n' + (fallos ? `✘ ${fallos} comprobaciones fallaron (capturas en e2e/capturas/movil)` : '✔ Móvil y accesibilidad básica OK'));
    process.exit(fallos ? 1 : 0);
})().catch((e) => { console.error('ERROR:', e); process.exit(2); });
