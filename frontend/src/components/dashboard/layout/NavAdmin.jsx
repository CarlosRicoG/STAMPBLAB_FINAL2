import { useState, useEffect } from "react";
import { FaUserCircle, FaSignOutAlt, FaPencilAlt, FaEye, FaEyeSlash, FaSave } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/usuarios`;

const getTokenPayload = () => {
    try {
        const token = localStorage.getItem("token");
        if (!token) return null;
        return JSON.parse(atob(token.split(".")[1]));
    } catch { return null; }
};

const C = {
    navy: "#1a2540",
    navyGrad: "linear-gradient(135deg, #1a2540 0%, #2d3f6e 100%)",
    accent: "#4f8ef7",
    accentSoft: "#f0f4ff",
    accentBorder: "#c7d9ff",
    danger: "#dc2626",
    success: "#16a34a",
    muted: "#64748b",
    border: "#e2e8f0",
    bg: "#f8fafc",
};

const Field = ({ label, type = "text", value, onChange, disabled, rightSlot }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {label}
        </label>
        <div style={{ position: "relative" }}>
            <input
                type={type}
                value={value}
                onChange={onChange}
                disabled={disabled}
                style={{
                    width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 9,
                    padding: rightSlot ? "9px 40px 9px 13px" : "9px 13px",
                    fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: "none",
                    color: disabled ? C.muted : "#0f172a",
                    background: disabled ? C.bg : "#fff",
                    transition: "border-color 0.18s",
                    boxSizing: "border-box",
                }}
                onFocus={e => { if (!disabled) e.target.style.borderColor = C.accent; }}
                onBlur={e => { e.target.style.borderColor = C.border; }}
            />
            {rightSlot && (
                <div style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: C.muted }}>
                    {rightSlot}
                </div>
            )}
        </div>
    </div>
);

const NavAdmin = () => {
    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    const [showPerfil, setShowPerfil]   = useState(false);
    const [showEditar, setShowEditar]   = useState(false);
    const [showPass,   setShowPass]     = useState(false);
    const [loading,    setLoading]      = useState(false);
    const [guardando,  setGuardando]    = useState(false);
    const [msgError,   setMsgError]     = useState("");
    const [msgOk,      setMsgOk]        = useState("");

    const [perfil, setPerfil] = useState({
        DocumentoID: "", Nombre: "", Correo: "", Telefono: "", Direccion: ""
    });
    const [form, setForm] = useState({
        Nombre: "", Correo: "", Telefono: "", Direccion: "", Contraseña: ""
    });

    // ── Cargar nombre inicial desde localStorage (para mostrar en navbar sin modal) ──
    useEffect(() => {
        if (!token) return;
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            if (user?.Nombre) {
                setPerfil(p => ({ ...p, Nombre: user.Nombre, Correo: user.Correo || "" }));
            } else {
                // Si no hay en localStorage, cargar del backend silenciosamente
                cargarPerfilSilencioso();
            }
        } catch {
            cargarPerfilSilencioso();
        }
    }, []);

    if (!token) return null;

    // ── Carga silenciosa solo para el nombre del navbar ──
    const cargarPerfilSilencioso = async () => {
        try {
            const payload = getTokenPayload();
            if (!payload?.id) return;
            const res = await axios.get(`${API_URL}/${payload.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const u = res.data;
            setPerfil(p => ({
                ...p,
                DocumentoID: u.DocumentoID || "",
                Nombre:      u.Nombre      || "",
                Correo:      u.Correo      || "",
                Telefono:    u.Telefono    || "",
                Direccion:   u.Direccion   || "",
            }));
            // Guardar en localStorage para la próxima vez
            localStorage.setItem("user", JSON.stringify({ Nombre: u.Nombre, Correo: u.Correo }));
        } catch (e) {
            console.error("Error cargando perfil silencioso:", e.message);
        }
    };

    // ── Carga completa al abrir el modal ──
    const cargarPerfil = async () => {
        setLoading(true);
        setMsgError("");
        try {
            const payload = getTokenPayload();
            if (!payload?.id) throw new Error("Token inválido");

            const res = await axios.get(`${API_URL}/${payload.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const u = res.data;
            const nuevoPerfil = {
                DocumentoID: u.DocumentoID || "",
                Nombre:      u.Nombre      || "",
                Correo:      u.Correo      || "",
                Telefono:    u.Telefono    || "",
                Direccion:   u.Direccion   || "",
            };
            setPerfil(nuevoPerfil);
            setForm({
                Nombre:     nuevoPerfil.Nombre,
                Correo:     nuevoPerfil.Correo,
                Telefono:   nuevoPerfil.Telefono,
                Direccion:  nuevoPerfil.Direccion,
                Contraseña: "",
            });
        } catch (e) {
            setMsgError("No se pudo cargar el perfil: " + (e.response?.data?.mensaje || e.message));
        } finally {
            setLoading(false);
        }
    };

    const handleAbrirPerfil = () => {
        setShowPerfil(true);
        setShowEditar(false);
        setMsgOk("");
        setMsgError("");
        cargarPerfil();
    };

    // ── Guardar cambios ──
    const handleGuardar = async () => {
        setMsgError(""); setMsgOk("");

        if (!form.Nombre.trim() || !form.Correo.trim()) {
            setMsgError("Nombre y correo son obligatorios.");
            return;
        }

        const payload = getTokenPayload();
        if (!payload?.id) { setMsgError("Sesión inválida."); return; }

        const body = {
            Nombre:    form.Nombre.trim(),
            Correo:    form.Correo.trim(),
            Telefono:  form.Telefono.trim(),
            Direccion: form.Direccion.trim(),
        };
        if (form.Contraseña.trim() !== "") {
            body.Contraseña = form.Contraseña.trim();
        }

        setGuardando(true);
        try {
            const res = await axios.put(`${API_URL}/${payload.id}`, body, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
            });

            const datosActualizados = res.data.datos || body;

            // Actualizar estado local
            setPerfil(p => ({
                ...p,
                Nombre:    datosActualizados.Nombre    || p.Nombre,
                Correo:    datosActualizados.Correo    || p.Correo,
                Telefono:  datosActualizados.Telefono  ?? p.Telefono,
                Direccion: datosActualizados.Direccion ?? p.Direccion,
            }));

            // Actualizar localStorage
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem("user", JSON.stringify({
                ...user,
                Nombre: datosActualizados.Nombre || body.Nombre,
                Correo: datosActualizados.Correo || body.Correo,
            }));

            setMsgOk("¡Perfil actualizado correctamente!");
            setForm(f => ({ ...f, Contraseña: "" }));
            setShowEditar(false);   // cerrar editar
            setShowPerfil(true);    // volver a mostrar perfil con el mensaje ok

        } catch (e) {
            console.error("Error al guardar:", e.response?.data || e.message);
            setMsgError(e.response?.data?.mensaje || "Error al guardar los cambios.");
        } finally {
            setGuardando(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const iniciales = perfil.Nombre
        ? perfil.Nombre.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
        : "AD";

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
                .nav-avatar-btn {
                    background: none; border: none; cursor: pointer;
                    display: flex; align-items: center; gap: 10px;
                    padding: 6px 10px; border-radius: 12px;
                    transition: background 0.18s; font-family: 'Outfit', sans-serif;
                }
                .nav-avatar-btn:hover { background: #f1f5f9; }
                .nav-logout-btn {
                    display: flex; align-items: center; gap: 7px;
                    background: #1a2540; color: #fff; border: none;
                    border-radius: 10px; padding: 8px 16px; font-size: 13px;
                    font-weight: 600; font-family: 'Outfit', sans-serif;
                    cursor: pointer; transition: all 0.18s;
                }
                .nav-logout-btn:hover { background: #dc2626; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(220,38,38,0.3); }
                .modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.45);
                    z-index: 2000; display: flex; align-items: center;
                    justify-content: center; padding: 24px;
                    animation: fadeIn 0.2s ease;
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
            `}</style>

            {/* ── NAVBAR ── */}
            <header style={{
                height: 64, background: "#fff", borderBottom: "1px solid #f1f5f9",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 28px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
                flexShrink: 0, fontFamily: "'Outfit', sans-serif",
            }}>
                <span style={{ fontWeight: 800, fontSize: 22, color: "#0f172a", letterSpacing: "-0.03em", fontFamily: "'Outfit', sans-serif" }}>
                    Stamp<span style={{ color: "#4f8ef7" }}>Lab</span>
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button className="nav-avatar-btn" onClick={handleAbrirPerfil}>
                        <div style={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: C.navyGrad, display: "flex", alignItems: "center",
                            justifyContent: "center", boxShadow: "0 2px 8px rgba(79,142,247,0.35)",
                            fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em",
                        }}>
                            {iniciales}
                        </div>
                        <div style={{ textAlign: "left", lineHeight: 1.2 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                                {perfil.Nombre || "Administrador"}
                            </p>
                            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Admin</p>
                        </div>
                    </button>
                    <div style={{ width: 1, height: 28, background: "#e2e8f0" }} />
                    <button className="nav-logout-btn" onClick={handleLogout}>
                        <FaSignOutAlt size={13} /> Cerrar Sesión
                    </button>
                </div>
            </header>

            {/* ── MODAL PERFIL ── */}
            {showPerfil && (
                <div className="modal-overlay" onClick={() => { setShowPerfil(false); setMsgOk(""); }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420,
                        boxShadow: "0 12px 48px rgba(0,0,0,0.18)", overflow: "hidden",
                        fontFamily: "'Outfit', sans-serif", animation: "slideUp 0.25s ease",
                    }}>
                        <div style={{ background: C.navyGrad, padding: "28px 24px 24px", textAlign: "center", position: "relative" }}>
                            <button onClick={() => { setShowPerfil(false); setMsgOk(""); }} style={{
                                position: "absolute", top: 12, right: 12,
                                background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)",
                                borderRadius: 8, width: 28, height: 28, cursor: "pointer",
                                color: "#fff", fontSize: 13, fontWeight: 700,
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>✕</button>
                            <div style={{
                                width: 68, height: 68, borderRadius: "50%",
                                background: "rgba(255,255,255,0.15)", border: "3px solid rgba(255,255,255,0.4)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 12px", fontSize: 26, fontWeight: 800, color: "#fff",
                            }}>
                                {iniciales}
                            </div>
                            {loading ? (
                                <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Cargando...</p>
                            ) : (
                                <>
                                    <p style={{ margin: 0, fontWeight: 800, fontSize: 17, color: "#fff" }}>{perfil.Nombre || "—"}</p>
                                    <p style={{ margin: "3px 0 0", color: "rgba(255,255,255,0.65)", fontSize: 12 }}>{perfil.Correo || "—"}</p>
                                </>
                            )}
                        </div>

                        {!loading && (
                            <div style={{ padding: "20px 24px" }}>
                                {msgOk && (
                                    <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: C.success, fontWeight: 600, fontSize: 13 }}>
                                        ✓ {msgOk}
                                    </div>
                                )}
                                {msgError && (
                                    <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: C.danger, fontWeight: 600, fontSize: 13 }}>
                                        ⚠ {msgError}
                                    </div>
                                )}
                                {[
                                    { label: "Documento",  value: perfil.DocumentoID || "—" },
                                    { label: "Teléfono",   value: perfil.Telefono    || "No registrado" },
                                    { label: "Dirección",  value: perfil.Direccion   || "No registrada" },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
                                        <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{label}</span>
                                        <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 500 }}>{value}</span>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        setShowPerfil(false);
                                        setShowEditar(true);
                                        setMsgError("");
                                        setMsgOk("");
                                        // Sincronizar form con perfil actual
                                        setForm({
                                            Nombre:     perfil.Nombre,
                                            Correo:     perfil.Correo,
                                            Telefono:   perfil.Telefono,
                                            Direccion:  perfil.Direccion,
                                            Contraseña: "",
                                        });
                                    }}
                                    style={{
                                        marginTop: 20, width: "100%", background: C.navy, color: "#fff",
                                        border: "none", borderRadius: 10, padding: "11px", fontSize: 13,
                                        fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                        transition: "all 0.18s",
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#2d3f6e"}
                                    onMouseLeave={e => e.currentTarget.style.background = C.navy}
                                >
                                    <FaPencilAlt size={12} /> Editar Información
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── MODAL EDITAR ── */}
            {showEditar && (
                <div className="modal-overlay" onClick={() => setShowEditar(false)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480,
                        boxShadow: "0 12px 48px rgba(0,0,0,0.18)", overflow: "hidden",
                        fontFamily: "'Outfit', sans-serif", animation: "slideUp 0.25s ease",
                    }}>
                        <div style={{ background: C.navyGrad, padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#fff" }}>Editar Perfil</p>
                            <button onClick={() => setShowEditar(false)} style={{
                                background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)",
                                borderRadius: 8, width: 28, height: 28, cursor: "pointer", color: "#fff",
                                fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                            }}>✕</button>
                        </div>

                        <div style={{ padding: "24px 24px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                            {msgError && (
                                <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 10, padding: "10px 14px", color: C.danger, fontWeight: 600, fontSize: 13 }}>
                                    ⚠ {msgError}
                                </div>
                            )}

                            <Field label="Documento (no editable)" value={perfil.DocumentoID} disabled />

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <Field label="Nombre *" value={form.Nombre}
                                    onChange={e => setForm(f => ({ ...f, Nombre: e.target.value }))} />
                                <Field label="Correo *" type="email" value={form.Correo}
                                    onChange={e => setForm(f => ({ ...f, Correo: e.target.value }))} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <Field label="Teléfono" value={form.Telefono}
                                    onChange={e => setForm(f => ({ ...f, Telefono: e.target.value }))} />
                                <Field label="Dirección" value={form.Direccion}
                                    onChange={e => setForm(f => ({ ...f, Direccion: e.target.value }))} />
                            </div>
                            <Field
                                label="Nueva contraseña (dejar vacío para no cambiar)"
                                type={showPass ? "text" : "password"}
                                value={form.Contraseña}
                                onChange={e => setForm(f => ({ ...f, Contraseña: e.target.value }))}
                                rightSlot={
                                    <span onClick={() => setShowPass(s => !s)}>
                                        {showPass ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                    </span>
                                }
                            />

                            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                                <button onClick={handleGuardar} disabled={guardando} style={{
                                    flex: 1, background: guardando ? C.muted : C.navy, color: "#fff",
                                    border: "none", borderRadius: 10, padding: "11px", fontSize: 13,
                                    fontWeight: 700, cursor: guardando ? "not-allowed" : "pointer",
                                    fontFamily: "'Outfit', sans-serif",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    transition: "background 0.18s",
                                }}>
                                    <FaSave size={13} />
                                    {guardando ? "Guardando..." : "Guardar Cambios"}
                                </button>
                                <button onClick={() => setShowEditar(false)} style={{
                                    background: C.bg, color: C.muted, border: `1.5px solid ${C.border}`,
                                    borderRadius: 10, padding: "11px 20px", fontSize: 13, fontWeight: 600,
                                    cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                                }}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default NavAdmin;