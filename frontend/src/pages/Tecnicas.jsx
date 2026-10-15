// src/pages/Tecnicas.jsx
import React, { useState, useEffect } from "react";
import { FaPlusCircle, FaEye, FaEdit, FaTrash, FaSyncAlt, FaBoxOpen } from "react-icons/fa";
import Swal from "sweetalert2";
import TecnicasForm from "../pages/formularios_dash/TecnicasForm";
import { getAllTecnicas, createTecnica, updateTecnica, deleteTecnica } from "../Services/api-tecnicas/tecnicas";

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
        danger:  { bg: "#fef2f2", color: C.danger,  border: "#fecaca" },
        accent:  { bg: C.accentSoft, color: C.accent, border: C.accentBorder },
        muted:   { bg: "#f1f5f9", color: C.muted,   border: "#e2e8f0" },
    };
    const s = map[type] || map.muted;
    return (
        <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>
            {children}
        </span>
    );
};

const TH = { background: C.navyGrad, color: "#fff", fontSize: 11, fontWeight: 700, padding: "11px 14px", whiteSpace: "nowrap", letterSpacing: "0.04em" };

const ImageModal = ({ show, onClose, tecnica }) => {
    if (!show || !tecnica) return null;
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 640, boxShadow: "0 8px 40px rgba(0,0,0,0.2)", overflow: "hidden", fontFamily: "'Outfit',sans-serif" }}>
                <div style={{ background: C.navyGrad, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#fff" }}>{tecnica.Nombre}</p>
                    <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
                <div style={{ padding: 24, textAlign: "center" }}>
                    {tecnica.imagenTecnica
                        ? <img src={tecnica.imagenTecnica} alt={tecnica.Nombre} style={{ maxHeight: 480, maxWidth: "100%", borderRadius: 12, objectFit: "contain" }} onError={e => { e.target.src = "https://via.placeholder.com/500x400?text=Error+al+cargar"; }} />
                        : <p style={{ color: C.muted }}>No hay imagen disponible</p>
                    }
                </div>
            </div>
        </div>
    );
};

const DetailModal = ({ show, onClose, tecnica, onEdit }) => {
    if (!show || !tecnica) return null;
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 560, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", overflow: "hidden", fontFamily: "'Outfit',sans-serif" }}>
                <div style={{ background: C.navyGrad, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#fff" }}>Detalles de la Técnica</p>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 12 }}>ID: {tecnica.TecnicaID}</p>
                    </div>
                    <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ background: C.bg, borderRadius: 10, padding: "12px 14px" }}>
                        <p style={{ margin: 0, fontSize: 11, color: C.muted, fontWeight: 600 }}>Nombre</p>
                        <p style={{ margin: 0, fontSize: 15, color: C.navy, fontWeight: 800 }}>{tecnica.Nombre}</p>
                    </div>
                    <div style={{ background: C.bg, borderRadius: 10, padding: "12px 14px" }}>
                        <p style={{ margin: 0, fontSize: 11, color: C.muted, fontWeight: 600 }}>Descripción</p>
                        <p style={{ margin: 0, fontSize: 13, color: "#374151" }}>{tecnica.Descripcion || "Sin descripción"}</p>
                    </div>
                    <div style={{ background: C.bg, borderRadius: 10, padding: "12px 14px" }}>
                        <p style={{ margin: "0 0 6px", fontSize: 11, color: C.muted, fontWeight: 600 }}>Estado</p>
                        <Badge type={tecnica.Estado ? "success" : "danger"}>{tecnica.Estado ? "✓ Activo" : "✗ Inactivo"}</Badge>
                    </div>
                    {tecnica.imagenTecnica && (
                        <div style={{ background: C.bg, borderRadius: 10, padding: "12px 14px" }}>
                            <p style={{ margin: "0 0 10px", fontSize: 11, color: C.muted, fontWeight: 600 }}>Imagen</p>
                            <div style={{ textAlign: "center" }}>
                                <img src={tecnica.imagenTecnica} alt={tecnica.Nombre} style={{ maxHeight: 260, maxWidth: "100%", borderRadius: 10, objectFit: "contain", border: `2px solid ${C.border}` }}
                                    onError={e => { e.target.src = "https://via.placeholder.com/400x300?text=Error"; }} />
                            </div>
                        </div>
                    )}
                </div>
                <div style={{ padding: "0 24px 20px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button onClick={() => { onClose(); onEdit(tecnica); }}
                        style={{ background: C.accentSoft, color: C.accent, border: `1.5px solid ${C.accentBorder}`, borderRadius: 10, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                        <FaEdit size={11} /> Editar
                    </button>
                    <button onClick={onClose}
                        style={{ background: C.danger, color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

const Tecnicas = () => {
    const [search, setSearch]               = useState("");
    const [tecnicas, setTecnicas]           = useState([]);
    const [loadingTable, setLoadingTable]   = useState(true);   // ← solo para la tabla
    const [savingForm, setSavingForm]       = useState(false);  // ← solo para el submit
    const [error, setError]                 = useState(null);
    const [showForm, setShowForm]           = useState(false);
    const [tecnicaEdit, setTecnicaEdit]     = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showImageModal, setShowImageModal]   = useState(false);
    const [selectedTecnica, setSelectedTecnica] = useState(null);

    useEffect(() => { loadTecnicas(); }, []);

    const loadTecnicas = async () => {
        try {
            setLoadingTable(true);
            setError(null);
            const response = await getAllTecnicas();
            if (response) setTecnicas(response);
            else setError("Error al cargar técnicas");
        } catch (err) {
            setError("Error al cargar las técnicas: " + err.message);
        } finally {
            setLoadingTable(false);
        }
    };

    const filtered = tecnicas.filter(t =>
        t.Nombre.toLowerCase().includes(search.toLowerCase())
    );

    const handleAgregar = () => { setTecnicaEdit(null); setShowForm(true); };
    const handleEditar  = (t) => { setTecnicaEdit(t);   setShowForm(true); };
    const handleCloseForm = () => { setShowForm(false); setTecnicaEdit(null); };

    // ─── SAVE: no toca loadingTable, usa savingForm ───
    const handleSave = async (tecnicaData) => {
        try {
            setSavingForm(true);
            const response = tecnicaEdit
                ? await updateTecnica(tecnicaEdit.TecnicaID, tecnicaData)
                : await createTecnica(tecnicaData);

            if (response.estado) {
                // 1. Cerrar form PRIMERO
                handleCloseForm();
                // 2. Luego recargar tabla (ya visible)
                await loadTecnicas();
                // 3. Toast de éxito
                Swal.fire({
                    toast: true,
                    icon: "success",
                    title: tecnicaEdit ? "Técnica actualizada" : "Técnica creada",
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 2500,
                    timerProgressBar: true,
                });
                return true;
            } else {
                throw new Error(response.message || "Error desconocido");
            }
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: err.response?.data?.message || err.message || "Error desconocido",
                confirmButtonColor: C.danger,
            });
            return false;
        } finally {
            setSavingForm(false);
        }
    };

    const handleEliminar = async (tecnicaID) => {
        const result = await Swal.fire({
            title: "¿Eliminar técnica?",
            text: "Esta acción no se puede revertir.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: C.danger,
            cancelButtonColor: C.navy,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });
        if (!result.isConfirmed) return;
        try {
            setLoadingTable(true);
            const response = await deleteTecnica(tecnicaID);
            if (response.estado) {
                await loadTecnicas();
                Swal.fire({ toast: true, icon: "success", title: "Técnica eliminada", position: "top-end", showConfirmButton: false, timer: 2000 });
            } else {
                Swal.fire({ icon: "error", title: "No se puede eliminar", text: response.message || "Error al eliminar.", confirmButtonColor: C.danger });
            }
        } catch (err) {
            Swal.fire({ icon: "error", title: "No se puede eliminar", text: err.response?.data?.message || err.message || "Error", confirmButtonColor: C.danger });
        } finally {
            setLoadingTable(false);
        }
    };

    const handleCambiarEstado = async (tecnica) => {
        const nuevoEstado = !tecnica.Estado;
        const result = await Swal.fire({
            title: "¿Cambiar estado?",
            text: `¿Seguro que desea cambiar a ${nuevoEstado ? "Activo" : "Inactivo"}?`,
            icon: "question", showCancelButton: true,
            confirmButtonColor: C.navy, cancelButtonColor: C.danger,
            confirmButtonText: "Sí, cambiar", cancelButtonText: "Cancelar",
        });
        if (!result.isConfirmed) return;
        try {
            setLoadingTable(true);
            const response = await updateTecnica(tecnica.TecnicaID, {
                Nombre: tecnica.Nombre,
                Descripcion: tecnica.Descripcion,
                imagenTecnica: tecnica.imagenTecnica,
                Estado: nuevoEstado,
            });
            if (response.estado) {
                await loadTecnicas();
                Swal.fire({ toast: true, icon: "success", title: `Estado cambiado a ${nuevoEstado ? "Activo" : "Inactivo"}`, position: "top-end", showConfirmButton: false, timer: 2500, timerProgressBar: true });
            } else throw new Error(response.message || "Error desconocido");
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error al cambiar estado", text: err.response?.data?.message || err.message || "Error", confirmButtonColor: C.danger });
        } finally {
            setLoadingTable(false);
        }
    };

    // ─── FORM se muestra como overlay, NO reemplaza la vista ───
    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }
                @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
                @keyframes spin   { to { transform: rotate(360deg); } }
                .tec-row:hover { background: ${C.accentSoft} !important; }
                .icon-btn { transition: all 0.18s; }
                .icon-btn:hover { transform: scale(1.08); }
            `}</style>

            {/* ── OVERLAY DEL FORM ── */}
            {showForm && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, overflowY: "auto" }}>
                    <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 680, boxShadow: "0 8px 40px rgba(0,0,0,0.22)", maxHeight: "90vh", overflowY: "auto" }}>
                        <TecnicasForm
                            onClose={handleCloseForm}
                            onSave={handleSave}
                            tecnicaEdit={tecnicaEdit}
                            tecnicasExistentes={tecnicas}
                            saving={savingForm}
                        />
                    </div>
                </div>
            )}

            <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 32px", fontFamily: "'Outfit',sans-serif" }}>

                {/* HEADER */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                    <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>Gestión de Técnicas</h4>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <input
                            type="text" placeholder="Buscar técnica..." value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ border: `1.5px solid ${C.border}`, borderRadius: 9, padding: "8px 14px", fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", width: 220, color: "#0f172a" }}
                            onFocus={e => e.target.style.borderColor = C.accent}
                            onBlur={e  => e.target.style.borderColor = C.border}
                        />
                        <button
                            onClick={handleAgregar}
                            style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 8 }}
                            onMouseEnter={e => e.currentTarget.style.background = "#2d3f6e"}
                            onMouseLeave={e => e.currentTarget.style.background = C.navy}>
                            <FaPlusCircle size={15} /> Agregar Técnica
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{ background: "#fef2f2", border: `1.5px solid #fecaca`, borderRadius: 12, padding: "12px 18px", marginBottom: 20, color: C.danger, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 12 }}>
                        {error}
                        <button onClick={loadTecnicas} style={{ background: C.danger, color: "#fff", border: "none", borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Reintentar</button>
                    </div>
                )}

                {/* TABLA */}
                <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px #f1f5f9", overflow: "hidden", animation: "fadeIn 0.3s ease" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                        <thead>
                            <tr>
                                {["Nombre", "Descripción", "Imagen", "Estado", "Acciones"].map((h, i) => (
                                    <th key={i} style={{ ...TH, textAlign: i === 4 ? "center" : "left" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loadingTable ? (
                                <tr><td colSpan={5} style={{ textAlign: "center", padding: "48px 0" }}>
                                    <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                                    <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>Cargando técnicas...</p>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: "center", padding: "48px 0" }}>
                                    <FaBoxOpen style={{ color: C.muted, opacity: 0.3, fontSize: 32, marginBottom: 10 }} />
                                    <p style={{ color: C.muted, marginBottom: 14, fontSize: 13 }}>
                                        {search ? "No se encontraron técnicas con ese nombre." : "No hay técnicas registradas."}
                                    </p>
                                    {!search && <button onClick={handleAgregar} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Crear primera técnica</button>}
                                </td></tr>
                            ) : (
                                filtered.map((t, idx) => (
                                    <tr key={t.TecnicaID} className="tec-row"
                                        style={{ background: idx % 2 === 0 ? "#fff" : C.accentSoft, borderBottom: `1px solid ${C.border}`, transition: "background 0.15s" }}>
                                        <td style={{ padding: "11px 14px", fontWeight: 600, color: C.navy }}>{t.Nombre}</td>
                                        <td style={{ padding: "11px 14px", color: C.muted, fontSize: 12 }}>
                                            {t.Descripcion?.length > 60 ? t.Descripcion.substring(0, 60) + "..." : t.Descripcion}
                                        </td>
                                        <td style={{ padding: "11px 14px" }}>
                                            {t.imagenTecnica
                                                ? <img src={t.imagenTecnica} alt={t.Nombre}
                                                    onClick={() => { setSelectedTecnica(t); setShowImageModal(true); }}
                                                    style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 10, border: `2px solid ${C.border}`, cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
                                                    onMouseEnter={e => { e.target.style.transform = "scale(1.1)"; e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.18)"; }}
                                                    onMouseLeave={e => { e.target.style.transform = "none";      e.target.style.boxShadow = "none"; }}
                                                    onError={e => { e.target.style.display = "none"; }}
                                                  />
                                                : <Badge type="muted">Sin imagen</Badge>
                                            }
                                        </td>
                                        <td style={{ padding: "11px 14px" }}>
                                            <Badge type={t.Estado ? "success" : "danger"}>{t.Estado ? "Activo" : "Inactivo"}</Badge>
                                        </td>
                                        <td style={{ padding: "11px 14px", textAlign: "center" }}>
                                            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                                                <button className="icon-btn" onClick={() => { setSelectedTecnica(t); setShowDetailModal(true); }} title="Ver detalle"
                                                    style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.accent}20`, background: `${C.accent}0d`, color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <FaEye size={12} />
                                                </button>
                                                <button className="icon-btn" onClick={() => handleEditar(t)} title="Editar"
                                                    style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.warning}20`, background: `${C.warning}0d`, color: C.warning, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <FaEdit size={12} />
                                                </button>
                                                <button className="icon-btn" onClick={() => handleEliminar(t.TecnicaID)} title="Eliminar"
                                                    style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.danger}20`, background: `${C.danger}0d`, color: C.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <FaTrash size={12} />
                                                </button>
                                                <button className="icon-btn" onClick={() => handleCambiarEstado(t)} title="Cambiar estado"
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

            <ImageModal show={showImageModal} onClose={() => setShowImageModal(false)} tecnica={selectedTecnica} />
            <DetailModal show={showDetailModal} onClose={() => setShowDetailModal(false)} tecnica={selectedTecnica}
                onEdit={t => { setTecnicaEdit(t); setShowForm(true); }} />
        </>
    );
};

export default Tecnicas;