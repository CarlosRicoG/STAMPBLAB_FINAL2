import { useState, useEffect } from "react";
import { Form, Button, Card, Alert, Spinner } from "react-bootstrap";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import NavbarComponent from "../landing/NavBarLanding";
import FooterComponent from "../landing/footer";
import axios from "axios";
import Swal from "sweetalert2";

const RestablecerContraseña = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [token, setToken] = useState("");
    const [nuevaContraseña, setNuevaContraseña] = useState("");
    const [confirmarContraseña, setConfirmarContraseña] = useState("");
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
    const [tokenValido, setTokenValido] = useState(true);

    useEffect(() => {
        // Obtener el token de la URL
        const tokenFromUrl = searchParams.get('token');
        
        if (!tokenFromUrl) {
            setTokenValido(false);
            setMensaje({ 
                tipo: "danger", 
                texto: "No se proporcionó un token válido" 
            });
        } else {
            setToken(tokenFromUrl);
        }
    }, [searchParams]);

    const handleRestablecer = async (e) => {
        e.preventDefault();
        
        if (!nuevaContraseña || !confirmarContraseña) {
            setMensaje({ tipo: "danger", texto: "Completa todos los campos" });
            return;
        }

        if (nuevaContraseña !== confirmarContraseña) {
            setMensaje({ tipo: "danger", texto: "Las contraseñas no coinciden" });
            return;
        }

        if (nuevaContraseña.length < 4) {
            setMensaje({ tipo: "danger", texto: "La contraseña debe tener al menos 4 caracteres" });
            return;
        }

        setLoading(true);
        setMensaje({ tipo: "", texto: "" });

        try {
            const response = await axios.post("http://localhost:3000/api/restablecer-password", {
                token: token,
                nuevaContraseña: nuevaContraseña
            });

            console.log('Respuesta:', response.data);

            // Mostrar mensaje de éxito
            await Swal.fire({
                icon: "success",
                title: "¡Contraseña actualizada!",
                text: "Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.",
                confirmButtonColor: "#3085d6",
            });

            // Redirigir al login
            navigate("/login");

        } catch (error) {
            console.error("Error:", error);
            
            let mensajeError = "Error al restablecer la contraseña";
            
            if (error.response?.status === 401) {
                mensajeError = "El enlace ha expirado o es inválido. Solicita uno nuevo.";
            } else if (error.response?.data?.mensaje) {
                mensajeError = error.response.data.mensaje;
            }
            
            setMensaje({ 
                tipo: "danger", 
                texto: mensajeError
            });
        } finally {
            setLoading(false);
        }
    };

    if (!tokenValido) {
        return (
            <>
                <NavbarComponent />
                <div className="d-flex justify-content-center align-items-center py-5 bg-light">
                    <Card
                        style={{
                            width: "28rem",
                            backgroundColor: "#fff",
                            color: "#000",
                        }}
                        className="p-4 shadow-lg rounded-4"
                    >
                        <Alert variant="danger">
                            <h5>Enlace inválido</h5>
                            <p>El enlace de recuperación no es válido o ha expirado.</p>
                            <Link to="/recuperarcontraseña" className="btn btn-primary mt-2">
                                Solicitar nuevo enlace
                            </Link>
                        </Alert>
                    </Card>
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
                        width: "28rem",
                        backgroundColor: "#fff",
                        color: "#000",
                    }}
                    className="p-4 shadow-lg rounded-4"
                >
                    <h5 className="text-center mb-4 fw-bold">Restablecer Contraseña</h5>

                    {mensaje.texto && (
                        <Alert variant={mensaje.tipo} className="mb-3">
                            {mensaje.texto}
                        </Alert>
                    )}

                    <Form onSubmit={handleRestablecer}>
                        <Form.Group className="mb-3">
                            <Form.Label>Nueva Contraseña</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Ingresa tu nueva contraseña"
                                value={nuevaContraseña}
                                onChange={(e) => setNuevaContraseña(e.target.value)}
                                disabled={loading}
                                required
                            />
                            <Form.Text className="text-muted">
                                Mínimo 4 caracteres
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label>Confirmar Contraseña</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Confirma tu nueva contraseña"
                                value={confirmarContraseña}
                                onChange={(e) => setConfirmarContraseña(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </Form.Group>

                        <div className="d-grid mb-3">
                            <Button 
                                variant="primary" 
                                type="submit" 
                                className="fw-bold"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            className="me-2"
                                        />
                                        Actualizando...
                                    </>
                                ) : (
                                    "Restablecer Contraseña"
                                )}
                            </Button>
                        </div>

                        <div className="text-center">
                            <Link to="/login" className="text-decoration-none">
                                ← Volver al inicio de sesión
                            </Link>
                        </div>
                    </Form>
                </Card>
            </div>

            <FooterComponent />
        </>
    );
};

export default RestablecerContraseña;