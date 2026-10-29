import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaTags, FaSyncAlt, FaTrashAlt, FaInfoCircle, FaExclamationTriangle, FaTools, FaCheck } from "react-icons/fa";
import Swal from "sweetalert2";
import { escapeHtml } from "../utils/escapeHtml";
import { getTarifas, guardarTarifa, eliminarTarifa } from "../Services/api-tarifas/tarifas";
import { getTecnicas, getPartes } from "../Services/api-cotizacion-landing/cotizacion-landing";
import { C } from "../config/tokens";

const MAX = 99999999;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
.cf-p-tar, .cf-p-tar * { box-sizing: border-box; }
.cf-p-tar { font-family: 'Outfit', sans-serif; background: ${C.bg}; min-height: 100%; padding: 28px 32px; }
.cf-p-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
.cf-p-h1 { margin: 0; font-weight: 800; font-size: 22px; color: ${C.navy}; letter-spacing: -.02em; }
.cf-p-sub { margin: 3px 0 0; color: ${C.muted}; font-size: 13px; }
.cf-p-info { background: #f0f4ff; border: 1px solid #c7d9ff; border-radius: 14px; padding: 12px 16px; margin-bottom: 18px; color: #1e40af; font-size: 13px; display: flex; gap: 10px; align-items: flex-start; line-height: 1.5; }
.cf-p-info svg { margin-top: 3px; flex-shrink: 0; }
.cf-p-card { background: #fff; border: 1px solid #eef2f7; border-radius: 18px; box-shadow: 0 2px 16px rgba(15,23,42,.05); overflow: hidden; }
.cf-p-scroll { overflow-x: auto; }
.cf-p-matrix { border-collapse: separate; border-spacing: 0; width: 100%; font-size: 13px; }
.cf-p-matrix th { background: linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%); color: #fff; font-size: 11px; font-weight: 700; padding: 12px 14px; letter-spacing: .05em; text-transform: uppercase; text-align: left; white-space: nowrap; }
.cf-p-matrix th.cf-p-corner, .cf-p-matrix td.cf-p-tec { position: sticky; left: 0; z-index: 1; }
.cf-p-matrix td { padding: 9px 12px; border-bottom: 1px solid #eef2f7; vertical-align: top; min-width: 150px; }
.cf-p-matrix td.cf-p-tec { background: #fff; font-weight: 700; color: ${C.navy}; min-width: 160px; vertical-align: middle; box-shadow: 1px 0 0 #eef2f7; }
.cf-p-matrix tbody tr:hover td { background: #f8faff; }
.cf-p-cell { display: flex; align-items: center; gap: 6px; }
.cf-p-money { position: relative; flex: 1; min-width: 0; }
.cf-p-money::before { content: "$"; position: absolute; left: 10px; top: 9px; color: ${C.muted}; font-weight: 700; font-size: 13px; pointer-events: none; }
.cf-p-in { width: 100%; padding: 8px 10px 8px 22px; border: 1.5px solid ${C.border}; border-radius: 9px; font-size: 13px; font-weight: 700; font-family: 'Outfit', sans-serif; color: ${C.navy}; outline: none; background: #fff; transition: border-color .18s, box-shadow .18s; }
.cf-p-in::placeholder { color: #cbd5e1; font-weight: 500; }
.cf-p-in:focus { border-color: ${C.accent}; box-shadow: 0 0 0 3px rgba(79,142,247,.15); }
.cf-p-in.cf-p-inv { border-color: ${C.danger}; background: #fff7f7; }
.cf-p-in.cf-p-saved { border-color: #bbf7d0; background: #f0fdf4; }
.cf-p-x { width: 30px; height: 34px; border-radius: 9px; border: 1.5px solid #fecaca; background: #fef2f2; color: ${C.danger}; cursor: pointer; display: grid; place-items: center; flex-shrink: 0; }
.cf-p-x:hover { background: ${C.danger}; color: #fff; }
.cf-p-x:focus-visible, .cf-p-btn:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
.cf-p-errmsg { color: ${C.danger}; font-size: 11.5px; font-weight: 600; margin-top: 3px; }
.cf-p-btn { border: 1.5px solid ${C.border}; border-radius: 10px; padding: 8px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; font-family: 'Outfit', sans-serif; background: #fff; color: ${C.navy}; }
.cf-p-btn:hover:not(:disabled) { background: #f1f5f9; }
.cf-p-btn:disabled { opacity: .55; cursor: not-allowed; }
.cf-p-btn.bad { color: ${C.danger}; border-color: #fecaca; }
.cf-p-empty { text-align: center; padding: 50px 16px; }
.cf-p-empty-ic { width: 66px; height: 66px; border-radius: 20px; margin: 0 auto 14px; display: grid; place-items: center; background: linear-gradient(135deg, #eef4ff, #f3e8ff); color: ${C.accent}; font-size: 26px; }
.cf-p-empty h2 { margin: 0 0 4px; font-weight: 800; font-size: 15px; color: ${C.navy}; }
.cf-p-empty p { margin: 0; font-size: 13px; color: ${C.muted}; }
.cf-p-skel { height: 14px; border-radius: 7px; background: linear-gradient(90deg,#eef2f7 0px,#f8fafc 120px,#eef2f7 240px); background-size: 800px 100%; animation: cf-p-shimmer 1.2s linear infinite; }
@keyframes cf-p-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
@keyframes cf-p-spin { to { transform: rotate(360deg); } }
.cf-p-spin { animation: cf-p-spin .8s linear infinite; }
.cf-p-err { background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 14px; padding: 14px 18px; color: ${C.danger}; font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
.cf-p-legend { padding: 10px 16px; font-size: 12px; color: ${C.muted}; border-top: 1px solid #eef2f7; background: #fbfcfe; }
@media (max-width: 640px) { .cf-p-tar { padding: 20px 16px; } }
@media (prefers-reduced-motion: reduce) { .cf-p-skel, .cf-p-spin { animation: none; } }
`;

const errMsg = (e, fallback) => e?.response?.data?.message || e?.response?.data?.error || fallback;
const lista = (r) => (Array.isArray(r) ? r : Array.isArray(r?.datos) ? r.datos : []);

/* Valida un costo en pesos: entero >= 0. Devuelve "" si es válido. */
const validarTarifa = (valor) => {
    const v = String(valor ?? "").trim();
    if (!/^\d+$/.test(v)) return "Solo números enteros, sin puntos ni símbolos.";
    if (Number(v) > MAX) return "El valor es demasiado alto.";
    return "";
};

const Celda = ({ tecnica, parte, tarifa, onGuardar, onEliminar }) => {
    const original = tarifa ? String(Math.round(Number(tarifa.Costo) || 0)) : "";
    const [valor, setValor] = useState(original);
    const [error, setError] = useState("");
    const [estado, setEstado] = useState("idle"); // idle | saving | saved
    const cancelado = useRef(false);

    useEffect(() => { setValor(original); setError(""); }, [original]);

    const confirmar = async () => {
        if (cancelado.current) { cancelado.current = false; return; }
        const v = valor.trim();
        if (v === original) { setError(""); return; }
        if (v === "") { // vaciar la celda equivale a quitar la tarifa
            if (tarifa) await onEliminar(tarifa, tecnica, parte, () => setValor(original));
            return;
        }
        const e = validarTarifa(v);
        setError(e);
        if (e) return;
        setEstado("saving");
        const ok = await onGuardar(tecnica, parte, Number(v));
        setEstado(ok ? "saved" : "idle");
        if (ok) setTimeout(() => setEstado("idle"), 1400);
    };

    const id = `tarifa-${tecnica.TecnicaID}-${parte.ParteID}`;
    return (
        <div>
            <div className="cf-p-cell">
                <div className="cf-p-money">
                    <input id={id} className={`cf-p-in ${error ? "cf-p-inv" : ""} ${estado === "saved" ? "cf-p-saved" : ""}`} inputMode="numeric" autoComplete="off"
                        placeholder="Sin tarifa" value={valor} disabled={estado === "saving"}
                        aria-label={`Costo de ${tecnica.Nombre} en ${parte.Nombre}`} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined}
                        onChange={e => { setValor(e.target.value); if (error) setError(""); }}
                        onBlur={confirmar}
                        onKeyDown={e => {
                            if (e.key === "Enter") e.currentTarget.blur();
                            if (e.key === "Escape") { cancelado.current = true; setValor(original); setError(""); e.currentTarget.blur(); }
                        }} />
                </div>
                {estado === "saved" && <FaCheck size={13} color={C.success} aria-label="Guardado" />}
                {tarifa && estado !== "saved" && (
                    <button className="cf-p-x" type="button" title="Quitar tarifa" aria-label={`Quitar la tarifa de ${tecnica.Nombre} en ${parte.Nombre}`}
                        onClick={() => onEliminar(tarifa, tecnica, parte)}><FaTrashAlt size={11} /></button>
                )}
            </div>
            {error && <div id={`${id}-e`} className="cf-p-errmsg" role="alert">{error}</div>}
        </div>
    );
};

const Tarifas = () => {
    const [tecnicas, setTecnicas] = useState([]);
    const [partes, setPartes] = useState([]);
    const [tarifas, setTarifas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const cargar = useCallback(async () => {
        setCargando(true); setError("");
        try {
            const [t, p, f] = await Promise.all([getTecnicas(), getPartes(), getTarifas()]);
            setTecnicas(lista(t).filter(x => x.Estado !== false && x.Estado !== 0));
            setPartes(lista(p));
            setTarifas(lista(f));
        } catch (e) {
            setError(e?.response?.status === 404
                ? "Las tarifas todavía no están disponibles en el servidor."
                : "No pudimos cargar las tarifas. Revisa tu conexión e inténtalo de nuevo.");
        } finally { setCargando(false); }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const mapa = useMemo(() => {
        const m = new Map();
        tarifas.forEach(t => m.set(`${t.TecnicaID}-${t.ParteID}`, t));
        return m;
    }, [tarifas]);

    const guardar = async (tecnica, parte, costo) => {
        try {
            await guardarTarifa({ TecnicaID: tecnica.TecnicaID, ParteID: parte.ParteID, Costo: costo });
            // Se recargan las tarifas para tener el TarifaID y los datos tal como quedaron en el servidor
            try { setTarifas(lista(await getTarifas())); } catch { /* se conserva la lista anterior */ }
            return true;
        } catch (e) {
            Swal.fire({ icon: "error", title: "No se pudo guardar la tarifa", text: errMsg(e, "Intenta de nuevo.") });
            return false;
        }
    };

    const eliminar = async (tarifa, tecnica, parte, alCancelar) => {
        const r = await Swal.fire({
            title: "¿Quitar esta tarifa?",
            html: `<p style="margin:0"><b>${escapeHtml(tecnica.Nombre)}</b> · ${escapeHtml(parte.Nombre)}</p><p style="margin:6px 0 0;font-size:13px;color:#64748b">Los diseños de ese tipo volverán a costearse a mano.</p>`,
            icon: "warning", showCancelButton: true, confirmButtonText: "Sí, quitar", cancelButtonText: "Cancelar",
            confirmButtonColor: C.danger, cancelButtonColor: C.navy,
        });
        if (!r.isConfirmed) { alCancelar?.(); return; }
        try {
            await eliminarTarifa(tarifa.TarifaID);
            setTarifas(prev => prev.filter(t => t.TarifaID !== tarifa.TarifaID));
            Swal.fire({ icon: "success", title: "Tarifa eliminada", toast: true, position: "top-end", timer: 1800, showConfirmButton: false });
        } catch (e) {
            alCancelar?.();
            Swal.fire({ icon: "error", title: "No se pudo quitar la tarifa", text: errMsg(e, "Intenta de nuevo.") });
        }
    };

    const sinDatos = !cargando && !error && (tecnicas.length === 0 || partes.length === 0);

    return (
        <>
            <style>{CSS}</style>
            <div className="cf-p-tar">
                <div className="cf-p-head">
                    <div>
                        <h1 className="cf-p-h1">Tarifas de técnicas</h1>
                        <p className="cf-p-sub">{cargando ? "Cargando..." : `${tarifas.length} tarifa${tarifas.length !== 1 ? "s" : ""} definida${tarifas.length !== 1 ? "s" : ""}`}</p>
                    </div>
                    <button className="cf-p-btn" onClick={cargar} disabled={cargando} aria-label="Recargar tarifas">
                        <FaSyncAlt className={cargando ? "cf-p-spin" : undefined} aria-hidden="true" /> Actualizar
                    </button>
                </div>

                <div className="cf-p-info">
                    <FaInfoCircle aria-hidden="true" />
                    <span>
                        Define cuánto cuesta aplicar cada técnica en cada parte de la prenda (en pesos, por unidad). Al revisar una cotización, el botón
                        <b> Aplicar tarifas</b> rellena automáticamente el costo de los diseños que aún no lo tienen, y los clientes ven un estimado.
                        Escribe el valor y presiona Enter (o sal del campo) para guardar; Esc cancela; vaciar la casilla quita la tarifa.
                    </span>
                </div>

                {error && (
                    <div className="cf-p-err" role="alert">
                        <FaExclamationTriangle aria-hidden="true" /> {error}
                        <button className="cf-p-btn bad" onClick={cargar}>Reintentar</button>
                    </div>
                )}

                {!error && (
                    <div className="cf-p-card">
                        {cargando ? (
                            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }} aria-busy="true">
                                {[0, 1, 2, 3].map(i => <div key={i} className="cf-p-skel" style={{ width: `${85 - i * 12}%` }} />)}
                            </div>
                        ) : sinDatos ? (
                            <div className="cf-p-empty">
                                <div className="cf-p-empty-ic"><FaTools aria-hidden="true" /></div>
                                <h2>{tecnicas.length === 0 ? "Aún no hay técnicas activas" : "Aún no hay partes de prenda"}</h2>
                                <p>{tecnicas.length === 0 ? "Crea al menos una técnica en Servicios > Técnicas para poder ponerle tarifa." : "Se necesitan partes de prenda (pecho, espalda, manga...) para definir tarifas."}</p>
                            </div>
                        ) : (
                            <>
                                <div className="cf-p-scroll" tabIndex={0} role="region" aria-label="Matriz de tarifas por técnica y parte">
                                    <table className="cf-p-matrix">
                                        <thead>
                                            <tr>
                                                <th className="cf-p-corner" scope="col">Técnica \ Parte</th>
                                                {partes.map(p => <th key={p.ParteID} scope="col">{p.Nombre}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tecnicas.map(t => (
                                                <tr key={t.TecnicaID}>
                                                    <td className="cf-p-tec">{t.Nombre}</td>
                                                    {partes.map(p => (
                                                        <td key={p.ParteID}>
                                                            <Celda tecnica={t} parte={p} tarifa={mapa.get(`${t.TecnicaID}-${p.ParteID}`)} onGuardar={guardar} onEliminar={eliminar} />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {tarifas.length === 0 && <div className="cf-p-legend">Todavía no hay tarifas: escribe un valor en cualquier casilla para crear la primera.</div>}
                            </>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default Tarifas;
