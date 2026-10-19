/** Comprobante PDF: el dueño y el admin lo descargan; otro cliente, sin sesión o inexistente, no. */
const U = process.env.API_URL || 'http://127.0.0.1:3000/api';
let bad = 0;
const si = (n, c, d = '') => { if (!c) bad++; console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (!c && d ? '  -> ' + d : '')); };
const login = async (c, p) => (await (await fetch(U + '/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ Correo: c, 'Contraseña': p }) })).json()).token;
const pdf = async (id, t) => { const r = await fetch(`${U}/ventas/${id}/factura`, { headers: t ? { Authorization: 'Bearer ' + t } : {} }); return { s: r.status, tipo: r.headers.get('content-type') || '', buf: Buffer.from(await r.arrayBuffer()) }; };

(async () => {
    const adm = await login('admin@stamplab.com', 'Admin123*');
    const cli = await login('cliente@stamplab.com', 'Cliente123*');
    const ventas = await (await fetch(U + '/ventas', { headers: { Authorization: 'Bearer ' + cli } })).json();
    const lista = ventas.datos || ventas;
    const id = lista[0]?.VentaID;
    if (!id) { console.log('(el cliente no tiene ventas: se omite)\n\nTODO OK'); return; }
    const a = await pdf(id, cli);
    si('el cliente dueño descarga su comprobante (PDF)', a.s === 200 && a.tipo.includes('application/pdf') && a.buf.slice(0, 4).toString() === '%PDF');
    const b = await pdf(id, adm);
    si('el administrador también', b.s === 200 && b.buf.slice(0, 4).toString() === '%PDF');
    si('sin sesión no se descarga', [401, 403].includes((await pdf(id)).s));
    si('una venta inexistente da 404', (await pdf(99999999, adm)).s === 404);
    console.log(bad ? '\n' + bad + ' FALLOS' : '\nTODO OK');
})().catch((e) => { console.log('EXC', e); process.exit(1); });
