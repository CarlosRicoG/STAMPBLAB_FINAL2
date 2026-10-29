import { useState } from "react";
import { Link } from "react-router-dom";
import NavbarComponent from "../landing/NavBarLanding";
import FooterComponent from "../landing/footer";
import axios from "axios";
import fondo from "../../assets/images/imagenfondo.webp";
import { FaArrowLeft, FaEnvelope, FaEnvelopeOpenText, FaCheck, FaExclamation } from "react-icons/fa";
import { AuthShell, AuthField, AuthButton } from "./Login";
import { C } from "../../config/tokens";

const SPARKS = [C.accent, C.violet, C.success, "#f59e0b", C.accent, C.violet, C.success, "#22d3ee"];

const RecuperarContraseña = () => {
    const [correo, setCorreo] = useState("");
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
    const [enviado, setEnviado] = useState(false);

    const validarCorreo = (c) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);

    const handleRecuperar = async (e) => {
        e.preventDefault();
        if (!correo) { setMensaje({ tipo: "danger", texto: "Por favor ingresa tu correo." }); return; }
        if (!validarCorreo(correo)) { setMensaje({ tipo: "danger", texto: "Por favor ingresa un correo válido." }); return; }
        setLoading(true);
        setMensaje({ tipo: "", texto: "" });
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/recuperar-password`, { Correo: correo });
            setEnviado(true);
            setMensaje({ tipo: "success", texto: "Si el correo está registrado, te enviaremos un enlace de recuperación." });
            setCorreo("");
        } catch (error) {
            setMensaje({ tipo: "danger", texto: error.response?.data?.mensaje || "Error al procesar la solicitud." });
        } finally {
            setLoading(false);
        }
    };

    const esError = mensaje.tipo === "danger" && !!mensaje.texto;

    return (
        <>
            <NavbarComponent />

            <AuthShell img={fondo} step={2} eyebrow="Recupera tu acceso" title="¿Olvidaste tu" accent="contraseña?"
                subtitle="Tranquilo, te ayudamos a volver a tus pedidos y cotizaciones en un momento.">

                {!enviado ? (
                    <>
                        <div className="au-head">
                            <div className="au-badge"><FaEnvelope /></div>
                            <h1 className="au-title">Recuperar Contraseña</h1>
                            <p className="au-sub">Ingresa tu correo y te enviaremos un enlace de recuperación</p>
                        </div>

                        {esError && (
                            <div key={mensaje.texto} className="au-alert err" role="alert">
                                <i><FaExclamation /></i><span>{mensaje.texto}</span>
                            </div>
                        )}

                        <form onSubmit={handleRecuperar}>
                            <AuthField id="rec-correo" label="Correo electrónico" icon={<FaEnvelope />} type="email" autoComplete="email" required
                                placeholder="Ingresa tu correo electrónico" value={correo}
                                onChange={e => { setCorreo(e.target.value); if (mensaje.texto) setMensaje({ tipo: "", texto: "" }); }}
                                disabled={loading} valid={validarCorreo(correo)} error={esError}
                                hint="Recibirás un enlace para restablecer tu contraseña" />

                            <AuthButton loading={loading} loadingText="Enviando...">Enviar enlace</AuthButton>
                        </form>
                    </>
                ) : (
                    /* Estado enviado */
                    <div className="au-success" role="status">
                        <div className="au-burst" aria-hidden="true">
                            <span className="ring" /><span className="ring r2" />
                            {SPARKS.map((c, i) => <span key={i} className="spark" style={{ background: c, "--a": `${i * 45}deg` }} />)}
                            <div className="core"><FaEnvelopeOpenText /></div>
                            <div className="tick"><FaCheck /></div>
                        </div>
                        <h3>¡Correo enviado!</h3>
                        <p>Revisa tu bandeja de entrada y sigue las instrucciones del enlace.</p>
                        {mensaje.texto && (
                            <div className="au-alert ok" style={{ textAlign: "left", marginTop: 18 }}>
                                <i><FaCheck /></i><span>{mensaje.texto}</span>
                            </div>
                        )}
                        <div className="au-steps">
                            <div className="au-step"><span>1</span>Abre tu correo</div>
                            <div className="au-step"><span>2</span>Toca el enlace</div>
                            <div className="au-step"><span>3</span>Crea tu nueva contraseña</div>
                        </div>
                    </div>
                )}

                <div className="au-links">
                    <p>
                        <Link to="/login" className="au-link au-back"><FaArrowLeft size={11} /> Volver al inicio de sesión</Link>
                    </p>
                </div>
            </AuthShell>

            <FooterComponent />
        </>
    );
};

export default RecuperarContraseña;
