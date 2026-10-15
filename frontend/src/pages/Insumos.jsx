import { useEffect, useState } from "react";
import { FaPlusCircle, FaEye, FaEdit, FaTrash, FaSyncAlt, FaBoxOpen } from "react-icons/fa";
import InsumoForm from "./formularios_dash/InsumoForm";
import { getInsumos, createInsumo, updateInsumo, deleteInsumo, cambiarEstadoInsumo } from "../Services/api-insumos/insumos";
import Swal from "sweetalert2";

/* ── Tokens de color ── */
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
        info: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
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

/* ── Modal detalle ── */
const DetailModal = ({ show, onClose, insumo, onEdit }) => {
    if (!show || !insumo) return null;
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 520, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", overflow: "hidden", fontFamily: "'Outfit',sans-serif" }}>
                <div style={{ background: C.navyGrad, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#fff" }}>Detalles del Insumo</p>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 12 }}>ID: {insumo.InsumoID}</p>
                    </div>
                    <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ background: C.bg, borderRadius: 10, padding: "12px 14px" }}>
                        <p style={{ margin: 0, fontSize: 11, color: C.muted, fontWeight: 600 }}>Nombre del Insumo</p>
                        <p style={{ margin: 0, fontSize: 15, color: C.navy, fontWeight: 800 }}>{insumo.Nombre}</p>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <div style={{ flex: 1, background: C.bg, borderRadius: 10, padding: "12px 14px" }}>
                            <p style={{ margin: 0, fontSize: 11, color: C.muted, fontWeight: 600 }}>Tipo</p>
                            <div style={{ marginTop: 4 }}><Badge type="info">{insumo.Tipo}</Badge></div>
                        </div>
                        <div style={{ flex: 1, background: C.bg, borderRadius: 10, padding: "12px 14px" }}>
                            <p style={{ margin: 0, fontSize: 11, color: C.muted, fontWeight: 600 }}>Stock Disponible</p>
                            <p style={{ margin: 0, fontSize: 14, color: C.navy, fontWeight: 700 }}>{insumo.Stock}</p>
                        </div>
                    </div>
                    {insumo.Tipo && insumo.Tipo.toLowerCase() === "tela" && (
                        <div style={{ background: C.accentSoft, border: `1.5px solid ${C.accentBorder}`, borderRadius: 10, padding: "12px 14px" }}>
                            <p style={{ margin: 0, fontSize: 11, color: C.muted, fontWeight: 600 }}>Precio de Tela</p>
                            <p style={{ margin: 0, fontSize: 16, color: C.accent, fontWeight: 800 }}>
                                ${insumo.PrecioTela ? parseFloat(insumo.PrecioTela).toFixed(2) : "0.00"}
                            </p>
                        </div>
                    )}
                    <div style={{ background: C.bg, borderRadius: 10, padding: "12px 14px" }}>
                        <p style={{ margin: "0 0 6px", fontSize: 11, color: C.muted, fontWeight: 600 }}>Estado</p>
                        <Badge type={insumo.Estado ? "success" : "danger"}>{insumo.Estado ? "✓ Activo" : "✗ Inactivo"}</Badge>
                    </div>
                </div>
                <div style={{ padding: "0 24px 20px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button onClick={() => { onClose(); onEdit(insumo); }}
                        style={{ background: C.accentSoft, color: C.accent, border: `1.5px solid ${C.accentBorder}`, borderRadius: 10, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                        <FaEdit size={11} /> Editar
                    </button>
                    <button onClick={onClose} style={{ background: C.danger, color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

const Insumos = () => {
    const [showForm, setShowForm] = useState(false);
    const [insumos, setInsumos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [insumoEdit, setInsumoEdit] = useState(null);
    const [search, setSearch] = useState("");
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedInsumo, setSelectedInsumo] = useState(null);

    useEffect(() => { loadInsumos(); }, []);

    const loadInsumos = async () => {
        try {
            setLoading(true);
            const response = await getInsumos();
            if (response) { setInsumos(response); setError(null); }
            else setError("Error al cargar los insumos");
        } catch (err) { setError("Error al cargar los insumos: " + err.message); }
        finally { setLoading(false); }
    };

    const handleSave = async (insumoData) => {
        try {
            setLoading(true);
            if (insumoEdit) {
                await updateInsumo(insumoEdit.InsumoID, insumoData);
                Swal.fire({ toast: true, icon: "success", title: "Insumo actualizado correctamente", position: "top-end", showConfirmButton: false, timer: 2500, timerProgressBar: true });
            } else {
                await createInsumo(insumoData);
                Swal.fire({ toast: true, icon: "success", title: "Insumo creado correctamente", position: "top-end", showConfirmButton: false, timer: 2500, timerProgressBar: true });
            }
            setShowForm(false);
            await loadInsumos();
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.mensaje || "Error al procesar el insumo", confirmButtonColor: C.danger });
        } finally { setLoading(false); }
    };

    const handleEliminar = async (insumoID) => {
        const result = await Swal.fire({
            title: "¿Eliminar insumo?", text: "Esta acción no se puede revertir.", icon: "warning",
            showCancelButton: true, confirmButtonColor: C.danger, cancelButtonColor: C.navy,
            confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar",
        });
        if (result.isConfirmed) {
            try {
                setLoading(true);
                await deleteInsumo(insumoID);
                await loadInsumos();
                Swal.fire({ toast: true, icon: "success", title: "Insumo eliminado correctamente", position: "top-end", showConfirmButton: false, timer: 2000 });
            } catch (err) {
                Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.mensaje || "Error al eliminar el insumo", confirmButtonColor: C.danger });
            } finally { setLoading(false); }
        }
    };

    const handleCambiarEstado = async (insumo) => {
        const nuevoEstado = !insumo.Estado;
        const result = await Swal.fire({
            title: "¿Cambiar estado?", text: `¿Seguro que desea cambiar a ${nuevoEstado ? "Activo" : "Inactivo"}?`,
            icon: "question", showCancelButton: true,
            confirmButtonColor: C.navy, cancelButtonColor: C.danger,
            confirmButtonText: "Sí, cambiar", cancelButtonText: "Cancelar",
        });
        if (!result.isConfirmed) return;
        try {
            setLoading(true);
            await cambiarEstadoInsumo(insumo.InsumoID, nuevoEstado);
            await loadInsumos();
            Swal.fire({ toast: true, icon: "success", title: `Estado cambiado a ${nuevoEstado ? "Activo" : "Inactivo"}`, position: "top-end", showConfirmButton: false, timer: 2500, timerProgressBar: true });
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error al cambiar estado", text: err.response?.data?.message || err.message || "Error", confirmButtonColor: C.danger });
        } finally { setLoading(false); }
    };

    const filtered = insumos.filter(i => i.Nombre.toLowerCase().includes(search.toLowerCase()));

    if (showForm) return <InsumoForm onClose={() => { setShowForm(false); setInsumoEdit(null); }} onSave={handleSave} insumoEdit={insumoEdit} />;

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ins-row:hover { background: ${C.accentSoft} !important; }
        .icon-btn { transition: all 0.18s; }
        .icon-btn:hover { transform: scale(1.08); }
      `}</style>

            <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 32px", fontFamily: "'Outfit',sans-serif" }}>

                {/* ── HEADER ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                    <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>Gestión de Insumos</h4>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <input type="text" placeholder="Buscar insumo..." value={search} onChange={e => setSearch(e.target.value)}
                            style={{ border: `1.5px solid ${C.border}`, borderRadius: 9, padding: "8px 14px", fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", width: 220, color: "#0f172a" }}
                            onFocus={e => e.target.style.borderColor = C.accent}
                            onBlur={e => e.target.style.borderColor = C.border} />
                        <button onClick={() => { setInsumoEdit(null); setShowForm(true); }} disabled={loading}
                            style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 8, opacity: loading ? 0.7 : 1 }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#2d3f6e"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = C.navy; }}>
                            <FaPlusCircle size={15} /> Agregar Insumo
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{ background: "#fef2f2", border: `1.5px solid #fecaca`, borderRadius: 12, padding: "12px 18px", marginBottom: 20, color: C.danger, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 12 }}>
                        {error}
                        <button onClick={loadInsumos} style={{ background: C.danger, color: "#fff", border: "none", borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Reintentar</button>
                    </div>
                )}

                {/* ── TABLA ── */}
                <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px #f1f5f9", overflow: "hidden", animation: "fadeIn 0.3s ease" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                        <thead>
                            <tr>
                                {["Nombre", "Tipo", "Stock", "Estado", "Acciones"].map((h, i) => (
                                    <th key={i} style={{ ...TH, textAlign: i === 4 ? "center" : "left", borderTopLeftRadius: i === 0 ? 18 : 0, borderTopRightRadius: i === 4 ? 18 : 0 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ textAlign: "center", padding: "48px 0" }}>
                                    <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                                    <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>Cargando insumos...</p>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: "center", padding: "48px 0" }}>
                                    <FaBoxOpen style={{ color: C.muted, opacity: 0.3, fontSize: 32, marginBottom: 10 }} />
                                    <p style={{ color: C.muted, marginBottom: 14, fontSize: 13 }}>
                                        {search ? "No se encontraron insumos con ese nombre." : "No hay insumos registrados."}
                                    </p>
                                    {!search && <button onClick={() => { setInsumoEdit(null); setShowForm(true); }} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Crear primer insumo</button>}
                                </td></tr>
                            ) : (
                                filtered.map((insumo, idx) => (
                                    <tr key={insumo.InsumoID} className="ins-row" style={{ background: idx % 2 === 0 ? "#fff" : C.accentSoft, borderBottom: `1px solid ${C.border}`, transition: "background 0.15s" }}>
                                        <td style={{ padding: "11px 14px", fontWeight: 600, color: C.navy }}>{insumo.Nombre}</td>
                                        <td style={{ padding: "11px 14px" }}><Badge type="info">{insumo.Tipo}</Badge></td>
                                        <td style={{ padding: "11px 14px", color: C.muted, fontWeight: 600 }}>{insumo.Stock}</td>
                                        <td style={{ padding: "11px 14px" }}>
                                            <Badge type={insumo.Estado ? "success" : "danger"}>{insumo.Estado ? "Activo" : "Inactivo"}</Badge>
                                        </td>
                                        <td style={{ padding: "11px 14px", textAlign: "center" }}>
                                            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                                                <button className="icon-btn" onClick={() => { setSelectedInsumo(insumo); setShowDetailModal(true); }} title="Ver detalle"
                                                    style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.accent}20`, background: `${C.accent}0d`, color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <FaEye size={12} />
                                                </button>
                                                <button className="icon-btn" onClick={() => { setInsumoEdit(insumo); setShowForm(true); }} title="Editar"
                                                    style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.warning}20`, background: `${C.warning}0d`, color: C.warning, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <FaEdit size={12} />
                                                </button>
                                                <button className="icon-btn" onClick={() => handleEliminar(insumo.InsumoID)} title="Eliminar"
                                                    style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.danger}20`, background: `${C.danger}0d`, color: C.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <FaTrash size={12} />
                                                </button>
                                                <button className="icon-btn" onClick={() => handleCambiarEstado(insumo)} title="Cambiar estado"
                                                    style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.accent}20`, background: `${C.accent}0d`, color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <FaSyncAlt size={12} />
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

            <DetailModal show={showDetailModal} onClose={() => setShowDetailModal(false)} insumo={selectedInsumo}
                onEdit={i => { setInsumoEdit(i); setShowForm(true); }} />
        </>
    );
};

export default Insumos;