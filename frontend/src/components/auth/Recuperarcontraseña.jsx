import { useState } from "react";
import { Form, Button, Card, Alert, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import NavbarComponent from "../landing/NavBarLanding";
import FooterComponent from "../landing/footer";
import axios from "axios";

const RecuperarContraseña = () => {
    const [correo, setCorreo] = useState("");
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

    const validarCorreo = (correo) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(correo);
    };


    const handleRecuperar = async (e) => {
        e.preventDefault();

        if (!correo) {
            setMensaje({ tipo: "danger", texto: "Por favor ingresa tu correo" });
            return;
        }

        if (!validarCorreo(correo)) {
            setMensaje({ tipo: "danger", texto: "Por favor ingresa un correo válido" });
            return;
        }

        setLoading(true);
        setMensaje({ tipo: "", texto: "" });

        try {
            const response = await axios.post("http://localhost:3000/api/recuperar-password", {
                Correo: correo
            });

            setMensaje({
                tipo: "success",
                texto: "Si el correo está registrado, te enviaremos un enlace de recuperación."
            });

            setCorreo("");

        } catch (error) {
            console.error("Error:", error);
            setMensaje({
                tipo: "danger",
                texto: error.response?.data?.mensaje || "Error al procesar la solicitud"
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
                        width: "28rem",
                        backgroundColor: "#fff",
                        color: "#000",
                    }}
                    className="p-4 shadow-lg rounded-4"
                >
                    <h5 className="text-center mb-4 fw-bold">Recuperar Contraseña</h5>

                    {mensaje.texto && (
                        <Alert variant={mensaje.tipo} className="mb-3">
                            {mensaje.texto}
                        </Alert>
                    )}

                    <Form onSubmit={handleRecuperar}>
                        <Form.Group className="mb-3">
                            <Form.Label>Correo electrónico</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="Ingresa tu correo electrónico"
                                value={correo}
                                onChange={(e) => {
                                    setCorreo(e.target.value);
                                    if (mensaje.texto) setMensaje({ tipo: "", texto: "" });
                                }}
                                disabled={loading}
                                required
                            />
                            <Form.Text className="text-muted">
                                Te enviaremos un enlace para restablecer tu contraseña
                            </Form.Text>
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
                                        Enviando...
                                    </>
                                ) : (
                                    "Enviar enlace"
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

export default RecuperarContraseña;