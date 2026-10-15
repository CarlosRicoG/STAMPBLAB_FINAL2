import { useState, useEffect } from "react";
import { Form, Card, Button, Row, Col } from "react-bootstrap";
import NavbarComponent from "./NavBarLanding";
import FooterComponent from "./footer";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getUsuarioById, updateUsuario } from "../../Services/api-usuarios/usuarios";
import fondoPerfil from "../../assets/images/estampadoslies.png"; // Usa la misma imagen o crea una nueva

const EditarPerfil = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        DocumentoID: "",
        Nombre: "",
        Correo: "",
        Telefono: "",
        Direccion: "",
        Contraseña: "",
    });

    useEffect(() => {
        cargarDatosUsuario();
    }, []);

    const cargarDatosUsuario = async () => {
        try {
            const user = localStorage.getItem("usuario");
            if (!user) {
                Swal.fire({
                    icon: "warning",
                    title: "No autenticado",
                    text: "Debes iniciar sesión para acceder a esta página",
                }).then(() => {
                    navigate("/login");
                });
                return;
            }

            const userData = JSON.parse(user);
            console.log("Datos del usuario en localStorage:", userData);
            
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            if (!userData.DocumentoID) {
                console.error("No se encontró documentoID en localStorage");
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Hay un problema con tu sesión. Por favor inicia sesión nuevamente.",
                }).then(() => {
                    localStorage.clear();
                    navigate("/login");
                });
                return;
            }

            console.log("Cargando usuario con ID:", userData.DocumentoID);

            const response = await getUsuarioById(userData.DocumentoID);

            console.log("Respuesta de la API:", response);

            if (response) {
                setFormData({
                    DocumentoID: response.DocumentoID || "",
                    Nombre: response.Nombre || "",
                    Correo: response.Correo || "",
                    Telefono: response.Telefono || "",
                    Direccion: response.Direccion || "",
                    Contraseña: "",
                });
            }
        } catch (error) {
            console.error("Error al cargar datos:", error);
            console.error("Detalles del error:", error.response);
            
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.response?.data?.mensaje || error.message || "No se pudieron cargar tus datos",
            });
        } finally {
            setLoading(false);
        }
    };

    const validarNombre = (nombre) => {
        const nom = String(nombre || "").trim();
        if (!nom) return "El nombre es obligatorio";
        if (nom.length < 3 || nom.length > 50) return "Entre 3 y 50 caracteres";
        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñüÜ\s]+$/.test(nom)) return "Solo letras";
        return "";
    };

    const validarCorreo = (correo) => {
        const cor = String(correo || "").trim();
        if (!cor) return "El correo es obligatorio";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cor)) return "Correo inválido";
        return "";
    };

    const validarTelefono = (telefono) => {
        const tel = String(telefono || "").trim();
        if (!tel) return "El teléfono es obligatorio";
        if (!/^\d+$/.test(tel)) return "Solo números";
        if (tel.length < 7 || tel.length > 10) return "Entre 7 y 10 dígitos";
        return "";
    };

    const validarDireccion = (direccion) => {
        const dir = String(direccion || "").trim();
        if (!dir) return "La dirección es obligatoria";
        return "";
    };

    const validarContraseña = (contraseña) => {
        if (!contraseña) return "";
        if (contraseña.length < 4) return "Mínimo 4 caracteres";
        return "";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        let error = "";
        switch (name) {
            case "Nombre":
                error = validarNombre(value);
                break;
            case "Correo":
                error = validarCorreo(value);
                break;
            case "Telefono":
                error = validarTelefono(value);
                break;
            case "Direccion":
                error = validarDireccion(value);
                break;
            case "Contraseña":
                error = validarContraseña(value);
                break;
            default:
                break;
        }

        setErrors({
            ...errors,
            [name]: error,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const erroresValidacion = {
            Nombre: validarNombre(formData.Nombre),
            Correo: validarCorreo(formData.Correo),
            Telefono: validarTelefono(formData.Telefono),
            Direccion: validarDireccion(formData.Direccion),
            Contraseña: validarContraseña(formData.Contraseña),
        };

        const erroresActivos = Object.entries(erroresValidacion)
            .filter(([_, valor]) => valor !== "")
            .reduce((acc, [clave, valor]) => ({ ...acc, [clave]: valor }), {});

        if (Object.keys(erroresActivos).length > 0) {
            setErrors(erroresActivos);
            Swal.fire({
                icon: "error",
                title: "Errores en el formulario",
                text: "Por favor corrige los errores antes de continuar",
            });
            return;
        }

        try {
            setLoading(true);

            const dataToSend = {
                Nombre: formData.Nombre.trim(),
                Correo: formData.Correo.trim(),
                Telefono: formData.Telefono.trim(),
                Direccion: formData.Direccion.trim(),
            };

            if (formData.Contraseña && formData.Contraseña.trim()) {
                dataToSend.Contraseña = formData.Contraseña.trim();
            }

            const response = await updateUsuario(formData.DocumentoID, dataToSend);

            if (response.estado) {
                Swal.fire({
                    icon: "success",
                    title: "¡Perfil actualizado!",
                    text: "Por seguridad, debes iniciar sesión nuevamente",
                    confirmButtonColor: "#3085d6",
                }).then(() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/login");
                });
            } else {
                throw new Error(response.mensaje || "Error al actualizar perfil");
            }
        } catch (error) {
            console.error("Error al actualizar perfil:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.response?.data?.mensaje || error.message || "Error al actualizar el perfil",
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <>
                <NavbarComponent />
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
                    <div className="text-center">
                        <div className="spinner-border text-primary mb-3" role="status">
                            <span className="visually-hidden">Cargando...</span>
                        </div>
                        <p className="text-muted">Cargando tus datos...</p>
                    </div>
                </div>
                <FooterComponent />
            </>
        );
    }

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
                        {/* Columna del formulario */}
                        <Col md={6} className="p-5 d-flex flex-column justify-content-center">
                            <h4 className="text-center mb-4 fw-bold text-dark">
                                Editar Perfil
                            </h4>

                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">Nombre</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="Nombre"
                                                value={formData.Nombre}
                                                onChange={handleChange}
                                                className="rounded-3 shadow-sm"
                                                disabled={loading}
                                                isInvalid={!!errors.Nombre}
                                                required
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.Nombre}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">Número documento</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.DocumentoID}
                                                className="rounded-3 shadow-sm bg-light"
                                                disabled
                                                readOnly
                                            />
                                            <small className="text-muted d-block">No modificable</small>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">Correo electrónico</Form.Label>
                                            <Form.Control
                                                type="email"
                                                name="Correo"
                                                value={formData.Correo}
                                                onChange={handleChange}
                                                className="rounded-3 shadow-sm"
                                                disabled={loading}
                                                isInvalid={!!errors.Correo}
                                                required
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.Correo}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">Teléfono</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="Telefono"
                                                value={formData.Telefono}
                                                onChange={handleChange}
                                                className="rounded-3 shadow-sm"
                                                disabled={loading}
                                                isInvalid={!!errors.Telefono}
                                                required
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.Telefono}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">Dirección</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="Direccion"
                                                value={formData.Direccion}
                                                onChange={handleChange}
                                                className="rounded-3 shadow-sm"
                                                disabled={loading}
                                                isInvalid={!!errors.Direccion}
                                                required
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.Direccion}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-semibold">
                                        Nueva Contraseña <small className="text-muted">(Opcional)</small>
                                    </Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="Contraseña"
                                        value={formData.Contraseña}
                                        onChange={handleChange}
                                        placeholder="Dejar vacío para mantener la actual"
                                        className="rounded-3 shadow-sm"
                                        disabled={loading}
                                        isInvalid={!!errors.Contraseña}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.Contraseña}
                                    </Form.Control.Feedback>
                                    <small className="text-muted d-block mt-1">Mínimo 4 caracteres</small>
                                </Form.Group>

                                <div className="d-flex justify-content-center gap-3">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => navigate("/landing")}
                                        disabled={loading}
                                        className="px-4 rounded-pill shadow-sm"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="success"
                                        className="fw-bold px-4 rounded-pill shadow-sm"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Guardando...
                                            </>
                                        ) : (
                                            "Guardar Cambios"
                                        )}
                                    </Button>
                                </div>
                            </Form>
                        </Col>

                        {/* Columna de la imagen */}
                        <Col md={6} className="d-none d-md-block">
                            <div
                                style={{
                                    backgroundImage: `url(${fondoPerfil})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    height: "100%",
                                    width: "100%",
                                }}
                            ></div>
                        </Col>
                    </Row>
                </Card>
            </div>

            <FooterComponent />
        </>
    );
};

export default EditarPerfil;