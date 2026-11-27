import { VT } from "./ventasUi";

/* Piezas de las tablas de pedidos (Ventas): filas de carga y paginación */

/* ── Filas skeleton mientras carga ── */
export const SkeletonRows = ({ cols = 7, rows = 6 }) => (
    <>
        {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="vt-skel-row">
                {Array.from({ length: cols }).map((__, c) => (
                    <td key={c} style={{ padding: "16px" }}>
                        {c === 1 ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div className="vt-skel" style={{ width: 34, height: 34, borderRadius: "50%" }} />
                                <div style={{ flex: 1 }}><div className="vt-skel" style={{ width: "70%", marginBottom: 6 }} /><div className="vt-skel" style={{ width: "40%", height: 9 }} /></div>
                            </div>
                        ) : (
                            <div className="vt-skel" style={{ width: c === cols - 1 ? 70 : `${50 + ((r * 7 + c * 13) % 40)}%`, marginLeft: c >= 3 && c !== 5 ? "auto" : 0 }} />
                        )}
                    </td>
                ))}
            </tr>
        ))}
    </>
);

/* ── Paginación ── */
const ITEMS_POR_PAGINA_OPCIONES = [5, 10, 20, 50];
export const Paginacion = ({ paginaActual, totalPaginas, totalItems, itemsPorPagina, onCambiarPagina, onCambiarItemsPorPagina, desde, hasta }) => {
    if (totalItems === 0) return null;
    const paginas = [];
    const rangoIzq = Math.max(2, paginaActual - 2);
    const rangoDer = Math.min(totalPaginas - 1, paginaActual + 2);
    paginas.push(1);
    if (rangoIzq > 2) paginas.push("...");
    for (let i = rangoIzq; i <= rangoDer; i++) paginas.push(i);
    if (rangoDer < totalPaginas - 1) paginas.push("...");
    if (totalPaginas > 1) paginas.push(totalPaginas);

    return (
        <div className="vt-pag">
            <style>{`
                .vt-pag { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-top:1px solid #eef2f7; background:#fff; flex-wrap:wrap; gap:12px; font-family:'Outfit',sans-serif; }
                .vt-pbtn { min-width:34px; height:34px; border-radius:9px; border:1.5px solid #e2e8f0; background:#fff; color:#64748b; font-size:13px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; font-family:'Outfit',sans-serif; transition:all .18s; padding:0 8px; }
                .vt-pbtn:hover:not(:disabled):not(.on) { background:#f0f4ff; border-color:#4f8ef7; color:#4f8ef7; }
                .vt-pbtn.on { background:#1a2540; border-color:#1a2540; color:#fff; font-weight:700; cursor:default; box-shadow:0 4px 10px rgba(26,37,64,.25); }
                .vt-pbtn:disabled { opacity:.4; cursor:not-allowed; }
                .vt-pag select { border:1.5px solid #e2e8f0; border-radius:8px; padding:4px 10px; font-size:12px; font-family:'Outfit',sans-serif; outline:none; color:#1a2540; cursor:pointer; background:#fff; }
                .vt-pag select:focus { border-color:#4f8ef7; }
            `}</style>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: VT.muted }}>
                    Mostrando <strong style={{ color: VT.navy }}>{desde}–{hasta}</strong> de <strong style={{ color: VT.navy }}>{totalItems}</strong> pedidos
                </span>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: VT.muted }}>
                    Por página:
                    <select className="vt-per-page" value={itemsPorPagina} onChange={e => onCambiarItemsPorPagina(Number(e.target.value))}>
                        {ITEMS_POR_PAGINA_OPCIONES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button className="vt-pbtn" aria-label="Página anterior" onClick={() => onCambiarPagina(paginaActual - 1)} disabled={paginaActual === 1}>‹</button>
                {paginas.map((p, i) => p === "..."
                    ? <span key={`e-${i}`} style={{ padding: "0 4px", color: VT.muted, fontSize: 13 }}>…</span>
                    : <button key={p} className={`vt-pbtn ${p === paginaActual ? "on" : ""}`} onClick={() => p !== paginaActual && onCambiarPagina(p)}>{p}</button>
                )}
                <button className="vt-pbtn" aria-label="Página siguiente" onClick={() => onCambiarPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas}>›</button>
            </div>
        </div>
    );
};
