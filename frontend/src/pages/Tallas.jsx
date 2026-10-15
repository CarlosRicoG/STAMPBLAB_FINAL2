import { useState, useEffect } from "react";
import { FaPlusCircle, FaEdit, FaTrash, FaBoxOpen } from "react-icons/fa";
import Swal from "sweetalert2";

import TallasForm from "./formularios_dash/TallasForm.jsx";
import { getTallas, deleteTalla } from "../Services/api-tallas/tallas.js";

/* ── Tokens de color (mismos que Técnicas) ── */
const C = {
    navy: "#1a2540",
    navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
    accent: "#4f8ef7",
    accentSoft: "#f0f4ff",
    accentBorder: "#c7d9ff",
    success: "#16a34a",
    warning: "#d97706",
    danger: "#dc2626",
    muted: "#64748b",
    border: "#e2e8f0",
    bg: "#f8fafc",
};

const Badge = ({ type, children }) => {
    const map = {
        success: { bg: "#f0fdf4", color: C.success, border: "#bbf7d0" },
        warning: { bg: "#fffbeb", color: C.warning, border: "#fde68a" },
        danger: { bg: "#fef2f2", color: C.danger, border: "#fecaca" },
        accent: { bg: C.accentSoft, color: C.accent, border: C.accentBorder },
        navy: { bg: C.navy, color: "#fff", border: C.navy },
        muted: { bg: "#f1f5f9", color: C.muted, border: "#e2e8f0" },
    };
    const s = map[type] || map.muted;
    return (
        <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>
            {children}
        </span>
    );
};

const TH = { background: C.navyGrad, color: "#fff", fontSize: 11, fontWeight: 700, padding: "11px 14px", whiteSpace: "nowrap", letterSpacing: "0.04em" };

const Tallas = () => {
    const [search, setSearch] = useState("");
    const [tallas, setTallas] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [tallaEdit, setTallaEdit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => { fetchTallas(); }, []);

    const fetchTallas = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getTallas();
            if (result.estado) setTallas(result.datos);
            else setError("Error al cargar tallas");
        } catch (err) {
            setError("Error al cargar las tallas: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        await fetchTallas();
        setShowForm(false);
        setTallaEdit(null);
    };

    const handleEdit = (t) => { setTallaEdit(t); setShowForm(true); };
    const handleCloseForm = () => { setShowForm(false); setTallaEdit(null); };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "¿Eliminar talla?",
            text: "Esta acción no se puede revertir.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: C.danger,
            cancelButtonColor: C.navy,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
            try {
                setLoading(true);
                const response = await deleteTalla(id);
                if (response.estado) {
                    await fetchTallas();
                    Swal.fire({ toast: true, icon: "success", title: "Talla eliminada", position: "top-end", showConfirmButton: false, timer: 2000 });
                } else throw new Error(response.mensaje);
            } catch (err) {
                Swal.fire({ icon: "error", title: "Error", text: err.message || "No se pudo eliminar la talla", confirmButtonColor: C.danger });
            } finally { setLoading(false); }
        }
    };

    const filtered = tallas.filter(t => t.Nombre.toLowerCase().includes(search.toLowerCase()));

    if (showForm) return <TallasForm onClose={handleCloseForm} onSave={handleSave} tallaEdit={tallaEdit} tallasExistentes={tallas} />;

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .tal-row:hover { background: ${C.accentSoft} !important; }
        .icon-btn { transition: all 0.18s; }
        .icon-btn:hover { transform: scale(1.08); }
      `}</style>

            <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 32px", fontFamily: "'Outfit',sans-serif" }}>

                {/* ── HEADER ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                    <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>Gestión de Tallas</h4>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <input type="text" placeholder="Buscar talla..." value={search} onChange={e => setSearch(e.target.value)}
                            style={{ border: `1.5px solid ${C.border}`, borderRadius: 9, padding: "8px 14px", fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", width: 220, color: "#0f172a" }}
                            onFocus={e => e.target.style.borderColor = C.accent}
                            onBlur={e => e.target.style.borderColor = C.border} />
                        <button onClick={() => { setTallaEdit(null); setShowForm(true); }} disabled={loading}
                            style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 8, opacity: loading ? 0.7 : 1 }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#2d3f6e"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = C.navy; }}>
                            <FaPlusCircle size={15} /> Agregar Talla
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{ background: "#fef2f2", border: `1.5px solid #fecaca`, borderRadius: 12, padding: "12px 18px", marginBottom: 20, color: C.danger, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 12 }}>
                        {error}
                        <button onClick={fetchTallas} style={{ background: C.danger, color: "#fff", border: "none", borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Reintentar</button>
                    </div>
                )}

                {/* ── TABLA ── */}
                <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px #f1f5f9", overflow: "hidden", animation: "fadeIn 0.3s ease" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                        <thead>
                            <tr>
                                {["ID", "Nombre", "Precio Talla", "Acciones"].map((h, i) => (
                                    <th key={i} style={{ ...TH, textAlign: i === 3 ? "center" : "left", borderTopLeftRadius: i === 0 ? 18 : 0, borderTopRightRadius: i === 3 ? 18 : 0 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} style={{ textAlign: "center", padding: "48px 0" }}>
                                    <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                                    <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>Cargando tallas...</p>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={4} style={{ textAlign: "center", padding: "48px 0" }}>
                                    <FaBoxOpen style={{ color: C.muted, opacity: 0.3, fontSize: 32, marginBottom: 10 }} />
                                    <p style={{ color: C.muted, marginBottom: 14, fontSize: 13 }}>
                                        {search ? "No se encontraron tallas con ese nombre." : "No hay tallas registradas."}
                                    </p>
                                    {!search && <button onClick={() => { setTallaEdit(null); setShowForm(true); }} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Crear primera talla</button>}
                                </td></tr>
                            ) : (
                                filtered.map((t, idx) => (
                                    <tr key={t.TallaID} className="tal-row" style={{ background: idx % 2 === 0 ? "#fff" : C.accentSoft, borderBottom: `1px solid ${C.border}`, transition: "background 0.15s" }}>
                                        <td style={{ padding: "11px 14px" }}>
                                            <Badge type="accent">{t.TallaID}</Badge>
                                        </td>
                                        <td style={{ padding: "11px 14px", fontWeight: 600, color: C.navy }}>{t.Nombre}</td>
                                        <td style={{ padding: "11px 14px" }}>
                                            {t.Precio !== null && t.Precio !== undefined
                                                ? <Badge type="success">$ {t.Precio}</Badge>
                                                : <Badge type="muted">Sin precio</Badge>
                                            }
                                        </td>
                                        <td style={{ padding: "11px 14px", textAlign: "center" }}>
                                            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                                                <button className="icon-btn" onClick={() => handleEdit(t)} title="Editar"
                                                    style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.warning}20`, background: `${C.warning}0d`, color: C.warning, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <FaEdit size={12} />
                                                </button>
                                                <button className="icon-btn" onClick={() => handleDelete(t.TallaID)} title="Eliminar"
                                                    style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.danger}20`, background: `${C.danger}0d`, color: C.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default Tallas;