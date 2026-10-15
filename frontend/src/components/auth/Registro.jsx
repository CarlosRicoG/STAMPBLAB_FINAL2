import { useState } from "react";
import { Form, Button, Card, Row, Col } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { registrarUsuario } from "../../Services/api-auth/auth";
import fondo from "../../assets/images/imagenfondo.png";
import NavbarComponent from "../landing/NavBarLanding";
import FooterComponent from "../landing/footer";
import Swal from "sweetalert2";

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

    // Estados para errores de validación
    const [errores, setErrores] = useState({
        nombre: "",
        documento: "",
        correo: "",
        telefono: "",
        direccion: "",
        contraseña: "",
        confirmar: ""
    });

    // Validación de nombre
    const validarNombre = (valor) => {
        if (!valor.trim()) {
            return "El nombre es requerido";
        }
        if (valor.trim().length < 3) {
            return "El nombre debe tener al menos 3 caracteres";
        }
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(valor)) {
            return "El nombre solo debe contener letras";
        }
        return "";
    };

    // Validación de documento
    const validarDocumento = (valor) => {
        if (!valor.trim()) {
            return "El documento es requerido";
        }
        if (!/^\d+$/.test(valor)) {
            return "El documento solo debe contener números";
        }
        if (valor.length < 6 || valor.length > 10) {
            return "El documento debe tener entre 6 y 10 dígitos";
        }
        return "";
    };

    // Validación de correo
    const validarCorreo = (valor) => {
        if (!valor.trim()) {
            return "El correo es requerido";
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(valor)) {
            return "El correo no es válido";
        }
        return "";
    };

    // Validación de teléfono
    const validarTelefono = (valor) => {
        if (!valor.trim()) {
            return "El teléfono es requerido";
        }
        if (!/^\d+$/.test(valor)) {
            return "El teléfono solo debe contener números";
        }
        if (valor.length < 7 || valor.length > 10) {
            return "El teléfono debe tener entre 7 y 10 dígitos";
        }
        return "";
    };

    // Validación de dirección
    const validarDireccion = (valor) => {
        if (!valor.trim()) {
            return "La dirección es requerida";
        }
        if (valor.trim().length < 5) {
            return "La dirección debe tener al menos 5 caracteres";
        }
        return "";
    };

    // Validación de contraseña
    const validarContraseña = (valor) => {
        if (!valor) {
            return "La contraseña es requerida";
        }
        if (valor.length < 4) {
            return "La contraseña debe tener al menos 4 caracteres";
        }
        if (valor.length > 20) {
            return "La contraseña no debe exceder 20 caracteres";
        }
        return "";
    };

    // Validación de confirmación de contraseña
    const validarConfirmar = (valor) => {
        if (!valor) {
            return "Debes confirmar tu contraseña";
        }
        if (valor !== contraseña) {
            return "Las contraseñas no coinciden";
        }
        return "";
    };

    // Manejadores onBlur
    const handleBlurNombre = () => {
        const error = validarNombre(nombre);
        setErrores(prev => ({ ...prev, nombre: error }));
    };

    const handleBlurDocumento = () => {
        const error = validarDocumento(documento);
        setErrores(prev => ({ ...prev, documento: error }));
    };

    const handleBlurCorreo = () => {
        const error = validarCorreo(correo);
        setErrores(prev => ({ ...prev, correo: error }));
    };

    const handleBlurTelefono = () => {
        const error = validarTelefono(telefono);
        setErrores(prev => ({ ...prev, telefono: error }));
    };

    const handleBlurDireccion = () => {
        const error = validarDireccion(direccion);
        setErrores(prev => ({ ...prev, direccion: error }));
    };

    const handleBlurContraseña = () => {
        const error = validarContraseña(contraseña);
        setErrores(prev => ({ ...prev, contraseña: error }));
        // Re-validar confirmar si ya tiene valor
        if (confirmar) {
            const errorConfirmar = validarConfirmar(confirmar);
            setErrores(prev => ({ ...prev, confirmar: errorConfirmar }));
        }
    };

    const handleBlurConfirmar = () => {
        const error = validarConfirmar(confirmar);
        setErrores(prev => ({ ...prev, confirmar: error }));
    };

    const handleRegistro = async (e) => {
        e.preventDefault();

        // Validar todos los campos antes de enviar
        const nuevosErrores = {
            nombre: validarNombre(nombre),
            documento: validarDocumento(documento),
            correo: validarCorreo(correo),
            telefono: validarTelefono(telefono),
            direccion: validarDireccion(direccion),
            contraseña: validarContraseña(contraseña),
            confirmar: validarConfirmar(confirmar)
        };

        setErrores(nuevosErrores);

        // Verificar si hay errores
        const hayErrores = Object.values(nuevosErrores).some(error => error !== "");
        if (hayErrores) {
            Swal.fire({
                icon: "error",
                title: "Errores en el formulario",
                text: "Por favor corrige los errores antes de continuar",
            });
            return;
        }

        setLoading(true);

        try {
            const datos = {
                DocumentoID: documento.trim(),
                Nombre: nombre.trim(),
                Correo: correo.trim(),
                Telefono: telefono.trim(),
                Direccion: direccion.trim(),
                Contraseña: contraseña,
                RolID: 2,
            };

            const response = await registrarUsuario(datos);
            const registroExitoso = response.data?.estado !== false;

            if (registroExitoso) {
                Swal.fire({
                    icon: "success",
                    title: "¡Registro exitoso!",
                    text: "Tu cuenta ha sido creada. Por favor inicia sesión.",
                    confirmButtonColor: "#3085d6",
                }).then(() => {
                    navigate("/login");
                });
            } else {
                throw new Error(response.data?.mensaje || "Error al registrar usuario");
            }
        } catch (err) {
            console.error("Error en registro:", err);
            Swal.fire({
                icon: "error",
                title: "Error al registrarse",
                text: err.response?.data?.mensaje || err.message || "Verifica los datos e intenta nuevamente",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <NavbarComponent />

            <div className="d-flex justify-content-center align-items-center py-5 bg-light">
                <Card
                    style={{
                        width: "65rem",
                        backgroundColor: "#ffffff",
                        color: "#212529",
                        border: "1px solid #dee2e6",
                    }}
                    className="shadow-lg rounded-4 overflow-hidden"
                >
                    <Row className="g-0">
                        <Col md={6} className="d-none d-md-block">
                            <div
                                style={{
                                    backgroundImage: `url(${fondo})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    height: "100%",
                                    width: "100%",
                                }}
                            ></div>
                        </Col>

                        <Col md={6} className="p-5 d-flex flex-column justify-content-center">
                            <h4 className="text-center mb-4 fw-bold text-dark">
                                Formulario de Registro
                            </h4>

                            <Form onSubmit={handleRegistro}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">Nombre</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Ingresa tu nombre"
                                                value={nombre}
                                                onChange={(e) => setNombre(e.target.value)}
                                                onBlur={handleBlurNombre}
                                                className="rounded-3 shadow-sm"
                                                disabled={loading}
                                                isInvalid={!!errores.nombre}
                                                required
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errores.nombre}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">Número documento</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Número de documento"
                                                value={documento}
                                                onChange={(e) => setDocumento(e.target.value)}
                                                onBlur={handleBlurDocumento}
                                                className="rounded-3 shadow-sm"
                                                disabled={loading}
                                                isInvalid={!!errores.documento}
                                                required
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errores.documento}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">Correo electrónico</Form.Label>
                                            <Form.Control
                                                type="email"
                                                placeholder="Correo"
                                                value={correo}
                                                onChange={(e) => setCorreo(e.target.value)}
                                                onBlur={handleBlurCorreo}
                                                className="rounded-3 shadow-sm"
                                                disabled={loading}
                                                isInvalid={!!errores.correo}
                                                required
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errores.correo}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">Teléfono</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Teléfono"
                                                value={telefono}
                                                onChange={(e) => setTelefono(e.target.value)}
                                                onBlur={handleBlurTelefono}
                                                className="rounded-3 shadow-sm"
                                                disabled={loading}
                                                isInvalid={!!errores.telefono}
                                                required
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errores.telefono}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">Dirección</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Dirección"
                                                value={direccion}
                                                onChange={(e) => setDireccion(e.target.value)}
                                                onBlur={handleBlurDireccion}
                                                className="rounded-3 shadow-sm"
                                                disabled={loading}
                                                isInvalid={!!errores.direccion}
                                                required
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errores.direccion}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">Contraseña</Form.Label>
                                            <Form.Control
                                                type="password"
                                                placeholder="Contraseña"
                                                value={contraseña}
                                                onChange={(e) => setContraseña(e.target.value)}
                                                onBlur={handleBlurContraseña}
                                                className="rounded-3 shadow-sm"
                                                disabled={loading}
                                                isInvalid={!!errores.contraseña}
                                                required
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errores.contraseña}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-semibold">Confirmar contraseña</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Confirmar contraseña"
                                        value={confirmar}
                                        onChange={(e) => setConfirmar(e.target.value)}
                                        onBlur={handleBlurConfirmar}
                                        className="rounded-3 shadow-sm"
                                        disabled={loading}
                                        isInvalid={!!errores.confirmar}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errores.confirmar}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <div className="d-grid mb-3">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="fw-bold w-100 rounded-pill shadow-sm"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Registrando...
                                            </>
                                        ) : (
                                            "Registrar"
                                        )}
                                    </Button>
                                </div>

                                <p className="text-center mb-0 text-secondary">
                                    ¿Ya tienes cuenta?{" "}
                                    <Link
                                        to="/login"
                                        className="fw-semibold text-primary text-decoration-none"
                                    >
                                        Inicia sesión
                                    </Link>
                                </p>
                            </Form>
                        </Col>
                    </Row>
                </Card>
            </div>

            <FooterComponent />
        </>
    );
};

export default RegistroLanding;