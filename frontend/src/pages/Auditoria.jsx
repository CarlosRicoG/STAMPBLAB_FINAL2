import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import API_BASE from "../config/api";

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const fmt = (f) => new Date(f).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
const COLOR = { POST: "#16a34a", PUT: "#4f8ef7", PATCH: "#7c3aed", DELETE: "#dc2626" };

export default function Auditoria() {
    const [filas, setFilas] = useState([]);
    const [meta, setMeta] = useState({ total: 0, totalPaginas: 1, entidades: [] });
    const [pagina, setPagina] = useState(1);
    const [f, setF] = useState({ q: "", entidad: "", metodo: "", desde: "", hasta: "" });
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const cargar = useCallback(async () => {
        setCargando(true); setError("");
        try {
            const params = { page: pagina, limit: 20, ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)) };
            const { data } = await axios.get(`${API_BASE}/api/auditoria`, { params, headers: headers() });
            setFilas(data.datos); setMeta(data);
        } catch { setError("No se pudo cargar el historial."); }
        finally { setCargando(false); }
    }, [pagina, f]);

    useEffect(() => { cargar(); }, [cargar]);
    const set = (k) => (e) => { setPagina(1); setF({ ...f, [k]: e.target.value }); };
    const campo = { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 };

    return (
        <div style={{ padding: 24 }}>
            <h2 style={{ color: "#1a2540", margin: 0 }}>Historial de actividad</h2>
            <p style={{ color: "#64748b", marginTop: 4 }}>{meta.total} acciones registradas. Quién hizo qué y cuándo (las contraseñas nunca se guardan).</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "16px 0" }}>
                <input aria-label="Buscar" placeholder="Buscar ruta, detalle o ID…" value={f.q} onChange={set("q")} style={{ ...campo, minWidth: 220 }} />
                <select aria-label="Entidad" value={f.entidad} onChange={set("entidad")} style={campo}>
                    <option value="">Todas las entidades</option>
                    {meta.entidades.map((e) => <option key={e}>{e}</option>)}
                </select>
                <select aria-label="Método" value={f.metodo} onChange={set("metodo")} style={campo}>
                    <option value="">Todas las acciones</option>
                    {Object.keys(COLOR).map((m) => <option key={m}>{m}</option>)}
                </select>
                <input aria-label="Desde" type="date" value={f.desde} onChange={set("desde")} style={campo} />
                <input aria-label="Hasta" type="date" value={f.hasta} onChange={set("hasta")} style={campo} />
            </div>
            {error && <div role="alert" style={{ color: "#dc2626" }}>{error} <button onClick={cargar}>Reintentar</button></div>}
            <div style={{ overflowX: "auto", background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead><tr style={{ background: "#1a2540", color: "#fff", textAlign: "left" }}>
                        {["Fecha", "Usuario", "Acción", "Entidad", "ID", "Ruta", "Resultado"].map((h) => <th key={h} style={{ padding: "10px 12px" }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                        {cargando && <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Cargando…</td></tr>}
                        {!cargando && !filas.length && <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No hay actividad con esos filtros.</td></tr>}
                        {!cargando && filas.map((r) => (
                            <tr key={r.AuditoriaID} style={{ borderTop: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>{fmt(r.Fecha)}</td>
                                <td style={{ padding: "9px 12px" }}>{r.Usuario || r.DocumentoID || "—"}</td>
                                <td style={{ padding: "9px 12px" }}><span style={{ background: (COLOR[r.Metodo] || "#64748b") + "22", color: COLOR[r.Metodo] || "#64748b", padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>{r.Metodo}</span></td>
                                <td style={{ padding: "9px 12px" }}>{r.Entidad || "—"}</td>
                                <td style={{ padding: "9px 12px" }}>{r.EntidadID || "—"}</td>
                                <td style={{ padding: "9px 12px", color: "#64748b" }}>{r.Ruta}</td>
                                <td style={{ padding: "9px 12px", color: r.Estado >= 400 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>{r.Estado}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end", marginTop: 12 }}>
                <button disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
                <span>Página {pagina} de {meta.totalPaginas}</span>
                <button disabled={pagina >= meta.totalPaginas} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
            </div>
        </div>
    );
}
