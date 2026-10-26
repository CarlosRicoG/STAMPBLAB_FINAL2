import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaArchive, FaCheck, FaCheckDouble, FaHistory, FaChevronUp, FaRegBellSlash, FaRegCalendarAlt } from "react-icons/fa";
import {
    listarNotificaciones, contarNoLeidas, marcarLeida, archivarNotificacion, marcarTodasLeidas, archivarTodas,
} from "../../Services/api-notificaciones/notificaciones";

const ICONOS = { cotizacion: "📝", pedido: "📦", pago: "💳", stock: "⚠️", sistema: "🔔" };
const ETIQUETAS = { cotizacion: "Cotización", pedido: "Pedido", pago: "Pago", stock: "Inventario", sistema: "General" };
const CADA_MS = 30000;

const fechaLarga = (f) => {
    const d = new Date(f);
    return Number.isNaN(d.getTime()) ? "Sin fecha" : d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};
const agruparPorFecha = (lista) => lista.reduce((grupos, n) => {
    const clave = fechaLarga(n.fecha);
    (grupos[clave] = grupos[clave] || []).push(n);
    return grupos;
}, {});

/**
 * Campana de notificaciones con panel (Activas / Historial), igual de práctica que la del ERP:
 * contador de no leídas, marcar leída, archivar, archivar todo y "cargar más".
 * Se consulta cada 30 s (solo con la pestaña visible) y al abrir el panel.
 */
export default function CampanaNotificaciones({ tono = "claro" }) {
    const navigate = useNavigate();
    const [abierto, setAbierto] = useState(false);
    const [noLeidas, setNoLeidas] = useState(0);
    const [vista, setVista] = useState("activas");
    const [items, setItems] = useState({ activas: [], historial: [] });
    const [hayMas, setHayMas] = useState({ activas: false, historial: false });
    const [pagina, setPagina] = useState({ activas: 1, historial: 1 });
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(false);
    const [archivandoTodo, setArchivandoTodo] = useState(false);
    const contenedor = useRef(null);

    const refrescarContador = useCallback(async () => {
        try { setNoLeidas(await contarNoLeidas()); } catch { /* sin conexión: se conserva el número */ }
    }, []);

    useEffect(() => {
        refrescarContador();
        const id = setInterval(() => { if (!document.hidden) refrescarContador(); }, CADA_MS);
        const alVolver = () => { if (!document.hidden) refrescarContador(); };
        document.addEventListener("visibilitychange", alVolver);
        return () => { clearInterval(id); document.removeEventListener("visibilitychange", alVolver); };
    }, [refrescarContador]);

    const cargar = useCallback(async (clave, num = 1) => {
        setCargando(true); setError(false);
        try {
            const data = await listarNotificaciones({ archivada: clave === "historial", page: num });
            const lista = Array.isArray(data?.results) ? data.results : [];
            setItems((prev) => ({ ...prev, [clave]: num === 1 ? lista : [...prev[clave], ...lista] }));
            setHayMas((prev) => ({ ...prev, [clave]: Boolean(data?.next) }));
            setPagina((prev) => ({ ...prev, [clave]: num }));
            if (typeof data?.noLeidas === "number") setNoLeidas(data.noLeidas);
        } catch { setError(true); }
        finally { setCargando(false); }
    }, []);

    useEffect(() => { if (abierto) cargar(vista, 1); }, [abierto, vista, cargar]);

    // Cerrar con Esc o al hacer clic fuera
    useEffect(() => {
        if (!abierto) return undefined;
        const tecla = (e) => { if (e.key === "Escape") setAbierto(false); };
        const fuera = (e) => { if (contenedor.current && !contenedor.current.contains(e.target)) setAbierto(false); };
        document.addEventListener("keydown", tecla);
        document.addEventListener("mousedown", fuera);
        return () => { document.removeEventListener("keydown", tecla); document.removeEventListener("mousedown", fuera); };
    }, [abierto]);

    const alternar = () => { setAbierto((a) => { if (a) setVista("activas"); return !a; }); };

    const leer = async (e, id) => {
        e.stopPropagation();
        try {
            await marcarLeida(id);
            setItems((p) => ({ ...p, activas: p.activas.map((n) => (n.id === id ? { ...n, leida: true } : n)) }));
            refrescarContador();
        } catch { /* se reintenta con el próximo clic */ }
    };
    const archivar = async (e, id) => {
        e.stopPropagation();
        try {
            await archivarNotificacion(id);
            setItems((p) => ({ ...p, activas: p.activas.filter((n) => n.id !== id) }));
            refrescarContador();
        } catch { /* idem */ }
    };
    const leerTodas = async () => {
        try { await marcarTodasLeidas(); setItems((p) => ({ ...p, activas: p.activas.map((n) => ({ ...n, leida: true })) })); setNoLeidas(0); } catch { /* idem */ }
    };
    const archivarTodo = async () => {
        if (archivandoTodo) return;
        setArchivandoTodo(true);
        try { await archivarTodas(); setItems((p) => ({ activas: [], historial: [...p.activas.map((n) => ({ ...n, archivada: true })), ...p.historial] })); setNoLeidas(0); }
        catch { /* idem */ }
        finally { setArchivandoTodo(false); }
    };
    const abrirNotificacion = async (n) => {
        if (!n.leida) { try { await marcarLeida(n.id); refrescarContador(); } catch { /* sigue */ } }
        setAbierto(false);
        if (n.enlace) navigate(n.enlace);
    };

    const sinLeer = items.activas.filter((n) => !n.leida).length;
    const lista = items[vista];

    return (
        <div className={`ntf-wrap ntf-${tono}`} ref={contenedor}>
            <style>{CSS}</style>
            <button type="button" className={`ntf-bell${abierto ? " is-open" : ""}`} onClick={alternar}
                aria-label={noLeidas ? `Notificaciones: ${noLeidas} sin leer` : "Notificaciones"} aria-haspopup="dialog" aria-expanded={abierto}>
                <FaBell size={17} />
                {noLeidas > 0 && <span className="ntf-badge" aria-hidden="true">{noLeidas > 9 ? "9+" : noLeidas}</span>}
            </button>

            {abierto && (
                <div className="ntf-panel" role="dialog" aria-label="Notificaciones">
                    <div className="ntf-head">
                        <div className="ntf-head-top">
                            <span className="ntf-pulse" />
                            <h3 className="ntf-title">Notificaciones</h3>
                            {sinLeer > 0 && <span className="ntf-count">{sinLeer}</span>}
                        </div>
                        {vista === "activas" && items.activas.length > 0 && (
                            <div className="ntf-head-actions">
                                <button type="button" className="ntf-chip" onClick={archivarTodo} disabled={archivandoTodo}><FaArchive size={12} /> {archivandoTodo ? "Archivando…" : "Archivar todo"}</button>
                                <button type="button" className="ntf-chip" onClick={leerTodas}><FaCheckDouble size={12} /> Marcar todo leído</button>
                            </div>
                        )}
                    </div>

                    <div className="ntf-tabs" role="tablist">
                        <button type="button" role="tab" aria-selected={vista === "activas"} className={`ntf-tab${vista === "activas" ? " on" : ""}`} onClick={() => setVista("activas")}><FaBell size={12} /> Activas</button>
                        <button type="button" role="tab" aria-selected={vista === "historial"} className={`ntf-tab${vista === "historial" ? " on" : ""}`} onClick={() => setVista("historial")}><FaHistory size={12} /> Historial</button>
                    </div>

                    <div className="ntf-body">
                        {cargando && lista.length === 0 ? (
                            <div className="ntf-empty"><div className="ntf-dots"><span /><span /><span /></div><p>Buscando alertas…</p></div>
                        ) : error && lista.length === 0 ? (
                            <div className="ntf-empty"><p>No pudimos cargar las notificaciones.</p><button type="button" className="ntf-chip" onClick={() => cargar(vista, 1)}>Reintentar</button></div>
                        ) : lista.length === 0 ? (
                            <div className="ntf-empty"><div className="ntf-empty-ic">{vista === "activas" ? <FaRegBellSlash size={26} /> : <FaHistory size={24} />}</div><p>{vista === "activas" ? "Sin pendientes" : "No hay registros aún"}</p></div>
                        ) : vista === "activas" ? (
                            lista.map((n, i) => (
                                <div key={n.id} role="button" tabIndex={0} className={`ntf-item${n.leida ? " read" : ""}`} style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
                                    onClick={() => abrirNotificacion(n)} onKeyDown={(e) => { if (e.key === "Enter") abrirNotificacion(n); }}>
                                    {!n.leida && <span className="ntf-bar" />}
                                    <span className="ntf-emoji" aria-hidden="true">{ICONOS[n.tipo] || ICONOS.sistema}</span>
                                    <div className="ntf-content">
                                        <p className="ntf-msg">{n.mensaje}</p>
                                        <div className="ntf-meta">
                                            <span className="ntf-time">{n.hace}</span>
                                            <span className="ntf-actions">
                                                {!n.leida && <button type="button" className="ntf-btn" title="Marcar como leída" aria-label="Marcar como leída" onClick={(e) => leer(e, n.id)}><FaCheck size={12} /></button>}
                                                <button type="button" className="ntf-btn" title="Archivar" aria-label="Archivar notificación" onClick={(e) => archivar(e, n.id)}><FaArchive size={12} /></button>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="ntf-timeline">
                                {Object.entries(agruparPorFecha(lista)).map(([dia, grupo]) => (
                                    <div key={dia} className="ntf-day">
                                        <div className="ntf-day-label"><FaRegCalendarAlt size={11} /> {dia}</div>
                                        {grupo.map((n) => (
                                            <div key={n.id} className="ntf-hist" role="button" tabIndex={0} onClick={() => { if (n.enlace) { setAbierto(false); navigate(n.enlace); } }} onKeyDown={(e) => { if (e.key === "Enter" && n.enlace) { setAbierto(false); navigate(n.enlace); } }}>
                                                <div className="ntf-hist-top"><span aria-hidden="true">{ICONOS[n.tipo] || ICONOS.sistema}</span><b>{ETIQUETAS[n.tipo] || ETIQUETAS.sistema}</b></div>
                                                <p>{n.mensaje}</p>
                                                <span className="ntf-time">{n.hace}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                        {hayMas[vista] && lista.length > 0 && (
                            <button type="button" className="ntf-more" onClick={() => cargar(vista, pagina[vista] + 1)} disabled={cargando}>{cargando ? "Cargando…" : "Cargar más"}</button>
                        )}
                    </div>

                    <div className="ntf-foot"><button type="button" className="ntf-close" onClick={() => setAbierto(false)}><FaChevronUp size={12} /> Cerrar panel</button></div>
                </div>
            )}
        </div>
    );
}

const CSS = `
.ntf-wrap { position: relative; font-family: 'Outfit', sans-serif; }
.ntf-bell { position: relative; width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; cursor: pointer;
  border: 1.5px solid #e2e8f0; background: #f8fafc; color: #1a2540; transition: all .18s; }
.ntf-bell:hover, .ntf-bell.is-open { background: #1a2540; color: #fff; border-color: #1a2540; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(26,37,64,.25); }
.ntf-bell:focus-visible { outline: 3px solid #4f8ef7; outline-offset: 2px; }
.ntf-bell:hover svg, .ntf-bell.is-open svg { animation: ntfRing .6s ease; transform-origin: 50% 0; }
.ntf-oscuro .ntf-bell { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.18); color: #fff; }
.ntf-oscuro .ntf-bell:hover, .ntf-oscuro .ntf-bell.is-open { background: #4f8ef7; border-color: #4f8ef7; }
@keyframes ntfRing { 0%,100% { transform: rotate(0); } 20% { transform: rotate(14deg); } 40% { transform: rotate(-12deg); } 60% { transform: rotate(8deg); } 80% { transform: rotate(-5deg); } }
.ntf-badge { position: absolute; top: -6px; right: -6px; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 999px; background: #dc2626; color: #fff;
  font-size: 11px; font-weight: 800; display: grid; place-items: center; border: 2px solid #fff; box-sizing: content-box; animation: ntfPop .35s cubic-bezier(.2,1.4,.4,1); }
@keyframes ntfPop { from { transform: scale(0); } to { transform: scale(1); } }

.ntf-panel { position: absolute; top: calc(100% + 12px); right: 0; width: 390px; max-width: calc(100vw - 24px); max-height: min(620px, calc(100vh - 100px));
  display: flex; flex-direction: column; overflow: hidden; z-index: 3000; background: #fff; border-radius: 18px; border: 1px solid #e2e8f0;
  box-shadow: 0 24px 60px rgba(15,23,42,.22); animation: ntfIn .32s cubic-bezier(.2,.9,.3,1.1) both; }
@keyframes ntfIn { from { opacity: 0; transform: translateY(14px) scale(.96); } to { opacity: 1; transform: none; } }
@media (max-width: 640px) { .ntf-wrap { position: static; } .ntf-panel { position: fixed; top: 70px; left: 12px; right: 12px; width: auto; max-width: none; max-height: min(72vh, calc(100vh - 90px)); } }

.ntf-head { padding: 16px 18px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 12px; }
.ntf-head-top { display: flex; align-items: center; gap: 10px; }
.ntf-pulse { width: 10px; height: 10px; border-radius: 50%; background: #4f8ef7; animation: ntfPulse 2s infinite; flex-shrink: 0; }
@keyframes ntfPulse { 0% { box-shadow: 0 0 0 0 rgba(79,142,247,.5); } 70% { box-shadow: 0 0 0 10px rgba(79,142,247,0); } 100% { box-shadow: 0 0 0 0 rgba(79,142,247,0); } }
.ntf-title { margin: 0; font-size: 16px; font-weight: 800; color: #1a2540; letter-spacing: -.01em; }
.ntf-count { background: #4f8ef7; color: #fff; font-size: 11px; font-weight: 800; border-radius: 999px; padding: 1px 8px; line-height: 18px; }
.ntf-head-actions { display: flex; gap: 8px; }
.ntf-chip { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; font: 700 12px 'Outfit', sans-serif; color: #2d5fd0; background: #eef4ff;
  border: 1px solid #c7d9ff; border-radius: 10px; padding: 7px 10px; cursor: pointer; white-space: nowrap; transition: all .15s; }
.ntf-chip:hover:not(:disabled) { background: #dbe8ff; transform: translateY(-1px); }
.ntf-chip:disabled { opacity: .55; cursor: default; }

.ntf-tabs { display: flex; gap: 4px; padding: 0 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.ntf-tab { display: inline-flex; align-items: center; gap: 6px; padding: 10px 14px; border: none; background: none; cursor: pointer; font: 700 13px 'Outfit', sans-serif;
  color: #94a3b8; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color .15s; }
.ntf-tab:hover { color: #1a2540; }
.ntf-tab.on { color: #1a2540; border-bottom-color: #4f8ef7; }

.ntf-body { flex: 1; overflow-y: auto; scrollbar-width: thin; }
.ntf-item { position: relative; display: flex; gap: 12px; padding: 14px 18px 14px 20px; border-bottom: 1px solid #f1f5f9; cursor: pointer; background: #fff;
  animation: ntfItem .35s ease both; transition: background .15s; }
@keyframes ntfItem { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: none; } }
.ntf-item:hover { background: #f8fafc; }
.ntf-item:focus-visible, .ntf-hist:focus-visible { outline: 2px solid #4f8ef7; outline-offset: -2px; }
.ntf-item.read { opacity: .72; }
.ntf-bar { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: linear-gradient(180deg, #4f8ef7, #7c3aed); }
.ntf-emoji { flex-shrink: 0; width: 38px; height: 38px; border-radius: 12px; background: #f1f5f9; display: grid; place-items: center; font-size: 18px; }
.ntf-content { flex: 1; min-width: 0; }
.ntf-msg { margin: 0 0 6px; font-size: 13.5px; line-height: 1.45; color: #0f172a; font-weight: 600; word-break: break-word; }
.ntf-item.read .ntf-msg { font-weight: 500; }
.ntf-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.ntf-time { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .04em; }
.ntf-actions { display: flex; gap: 6px; }
.ntf-btn { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; transition: all .15s; }
.ntf-btn:hover { background: #1a2540; color: #fff; border-color: #1a2540; }

.ntf-empty { text-align: center; padding: 38px 20px; color: #64748b; font-size: 14px; font-weight: 600; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.ntf-empty p { margin: 0; }
.ntf-empty-ic { width: 60px; height: 60px; border-radius: 18px; background: #f1f5f9; display: grid; place-items: center; color: #94a3b8; }
.ntf-dots { display: flex; gap: 6px; } .ntf-dots span { width: 9px; height: 9px; border-radius: 50%; background: #4f8ef7; animation: ntfDot 1s infinite ease-in-out; }
.ntf-dots span:nth-child(2) { animation-delay: .15s; } .ntf-dots span:nth-child(3) { animation-delay: .3s; }
@keyframes ntfDot { 0%,80%,100% { transform: scale(.5); opacity: .4; } 40% { transform: scale(1); opacity: 1; } }

.ntf-timeline { padding: 8px 14px 14px; }
.ntf-day-label { display: flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: capitalize; letter-spacing: .02em; padding: 12px 4px 8px; }
.ntf-hist { margin: 0 0 8px 8px; padding: 10px 12px; border-left: 3px solid #c7d9ff; background: #f8fafc; border-radius: 0 12px 12px 0; cursor: pointer; }
.ntf-hist:hover { background: #eef4ff; }
.ntf-hist-top { display: flex; align-items: center; gap: 7px; font-size: 11px; color: #4f8ef7; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 3px; }
.ntf-hist p { margin: 0 0 4px; font-size: 13px; color: #1e293b; line-height: 1.4; }
.ntf-more { display: block; width: calc(100% - 28px); margin: 10px 14px 14px; padding: 9px; border-radius: 10px; border: 1px dashed #c7d9ff; background: #f8fbff; color: #2d5fd0; font: 700 13px 'Outfit', sans-serif; cursor: pointer; }
.ntf-more:disabled { opacity: .6; }

.ntf-foot { padding: 10px 14px; border-top: 1px solid #e2e8f0; background: #f8fafc; }
.ntf-close { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; color: #1a2540;
  font: 700 13px 'Outfit', sans-serif; cursor: pointer; transition: all .15s; }
.ntf-close:hover { background: #1a2540; color: #fff; }
@media (prefers-reduced-motion: reduce) { .ntf-panel, .ntf-item, .ntf-badge, .ntf-pulse, .ntf-bell svg { animation: none !important; } }
`;
