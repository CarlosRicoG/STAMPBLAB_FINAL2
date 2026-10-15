import { useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { Modal, Button, Form } from "react-bootstrap";

const NavAdmin = () => {

    const token = localStorage.getItem("token");

    // Si no hay token, NO renderizar nada
    if (!token) {
        return null;
    }


    const [showPerfil, setShowPerfil] = useState(false);
    const [showEditar, setShowEditar] = useState(false);
    const navigate = useNavigate();

    // Abrir modal de perfil
    const handlePerfilOpen = () => setShowPerfil(true);
    const handlePerfilClose = () => setShowPerfil(false);


    // Abrir modal de editar
    const handleEditarOpen = () => {
        setShowPerfil(false);
        setShowEditar(true);
    };
    const handleEditarClose = () => setShowEditar(false);


    // Función para cerrar sesión correctamente
    const handleLogout = () => {
        // Limpiar localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Navegar a login
        navigate("/login");
    };

    return (
        <>
            {/* Navbar */}
            <header
                className="d-flex justify-content-between align-items-center px-4"
                style={{
                    height: "64px",
                    backgroundColor: "#fff",
                    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                }}
            >
                {/* Nombre aplicativo */}
                <h1 className="fw-bold fs-3 ms-3 mt-1">StampLab</h1>

                {/* Administrador + Perfil */}
                <div className="d-flex align-items-center gap-3">
                    <span className="fw-medium">Administrador</span>
                    <FaUserCircle
                        size={35}
                        className="text-secondary"
                        style={{ cursor: "pointer" }}
                        onClick={handlePerfilOpen}
                    />
                    <Button
                        variant="dark"
                        className="px-3 py-1 me-2"
                        onClick={handleLogout}
                    >
                        Cerrar Sesión
                    </Button>
                </div>
            </header>

            {/* Modal Perfil */}
            <Modal show={showPerfil} onHide={handlePerfilClose} centered>
                <Modal.Body className="text-center">
                    <FaUserCircle size={50} className="mb-3" />
                    <h6 className="fw-normal fst-italic">Pepito Ramirez</h6>
                    <p className="text-muted small">pepito@gmail.com</p>
                    <Button variant="primary" onClick={handleEditarOpen}>
                        Editar Información
                    </Button>
                </Modal.Body>
                <Button
                    variant="danger"
                    className="position-absolute top-0 end-0 m-2"
                    onClick={handlePerfilClose}
                >
                    X
                </Button>
            </Modal>


            {/* Modal Editar Perfil */}
            <Modal show={showEditar} onHide={handleEditarClose} centered>
                <Modal.Header closeButton className="justify-content-center">
                    <Modal.Title className="w-100 text-center">Editar Perfil</Modal.Title>
                </Modal.Header>


                <Modal.Body style={{}}>
                    <Form>
                        <div className="row">
                            <Form.Group className="mb-3 col-6">
                                <Form.Label className="fw-bold">Nombre</Form.Label>
                                <Form.Control type="text" className="border border-1 border-dark" defaultValue="pepito perez" />
                            </Form.Group>

                            <Form.Group className="mb-3 col-6">
                                <Form.Label className="fw-bold">Número documento</Form.Label>
                                <Form.Control type="text" className="border border-1 border-dark" defaultValue="129292929202020" />
                            </Form.Group>
                        </div>

                        <div className="row">
                            <Form.Group className="mb-3 col-6">
                                <Form.Label className="fw-bold">Correo electrónico</Form.Label>
                                <Form.Control type="email" className="border border-1 border-dark" defaultValue="pepito@gmail.com" />
                            </Form.Group>

                            <Form.Group className="mb-3 col-6">
                                <Form.Label className="fw-bold">Teléfono</Form.Label>
                                <Form.Control type="text" className="border border-1 border-dark" defaultValue="31077532414" />
                            </Form.Group>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Contraseña</Form.Label>
                            <Form.Control type="password" className="border border-1 border-dark" defaultValue="12345678" />
                        </Form.Group>

                        <div className="d-flex justify-content-center">
                            <Button variant="primary" className="text-white fw-bold w-50">
                                Guardar Cambios
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="danger" onClick={handleEditarClose}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>


        </>
    );
};

export default NavAdmin;
