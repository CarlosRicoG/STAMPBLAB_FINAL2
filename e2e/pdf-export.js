/** Exportar PDF de Medicion y Desempeno: debe descargar un PDF valido. */
const fs = require('fs'), path = require('path'), os = require('os');
const puppeteer = require('puppeteer-core');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-'));
    const br = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
    const pg = await br.newPage(); await pg.setViewport({ width: 1400, height: 900 });
    const cdp = await pg.createCDPSession();
    await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dir });
    const errores = []; pg.on('pageerror', (e) => errores.push(String(e))); pg.on('dialog', (d) => { errores.push('alert: ' + d.message()); d.dismiss(); });
    await pg.goto(BASE + '/login', { waitUntil: 'networkidle2' });
    const set = (s, v) => pg.evaluate((s, v) => { const el = document.querySelector(s); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); }, s, v);
    await set('input[type=email]', 'admin@stamplab.com'); await set('input[type=password]', 'Admin123*');
    await pg.evaluate(() => document.querySelector('button[type=submit]').form.requestSubmit()); await sleep(3500);
    await pg.goto(BASE + '/dashboard/mediciondesempeño', { waitUntil: 'networkidle2' }); await sleep(2500);
    await pg.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Exportar PDF/i.test(b.innerText))?.click());
    let archivo = null;
    for (let i = 0; i < 30 && !archivo; i++) { await sleep(1000); archivo = fs.readdirSync(dir).find((f) => f.endsWith('.pdf')); }
    await br.close();
    if (!archivo) { console.log('✘ no se descargó ningún PDF', errores); process.exit(1); }
    const buf = fs.readFileSync(path.join(dir, archivo));
    const esPdf = buf.slice(0, 5).toString() === '%PDF-';
    console.log(`${esPdf && buf.length > 5000 ? '✔' : '✘'} PDF descargado: ${archivo} (${(buf.length / 1024).toFixed(0)} KB, cabecera ${buf.slice(0, 8).toString().replace(/\n/g, '')})`);
    console.log(errores.length ? '✘ errores: ' + errores.join(' | ') : '✔ sin errores ni alertas');
    fs.rmSync(dir, { recursive: true, force: true });
    process.exit(esPdf && !errores.length ? 0 : 1);
})();
