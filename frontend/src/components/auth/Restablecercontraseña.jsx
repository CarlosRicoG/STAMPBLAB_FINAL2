import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import NavbarComponent from "../landing/NavBarLanding";
import FooterComponent from "../landing/footer";
import axios from "axios";
import Swal from "sweetalert2";
import { errorContrasena } from "../../utils/validarContrasena";
import fondo from "../../assets/images/imagenfondo.webp";
import { FaArrowLeft, FaLock, FaKey, FaExclamationTriangle, FaExclamation, FaCheck, FaTimes, FaShieldAlt, FaRedoAlt } from "react-icons/fa";
import { AuthShell, AuthField, AuthButton, StrengthMeter } from "./Login";
import { C } from "../../config/tokens";

/* ── Tokens de color ── */
const RestablecerContraseña = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [token, setToken] = useState("");
    const [nuevaContraseña, setNuevaContraseña] = useState("");
    const [confirmarContraseña, setConfirmarContraseña] = useState("");
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
    const [tokenValido, setTokenValido] = useState(true);
    const [exito, setExito] = useState(false);

    useEffect(() => {
        const tokenFromUrl = searchParams.get("token");
        if (!tokenFromUrl) { setTokenValido(false); }
        else { setToken(tokenFromUrl); }
    }, [searchParams]);

    const handleRestablecer = async (e) => {
        e.preventDefault();
        if (!nuevaContraseña || !confirmarContraseña) { setMensaje({ tipo: "danger", texto: "Completa todos los campos." }); return; }
        if (nuevaContraseña !== confirmarContraseña) { setMensaje({ tipo: "danger", texto: "Las contraseñas no coinciden." }); return; }
        if (errorContrasena(nuevaContraseña)) { setMensaje({ tipo: "danger", texto: errorContrasena(nuevaContraseña) }); return; }

        setLoading(true);
        setMensaje({ tipo: "", texto: "" });
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/restablecer-password`, { token, nuevaContraseña });
            setExito(true);
            await Swal.fire({ icon: "success", title: "¡Contraseña actualizada!", text: "Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.", confirmButtonColor: C.navy });
            navigate("/login");
        } catch (error) {
            let mensajeError = "Error al restablecer la contraseña.";
            if (error.response?.status === 401) mensajeError = "El enlace ha expirado o es inválido. Solicita uno nuevo.";
            else if (error.response?.data?.mensaje) mensajeError = error.response.data.mensaje;
            setMensaje({ tipo: "danger", texto: mensajeError });
        } finally {
            setLoading(false);
        }
    };

    const SPARKS = ["#16a34a", "#4f8ef7", "#7c3aed", "#22d3ee", "#16a34a", "#4f8ef7", "#7c3aed", "#f59e0b"];
    const coinciden = nuevaContraseña === confirmarContraseña;

    /* ── Token inválido ── */
    if (!tokenValido) {
        return (
            <>
                <NavbarComponent />
                <AuthShell img={fondo} step={2} eyebrow="Recupera tu acceso" title="Protege tu" accent="cuenta"
                    subtitle="Crea una contraseña segura y vuelve a tus pedidos y cotizaciones.">
                    <div className="au-head">
                        <div className="au-badge warn"><FaExclamationTriangle /></div>
                        <h1 className="au-title">Enlace inválido</h1>
                        <p className="au-sub">El enlace de recuperación no es válido o ha expirado</p>
                    </div>
                    <div className="au-alert warn">
                        <i><FaExclamation /></i>
                        <span>El enlace que usaste ya no es válido. Esto puede ocurrir si ya fue usado o si expiró.</span>
                    </div>
                    <Link to="/recuperarcontraseña" className="au-cta" style={{ display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                        <span className="au-cta-in"><FaRedoAlt size={13} /> Solicitar nuevo enlace</span>
                    </Link>
                    <div className="au-links">
                        <p><Link to="/login" className="au-link au-back"><FaArrowLeft size={11} /> Volver al inicio de sesión</Link></p>
                    </div>
                </AuthShell>
                <FooterComponent />
            </>
        );
    }

    return (
        <>
            <NavbarComponent />

            <AuthShell img={fondo} step={2} eyebrow="Recupera tu acceso" title="Protege tu" accent="cuenta"
                subtitle="Crea una contraseña segura y vuelve a tus pedidos y cotizaciones.">

                {exito ? (
                    <div className="au-success" role="status">
                        <div className="au-burst" aria-hidden="true">
                            <span className="ring" /><span className="ring r2" />
                            {SPARKS.map((c, i) => <span key={i} className="spark" style={{ background: c, "--a": `${i * 45}deg` }} />)}
                            <div className="core green"><FaShieldAlt /></div>
                            <div className="tick"><FaCheck /></div>
                        </div>
                        <h3>¡Contraseña actualizada!</h3>
                        <p>Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.</p>
                    </div>
                ) : (
                    <>
                        <div className="au-head">
                            <div className="au-badge"><FaLock /></div>
                            <h1 className="au-title">Restablecer Contraseña</h1>
                            <p className="au-sub">Crea una nueva contraseña segura para tu cuenta</p>
                        </div>

                        {/* Alerta */}
                        {mensaje.texto && (
                            <div key={mensaje.texto} className="au-alert err" role="alert">
                                <i><FaExclamation /></i><span>{mensaje.texto}</span>
                            </div>
                        )}

                        <form onSubmit={handleRestablecer}>
                            <AuthField id="rest-nueva" label="Nueva Contraseña" icon={<FaLock />} type="password" autoComplete="new-password" required
                                placeholder="Ingresa tu nueva contraseña" value={nuevaContraseña}
                                onChange={e => setNuevaContraseña(e.target.value)} disabled={loading}
                                valid={!errorContrasena(nuevaContraseña)} hint="8 a 100 caracteres, con letras y números">
                                <StrengthMeter value={nuevaContraseña} detail />
                            </AuthField>
                            <AuthField id="rest-confirmar" label="Confirmar Contraseña" icon={<FaKey />} type="password" autoComplete="new-password" required
                                placeholder="Confirma tu nueva contraseña" value={confirmarContraseña}
                                onChange={e => setConfirmarContraseña(e.target.value)} disabled={loading}
                                valid={!!confirmarContraseña && coinciden} error={!!confirmarContraseña && !coinciden}>
                                {/* Indicador de coincidencia */}
                                {confirmarContraseña && (
                                    <p key={coinciden ? "si" : "no"} className={`au-msg ${coinciden ? "ok" : "err"}`}>
                                        {coinciden ? <FaCheck size={11} /> : <FaTimes size={11} />}
                                        {coinciden ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
                                    </p>
                                )}
                            </AuthField>

                            <AuthButton loading={loading} loadingText="Actualizando...">Restablecer Contraseña</AuthButton>
                        </form>
                    </>
                )}

                <div className="au-links">
                    <p><Link to="/login" className="au-link au-back"><FaArrowLeft size={11} /> Volver al inicio de sesión</Link></p>
                </div>
            </AuthShell>

            <FooterComponent />
        </>
    );
};

export default RestablecerContraseña;