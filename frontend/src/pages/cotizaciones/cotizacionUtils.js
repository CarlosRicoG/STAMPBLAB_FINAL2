import API_BASE from "../../config/api";

/* Estados de cotización (tabla estados, Tipo = cotizacion) */
export const ESTADOS = {
  1: { nombre: "Pendiente", type: "pending" },
  2: { nombre: "Aprobada", type: "approved" },
  3: { nombre: "Rechazada", type: "rejected" },
  4: { nombre: "Cancelada", type: "canceled" },
  5: { nombre: "Procesada", type: "processed" },
};
export const TYPE_POR_NOMBRE = Object.fromEntries(Object.values(ESTADOS).map(e => [e.nombre, e.type]));
export const estadoDe = (c) => {
  const nombre = c?.estado?.Nombre || ESTADOS[c?.EstadoID]?.nombre || "Pendiente";
  return { nombre, type: TYPE_POR_NOMBRE[nombre] || "pending" };
};


export const urlDiseno = (tec) => tec?.ImagenUrl || (tec?.["ImagenDiseño"] ? `${API_BASE}/api/cotizaciones/imagen/${tec["ImagenDiseño"]}` : null);

/* "[PERSONALIZADO] Buso - detalle" -> { nombre: "Buso", desc: "detalle" } */
export const parsePersonalizado = (texto) => {
  const m = /^\[PERSONALIZADO\]\s*(.+?)(?:\s+-\s+([\s\S]*))?$/.exec(texto || "");
  return m ? { nombre: m[1], desc: m[2] || "" } : null;
};
export const infoDetalle = (d) => {
  if (d.TraePrenda) return { nombre: "Prenda del cliente", tipo: "prenda", desc: d.PrendaDescripcion || "" };
  if (d.producto) return { nombre: d.producto.Nombre, tipo: "catalogo", imagen: d.producto.ImagenProducto };
  const p = parsePersonalizado(d.PrendaDescripcion);
  return { nombre: p?.nombre || "Producto personalizado", tipo: "personalizado", desc: p?.desc || "" };
};

/* Misma regla que el backend (calcularValorTotalCotizacion) para mostrar subtotales por producto */
export const precioUnitarioDetalle = (d) => {
  let unit;
  if (parseFloat(d.PrecioUnitario) > 0) unit = parseFloat(d.PrecioUnitario);
  else unit = (parseFloat(d.producto?.PrecioBase) || 0) + (parseFloat(d.tallas?.[0]?.talla?.Precio) || 0) + (parseFloat(d.insumos?.[0]?.insumo?.PrecioTela) || 0);
  return unit + (d.tecnicas || []).reduce((s, t) => s + (parseFloat(t.CostoTecnica) || 0), 0);
};

export const sinCosto = (t) => !t.CostoTecnica || parseFloat(t.CostoTecnica) <= 0;

export const validarCosto = (value) => {
  const v = String(value ?? "").trim();
  if (!v) return "Ingresa un valor.";
  if (!/^[0-9]+([.,][0-9]{1,2})?$/.test(v)) return "Solo números (sin letras ni símbolos).";
  const n = parseFloat(v.replace(",", "."));
  if (isNaN(n)) return "Valor inválido.";
  if (n <= 0) return "El costo debe ser mayor a $0.";
  if (n > 99_999_999) return "El valor es demasiado alto.";
  return "";
};

/* ── CSS propio del módulo (prefijo cz-) ── */
export const CSS = `
.cz-page, .cz-page *, .cz-modal, .cz-modal * { box-sizing: border-box; font-family: 'Outfit', sans-serif; }
@keyframes cz-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes cz-pop { from { opacity: 0; transform: translateY(18px) scale(.97); } to { opacity: 1; transform: none; } }
@keyframes cz-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
@keyframes cz-spin { to { transform: rotate(360deg); } }
@keyframes cz-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(217,119,6,.45); } 70% { box-shadow: 0 0 0 7px rgba(217,119,6,0); } }

.cz-head { display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:24px; flex-wrap:wrap; }
.cz-title { margin:0; font-weight:800; font-size:22px; color:#1a2540; letter-spacing:-.02em; }
.cz-filters { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; gap:12px; flex-wrap:wrap; }
.cz-input { padding:9px 14px; border-radius:10px; border:1.5px solid #e2e8f0; font-size:13px; outline:none; color:#0f172a; background:#fff; transition:border-color .2s, box-shadow .2s; }
.cz-input:focus { border-color:#4f8ef7; box-shadow:0 0 0 3px rgba(79,142,247,.15); }
.cz-search { position:relative; width:300px; max-width:100%; }
.cz-search svg { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#64748b; font-size:13px; }
.cz-search input { width:100%; padding-left:36px; }

.cz-tablewrap { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 1px 2px rgba(15,23,42,.05), 0 8px 24px rgba(15,23,42,.06); border:1px solid #eef2f7; }
.cz-table { width:100%; border-collapse:collapse; font-size:13px; }
.cz-table th { background:linear-gradient(90deg,#1a2540 0%,#2d3f6e 100%); color:#fff; font-size:12px; font-weight:700; padding:13px 16px; white-space:nowrap; letter-spacing:.04em; text-align:left; }
.cz-table td { padding:12px 16px; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
.cz-row { transition:background .18s, box-shadow .18s; animation:cz-fade .35s ease both; }
.cz-row:hover { background:#f5f8ff !important; box-shadow:inset 3px 0 0 #4f8ef7; }
.cz-row:hover .cz-thumb { transform:scale(1.08); box-shadow:0 6px 16px rgba(26,37,64,.18); }
.cz-thumb { width:48px; height:48px; border-radius:10px; object-fit:cover; border:2px solid #e2e8f0; transition:transform .25s, box-shadow .25s; cursor:pointer; display:flex; align-items:center; justify-content:center; background:#f0f4ff; }

.cz-badge { display:inline-flex; align-items:center; gap:6px; border-radius:999px; padding:4px 11px; font-size:11px; font-weight:700; border:1px solid; white-space:nowrap; }
.cz-badge .cz-dot { width:7px; height:7px; border-radius:50%; background:currentColor; }
.cz-badge.pending { background:#fffbeb; color:#92400e; border-color:#fde68a; }
.cz-badge.pending .cz-dot { background:#d97706; animation:cz-pulse 2s infinite; }
.cz-badge.approved { background:#f0fdf4; color:#16a34a; border-color:#bbf7d0; }
.cz-badge.processed { background:#f5f3ff; color:#7c3aed; border-color:#ddd6fe; }
.cz-badge.canceled { background:#fef2f2; color:#dc2626; border-color:#fecaca; }
.cz-badge.rejected { background:#f1f5f9; color:#475569; border-color:#cbd5e1; }
.cz-badge.navy { background:#1a2540; color:#fff; border-color:#1a2540; }
.cz-badge.money { background:#f0fdf4; color:#15803d; border-color:#bbf7d0; font-size:12px; }
.cz-badge.money.zero { background:#f8fafc; color:#94a3b8; border-color:#e2e8f0; }

.cz-act { width:32px; height:32px; border-radius:9px; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; transition:transform .18s, background .18s, box-shadow .18s; border:1.5px solid; }
.cz-act:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 6px 14px rgba(15,23,42,.12); }
.cz-act:disabled { opacity:.45; cursor:not-allowed; }

.cz-skel { height:14px; border-radius:7px; background:linear-gradient(90deg,#eef2f7 0px,#f8fafc 120px,#eef2f7 240px); background-size:800px 100%; animation:cz-shimmer 1.2s linear infinite; }
.cz-empty { text-align:center; padding:56px 20px; color:#64748b; }
.cz-empty-ico { width:72px; height:72px; border-radius:22px; margin:0 auto 14px; display:grid; place-items:center; background:linear-gradient(135deg,rgba(79,142,247,.14),rgba(124,58,237,.14)); color:#4f8ef7; font-size:28px; }

/* ── Modal detalle ── */
.cz-overlay { position:fixed; inset:0; background:rgba(15,24,36,.6); backdrop-filter:blur(3px); z-index:1050; display:flex; align-items:center; justify-content:center; padding:20px; animation:cz-fade .2s ease; }
.cz-modal { background:#f8fafc; border-radius:22px; width:100%; max-width:1100px; max-height:94vh; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 30px 80px rgba(15,24,36,.45); animation:cz-pop .32s cubic-bezier(.22,1,.36,1); }
.cz-mhead { flex-shrink:0; position:relative; padding:22px 28px 20px; color:#fff; background:radial-gradient(600px 200px at 85% -40%, rgba(124,58,237,.55), transparent 60%), linear-gradient(120deg,#0f1824 0%,#1a2540 45%,#2d3f6e 100%); overflow:hidden; }
.cz-mhead::after { content:""; position:absolute; inset:0; pointer-events:none; opacity:.35; background-image:radial-gradient(rgba(255,255,255,.18) 1px, transparent 1px); background-size:22px 22px; mask-image:linear-gradient(90deg,transparent,#000 70%); -webkit-mask-image:linear-gradient(90deg,transparent,#000 70%); }
.cz-mhead-row { position:relative; z-index:1; display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap; }
.cz-close { background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.2); border-radius:10px; width:36px; height:36px; color:#fff; cursor:pointer; display:grid; place-items:center; transition:background .2s, transform .2s; }
.cz-close:hover { background:rgba(255,255,255,.24); transform:rotate(90deg); }
.cz-total-head { text-align:right; }
.cz-total-head small { display:block; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:rgba(255,255,255,.6); font-weight:700; }
.cz-total-head strong { font-size:30px; font-weight:900; letter-spacing:-.02em; background:linear-gradient(90deg,#fff,#c7d9ff); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }

.cz-timeline { position:relative; z-index:1; display:flex; align-items:center; margin-top:18px; max-width:620px; }
.cz-step { display:flex; align-items:center; gap:8px; color:rgba(255,255,255,.5); font-size:12px; font-weight:700; white-space:nowrap; }
.cz-step i { width:26px; height:26px; border-radius:50%; display:grid; place-items:center; font-style:normal; font-size:11px; background:rgba(255,255,255,.1); border:1.5px solid rgba(255,255,255,.25); transition:all .3s; }
.cz-step.done { color:#fff; } .cz-step.done i { background:#16a34a; border-color:#16a34a; }
.cz-step.now { color:#fff; } .cz-step.now i { background:#4f8ef7; border-color:#4f8ef7; box-shadow:0 0 0 5px rgba(79,142,247,.3); }
.cz-step.bad { color:#fecaca; } .cz-step.bad i { background:#dc2626; border-color:#dc2626; }
.cz-line { flex:1; height:2px; min-width:24px; margin:0 10px; background:rgba(255,255,255,.18); border-radius:2px; }
.cz-line.done { background:linear-gradient(90deg,#16a34a,#4f8ef7); }

.cz-mbody { min-height:0; overflow-y:auto; padding:22px 28px; flex:1; }
.cz-grid2 { display:grid; grid-template-columns:1fr 300px; gap:16px; margin-bottom:22px; }
.cz-card { background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:18px 20px; box-shadow:0 1px 2px rgba(15,23,42,.04); }
.cz-label { margin:0 0 12px; font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:.1em; }
.cz-client { display:flex; gap:16px; align-items:center; }
.cz-avatar { width:54px; height:54px; border-radius:16px; flex-shrink:0; display:grid; place-items:center; color:#fff; font-weight:800; font-size:19px; background:linear-gradient(135deg,#4f8ef7,#7c3aed); box-shadow:0 8px 20px rgba(79,142,247,.35); }
.cz-client-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 18px; flex:1; }
.cz-client-grid div { display:flex; align-items:center; gap:7px; font-size:13px; color:#0f172a; min-width:0; }
.cz-client-grid svg { color:#4f8ef7; flex-shrink:0; }
.cz-client-grid span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

.cz-prod { background:#fff; border:1px solid #e2e8f0; border-radius:18px; margin-bottom:16px; overflow:hidden; animation:cz-fade .35s ease both; transition:box-shadow .25s, border-color .25s; }
.cz-prod:hover { box-shadow:0 10px 30px rgba(26,37,64,.08); border-color:#c7d9ff; }
.cz-prod-head { display:flex; gap:16px; align-items:center; padding:16px 20px; background:linear-gradient(90deg,#f5f8ff,#fff); border-bottom:1px solid #eef2f7; }
.cz-prod-img { width:76px; height:76px; border-radius:14px; object-fit:cover; border:1px solid #e2e8f0; flex-shrink:0; cursor:zoom-in; transition:transform .25s; background:#f0f4ff; display:grid; place-items:center; }
.cz-prod-img:hover { transform:scale(1.05); }
.cz-chip { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; font-size:11px; font-weight:700; background:#f0f4ff; color:#3b6fe0; border:1px solid #dbe6ff; }
.cz-chip.violet { background:#f5f3ff; color:#7c3aed; border-color:#e4dcff; }
.cz-chip.amber { background:#fffbeb; color:#92400e; border-color:#fde68a; }
.cz-chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
.cz-sub { margin-left:auto; text-align:right; flex-shrink:0; }
.cz-sub small { display:block; font-size:10px; color:#64748b; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
.cz-sub strong { font-size:17px; color:#1a2540; font-weight:800; }

.cz-designs { padding:16px 20px 18px; }
.cz-dgrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:14px; }
.cz-design { border:1px solid #ece7fb; border-radius:16px; overflow:hidden; background:#fff; display:flex; flex-direction:column; transition:transform .25s, box-shadow .25s, border-color .25s; }
.cz-design:hover { transform:translateY(-3px); box-shadow:0 12px 26px rgba(124,58,237,.12); border-color:#d9ccff; }
.cz-design.missing { border-color:#fecaca; box-shadow:inset 0 3px 0 #dc2626; }
.cz-dimg { height:170px; background:repeating-conic-gradient(#f5f3ff 0% 25%, #fff 0% 50%) 50%/18px 18px; display:grid; place-items:center; overflow:hidden; cursor:zoom-in; position:relative; }
.cz-dimg img { max-width:100%; max-height:100%; object-fit:contain; transition:transform .5s cubic-bezier(.22,1,.36,1); }
.cz-dimg:hover img { transform:scale(1.07); }
.cz-dimg .cz-zoomhint { position:absolute; bottom:8px; right:8px; background:rgba(26,37,64,.75); color:#fff; font-size:10px; font-weight:700; padding:3px 8px; border-radius:999px; opacity:0; transition:opacity .2s; }
.cz-dimg:hover .cz-zoomhint { opacity:1; }
.cz-dinfo { padding:12px 14px 14px; display:flex; flex-direction:column; gap:6px; flex:1; }
.cz-dinfo p { margin:0; font-size:12.5px; color:#0f172a; }
.cz-dinfo b { color:#7c3aed; }
.cz-cost { margin-top:auto; padding-top:10px; border-top:1px dashed #e2e8f0; display:flex; align-items:center; gap:8px; }
.cz-cost .cz-val { font-size:16px; font-weight:800; }
.cz-cost input { width:100%; min-width:0; padding:8px 10px 8px 24px; border:1.5px solid #e2e8f0; border-radius:9px; font-size:13px; font-weight:700; outline:none; transition:border-color .2s, box-shadow .2s; }
.cz-cost input:focus { border-color:#4f8ef7; box-shadow:0 0 0 3px rgba(79,142,247,.15); }
.cz-cost input.err { border-color:#dc2626; }
.cz-money { position:relative; flex:1; }
.cz-money::before { content:"$"; position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#64748b; font-weight:700; font-size:13px; }
.cz-btn { border:none; border-radius:10px; padding:9px 16px; font-size:13px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:7px; transition:transform .18s, box-shadow .18s, opacity .18s; color:#fff; white-space:nowrap; }
.cz-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 18px rgba(15,23,42,.18); }
.cz-btn:disabled { opacity:.55; cursor:not-allowed; }
.cz-btn.sm { padding:8px 12px; font-size:12px; border-radius:9px; }
.cz-btn.navy { background:linear-gradient(135deg,#1a2540,#2d3f6e); }
.cz-btn.green { background:#16a34a; } .cz-btn.blue { background:linear-gradient(135deg,#4f8ef7,#7c3aed); }
.cz-btn.red { background:#dc2626; } .cz-btn.ghost { background:#fff; color:#475569; border:1.5px solid #e2e8f0; }
.cz-btn.outline-red { background:#fff; color:#dc2626; border:1.5px solid #fecaca; }
.cz-alert { display:flex; gap:10px; align-items:center; padding:10px 14px; border-radius:12px; font-size:12.5px; font-weight:600; margin-bottom:16px; }
.cz-alert.warn { background:#fffbeb; color:#92400e; border:1px solid #fde68a; }
.cz-alert.info { background:#f0f4ff; color:#1e40af; border:1px solid #c7d9ff; }
.cz-mfoot { flex-shrink:0; padding:14px 28px; border-top:1px solid #e2e8f0; background:#fff; display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; }
.cz-mfoot > div { display:flex; gap:8px; flex-wrap:wrap; }
.cz-summary { display:flex; justify-content:flex-end; }
.cz-summary-box { min-width:280px; border-radius:16px; padding:16px 20px; color:#fff; background:linear-gradient(135deg,#1a2540,#2d3f6e 60%,#4c3a9e); box-shadow:0 14px 34px rgba(26,37,64,.3); }
.cz-summary-box div { display:flex; justify-content:space-between; font-size:12.5px; color:rgba(255,255,255,.75); margin-bottom:6px; gap:18px; }
.cz-summary-box .tot { border-top:1px solid rgba(255,255,255,.18); padding-top:10px; margin:10px 0 0; color:#fff; font-size:15px; font-weight:700; align-items:baseline; }
.cz-summary-box .tot strong { font-size:24px; font-weight:900; }

@media (max-width: 860px) {
  .cz-grid2 { grid-template-columns:1fr; }
  .cz-client-grid { grid-template-columns:1fr; }
  .cz-prod-head { flex-wrap:wrap; }
  .cz-sub { margin-left:0; text-align:left; }
  .cz-timeline { overflow-x:auto; }
  .cz-mhead, .cz-mbody, .cz-mfoot { padding-left:16px; padding-right:16px; }
  .cz-page { padding:20px 16px !important; }
  .cz-search { width:100%; }
}
`;

export const formatearFecha = (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }) : "—";

export const obtenerPrimerProducto = (detalles) => {
  if (!Array.isArray(detalles) || detalles.length === 0) return { Nombre: "Sin producto", Imagen: null, Cantidad: 0, extra: 0 };
  const d = detalles[0];
  const info = infoDetalle(d);
  const primerDiseno = detalles.flatMap(x => x.tecnicas || []).map(urlDiseno).find(Boolean);
  return { Nombre: info.nombre, Imagen: info.imagen || primerDiseno || null, Cantidad: d.Cantidad || 0, extra: detalles.length - 1, tipo: info.tipo };
};
