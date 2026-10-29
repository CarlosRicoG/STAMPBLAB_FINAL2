import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registrarUsuario } from "../../Services/api-auth/auth";
import fondo from "../../assets/images/imagenfondo.webp";
import NavbarComponent from "../landing/NavBarLanding";
import FooterComponent from "../landing/footer";
import Swal from "sweetalert2";
import { FaUser, FaIdCard, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaLock, FaKey } from "react-icons/fa";
import { errorContrasena } from "../../utils/validarContrasena";
import { AuthShell, AuthTabs, AuthField, AuthButton, StrengthMeter } from "./Login";
import { C } from "../../config/tokens";


/* ── Tokens de color ── */
const RegistroLanding = () => {
    const [nombre, setNombre] = useState("");
    const [documento, setDocumento] = useState("");
    const [correo, setCorreo] = useState("");
    const [telefono, setTelefono] = useState("");
    const [direccion, setDireccion] = useState("");
    const [contraseña, setContraseña] = useState("");
    const [confirmar, setConfirmar] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [errores, setErrores] = useState({ nombre: "", documento: "", correo: "", telefono: "", direccion: "", contraseña: "", confirmar: "" });

    const validarNombre = (v) => {
        if (!v.trim()) return "El nombre es requerido.";
        if (v.trim().length < 3) return "El nombre debe tener al menos 3 caracteres.";
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(v)) return "El nombre solo debe contener letras.";
        return "";
    };
    const validarDocumento = (v) => {
        if (!v.trim()) return "El documento es requerido.";
        if (!/^\d+$/.test(v)) return "El documento solo debe contener números.";
        if (v.length < 7 || v.length > 10) return "El documento debe tener entre 7 y 10 dígitos.";
        return "";
    };
    const validarCorreo = (v) => {
        if (!v.trim()) return "El correo es requerido.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "El correo no es válido.";
        return "";
    };
    const validarTelefono = (v) => {
        if (!v.trim()) return "El teléfono es requerido.";
        if (!/^[\d\s-]+$/.test(v)) return "Solo puede contener números, espacios o guiones.";
        const soloNumeros = v.replace(/[\s-]/g, "");
        if (soloNumeros.length < 7 || soloNumeros.length > 10) return "El teléfono debe tener entre 7 y 10 dígitos.";
        return "";
    };
    const validarDireccion = (v) => {
        if (!v.trim()) return "La dirección es requerida.";
        if (v.trim().length < 5) return "La dirección debe tener al menos 5 caracteres.";
        return "";
    };
    const validarContraseña = (v) => {
        if (!v) return "La contraseña es requerida.";
        return errorContrasena(v);
    };
    const validarConfirmar = (v) => {
        if (!v) return "Debes confirmar tu contraseña.";
        if (v !== contraseña) return "Las contraseñas no coinciden.";
        return "";
    };

    const blur = (field, fn, value) => {
        const e = fn(value);
        setErrores(prev => ({ ...prev, [field]: e }));
    };

    const handleRegistro = async (e) => {
        e.preventDefault();
        const nuevosErrores = {
            nombre: validarNombre(nombre),
            documento: validarDocumento(documento),
            correo: validarCorreo(correo),
            telefono: validarTelefono(telefono),
            direccion: validarDireccion(direccion),
            contraseña: validarContraseña(contraseña),
            confirmar: validarConfirmar(confirmar),
        };
        setErrores(nuevosErrores);
        if (Object.values(nuevosErrores).some(e => e !== "")) {
            Swal.fire({ icon: "error", title: "Errores en el formulario", text: "Por favor corrige los errores antes de continuar.", confirmButtonColor: C.danger });
            return;
        }
        setLoading(true);
        try {
            const datos = { DocumentoID: documento.trim(), Nombre: nombre.trim(), Correo: correo.trim(), Telefono: telefono.trim(), Direccion: direccion.trim(), Contraseña: contraseña, RolID: 2 };
            const response = await registrarUsuario(datos);
            if (response.data?.estado !== false) {
                Swal.fire({ icon: "success", title: "¡Registro exitoso!", text: "Tu cuenta ha sido creada. Por favor inicia sesión.", confirmButtonColor: C.navy }).then(() => navigate("/login"));
            } else {
                throw new Error(response.data?.mensaje || "Error al registrar usuario");
            }
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error al registrarse", text: err.response?.data?.mensaje || err.message || "Verifica los datos e intenta nuevamente.", confirmButtonColor: C.danger });
        } finally {
            setLoading(false);
        }
    };

    const ok = (fn, v) => !!v && fn(v) === "";

    return (
        <>
            <NavbarComponent />

            <AuthShell img={fondo} step={1} wide eyebrow="Únete a StampLab" title="Crea tu" accent="cuenta"
                subtitle="Únete a StampLab y accede a cotizaciones, productos y más.">
                <AuthTabs active="signup" />

                <div className="au-head">
                    <h1 className="au-title">Formulario de Registro</h1>
                    <p className="au-sub">Completa todos los campos para crear tu cuenta</p>
                </div>

                <form onSubmit={handleRegistro} noValidate>
                    {/* Fila 1: Nombre + Documento */}
                    <div className="au-grid2">
                        <AuthField id="reg-nombre" label="Nombre" icon={<FaUser />} placeholder="Ingresa tu nombre" value={nombre} autoComplete="name"
                            onChange={e => setNombre(e.target.value)}
                            onBlur={() => blur("nombre", validarNombre, nombre)}
                            disabled={loading} error={errores.nombre} valid={ok(validarNombre, nombre)} required />
                        <AuthField id="reg-documento" label="Número de documento" icon={<FaIdCard />} placeholder="Número de documento" value={documento} inputMode="numeric"
                            onChange={e => setDocumento(e.target.value)}
                            onBlur={() => blur("documento", validarDocumento, documento)}
                            disabled={loading} error={errores.documento} valid={ok(validarDocumento, documento)} required />
                    </div>

                    {/* Fila 2: Correo + Teléfono */}
                    <div className="au-grid2">
                        <AuthField id="reg-correo" label="Correo electrónico" icon={<FaEnvelope />} type="email" placeholder="Correo" value={correo} autoComplete="email"
                            onChange={e => setCorreo(e.target.value)}
                            onBlur={() => blur("correo", validarCorreo, correo)}
                            disabled={loading} error={errores.correo} valid={ok(validarCorreo, correo)} required />
                        <AuthField id="reg-telefono" label="Teléfono" icon={<FaPhoneAlt />} placeholder="Teléfono" value={telefono} inputMode="tel" autoComplete="tel"
                            onChange={e => setTelefono(e.target.value)}
                            onBlur={() => blur("telefono", validarTelefono, telefono)}
                            disabled={loading} error={errores.telefono} valid={ok(validarTelefono, telefono)} required />
                    </div>

                    {/* Fila 3: Dirección + Contraseña */}
                    <div className="au-grid2">
                        <AuthField id="reg-direccion" label="Dirección" icon={<FaMapMarkerAlt />} placeholder="Dirección" value={direccion} autoComplete="street-address"
                            onChange={e => setDireccion(e.target.value)}
                            onBlur={() => blur("direccion", validarDireccion, direccion)}
                            disabled={loading} error={errores.direccion} valid={ok(validarDireccion, direccion)} required />
                        <AuthField id="reg-pass" label="Contraseña" icon={<FaLock />} type="password" placeholder="Contraseña" value={contraseña} autoComplete="new-password"
                            onChange={e => setContraseña(e.target.value)}
                            onBlur={() => blur("contraseña", validarContraseña, contraseña)}
                            disabled={loading} error={errores.contraseña} valid={ok(validarContraseña, contraseña)} required>
                            <StrengthMeter value={contraseña} />
                        </AuthField>
                    </div>

                    {/* Confirmar contraseña */}
                    <AuthField id="reg-confirmar" label="Confirmar contraseña" icon={<FaKey />} type="password" placeholder="Confirmar contraseña" value={confirmar} autoComplete="new-password"
                        onChange={e => setConfirmar(e.target.value)}
                        onBlur={() => blur("confirmar", validarConfirmar, confirmar)}
                        disabled={loading} error={errores.confirmar} valid={ok(validarConfirmar, confirmar)} required />

                    <AuthButton loading={loading} loadingText="Registrando...">Registrar</AuthButton>
                </form>

                <div className="au-links">
                    <p>¿Ya tienes cuenta? <Link to="/login" className="au-link">Inicia sesión</Link></p>
                </div>
            </AuthShell>

            <FooterComponent />
        </>
    );
};

export default RegistroLanding;