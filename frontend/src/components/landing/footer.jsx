import { Container, Row, Col } from "react-bootstrap";
import { FaWhatsapp, FaFacebook, FaInstagram } from "react-icons/fa";
import { Link } from "react-router-dom";

const FooterComponent = () => {
    return (
        <footer className="bg-dark text-white pt-4 pb-3 mt-5">
            <Container>
                <Row>
                    {/* Redes sociales */}
                    <Col md={4} className="mb-3 text-center text-md-start">
                        <p className="fs-6 ms-5 text-light">Nuestras Redes</p>
                        <div className="d-flex gap-5 justify-content-center justify-content-md-start mt-3">
                            <a href="https://wa.me/" target="_blank" rel="noreferrer">
                                <FaWhatsapp size={35} color="green" />
                            </a>
                            <a href="https://facebook.com" target="_blank" rel="noreferrer">
                                <FaFacebook size={35} color="#1877f2" />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noreferrer">
                                <FaInstagram size={35} color="#e4405f" />
                            </a>
                        </div>
                    </Col>

                    {/* Información legal */}
                    <Col md={4} className="mb-3 text-center">
                        <p className="fst-italic mb-1">Información legal</p>
                        <p className="fst-italic mb-0">Política y Privacidad</p>
                    </Col>

                    {/* Navegación */}
                    <Col md={4} className="mb-3 text-center text-md-end">
                        <img
                            src="src/assets/logostamplab.png"
                            alt="StampLab Logo"
                            style={{ height: "90px" }}
                            className="me-2"
                        />
                    </Col>
                </Row>
            </Container>
        </footer>
    );
};

export default FooterComponent;