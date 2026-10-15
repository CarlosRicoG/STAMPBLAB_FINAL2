import { useState, useEffect } from "react";
import { Navbar, Nav, Container, Button, Modal } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";

const NavbarComponent = () => {
    const [showPerfil, setShowPerfil] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();


    // Verificar autenticación cada vez que cambie la ruta
    useEffect(() => {
        checkAuth();
    }, [location]); // Agregar location como dependencia

    const checkAuth = () => {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("usuario");

        if (token && user) {
            try {
                const parsedUser = JSON.parse(user);
                setUserData(parsedUser);
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Error al parsear usuario:", error);
                setIsAuthenticated(false);
                setUserData(null);
            }
        } else {
            setIsAuthenticated(false);
            setUserData(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        setIsAuthenticated(false);
        setUserData(null);
        setShowPerfil(false);
        navigate("/login");
    };

    const handlePerfilOpen = () => {
        if (isAuthenticated) {
            setShowPerfil(true);
        }
    };

    const handlePerfilClose = () => setShowPerfil(false);

    return (
        <>
            {/* NAVBAR */}
            <Navbar style={{ height: "85px" }} bg="light" expand="md" className="shadow-sm">
                <Container>
                    {/* Logo como Brand */}
                    <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
                        <img
                            src="src/assets/logostamplab.png"
                            alt="StampLab Logo"
                            style={{ height: "71px" }}
                            className="me-2"
                        />
                    </Navbar.Brand>

                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto align-items-center gap-3">
                            {/* Inicio */}
                            <Nav.Link
                                as={Link}
                                to="/landing"
                                style={{
                                    color: "#384c6f",
                                    fontWeight: 650,
                                    transition: "all 0.2s ease-in-out",
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.color = "#64b5f6";
                                    e.target.style.fontWeight = "600";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.color = "#384c6f";
                                    e.target.style.fontWeight = "650";
                                }}
                            >
                                Inicio
                            </Nav.Link>

                            {/* Cotización */}
                            <Nav.Link
                                as={Link}
                                to="/cotizacionesLanding"
                                style={{
                                    color: "#384c6f",
                                    fontWeight: 650,
                                    transition: "all 0.2s ease-in-out",
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.color = "#64b5f6";
                                    e.target.style.fontWeight = "600";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.color = "#384c6f";
                                    e.target.style.fontWeight = "650";
                                }}
                            >
                                Cotización
                            </Nav.Link>

                            {/* Productos */}
                            <Nav.Link
                                as={Link}
                                to="/productosLanding"
                                style={{
                                    color: "#384c6f",
                                    fontWeight: 650,
                                    transition: "all 0.2s ease-in-out",
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.color = "#64b5f6";
                                    e.target.style.fontWeight = "600";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.color = "#384c6f";
                                    e.target.style.fontWeight = "650";
                                }}
                            >
                                Productos
                            </Nav.Link>

                            {/* Servicios */}
                            <Nav.Link
                                as={Link}
                                to="/servicios"
                                style={{
                                    color: "#384c6f",
                                    fontWeight: 650,
                                    transition: "all 0.2s ease-in-out",
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.color = "#64b5f6";
                                    e.target.style.fontWeight = "600";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.color = "#384c6f";
                                    e.target.style.fontWeight = "650";
                                }}
                            >
                                Servicios
                            </Nav.Link>

                            {/* Mostrar opciones solo si está autenticado */}
                            {isAuthenticated ? (
                                <>
                                    {/* Icono Perfil */}
                                    <FaUserCircle
                                        size={30}
                                        className="text-secondary"
                                        style={{ cursor: "pointer" }}
                                        onClick={handlePerfilOpen}
                                        title="Ver perfil"
                                    />

                                    {/* Botón Cerrar Sesión */}
                                    <Button variant="dark" size="sm" onClick={handleLogout}>
                                        Cerrar Sesión
                                    </Button>
                                </>
                            ) : (
                                <>
                                    {/* Botones para usuarios no autenticados */}
                                    <Button
                                        as={Link}
                                        to="/login"
                                        variant="outline-primary"
                                        size="sm"
                                    >
                                        Iniciar Sesión
                                    </Button>
                                    <Button
                                        as={Link}
                                        to="/signup"
                                        variant="primary"
                                        size="sm"
                                    >
                                        Registrarse
                                    </Button>
                                </>
                            )}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* MODAL PERFIL - Solo se muestra si hay usuario autenticado */}
            {isAuthenticated && userData && (
                <Modal show={showPerfil} onHide={handlePerfilClose} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Perfil de Usuario</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="text-center">
                        <FaUserCircle size={60} className="mb-3 text-secondary" />
                        <h6 className="fw-normal fst-italic">{userData.Nombre || "Usuario"}</h6>
                        <p className="text-muted small">{userData.Correo || "Sin correo"}</p>

                        {/* Botones del modal */}
                        <div className="d-flex justify-content-center gap-2 mt-4">
                            <Button
                                as={Link}
                                to="/miscotizaciones"
                                variant="info"
                                className="w-50 text-white fw-bold"
                                onClick={handlePerfilClose}
                            >
                                Mis Cotizaciones
                            </Button>

                            <Button className="w-50" as={Link} to="/editarperfil" variant="primary" onClick={handlePerfilClose}>
                                Editar Información
                            </Button>
                        </div>
                    </Modal.Body>
                </Modal>
            )}
        </>
    );
};

export default NavbarComponent;