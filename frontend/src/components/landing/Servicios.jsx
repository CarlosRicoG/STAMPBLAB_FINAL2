import { Container, Row, Col, Card, Button, Badge, InputGroup, Form } from "react-bootstrap";
import NavbarComponent from "./NavBarLanding";
import FooterComponent from "./footer";

const Servicios = () => {
    const tecnicas = [
        {
            titulo: "Serigrafía",
            img: "https://cdn.shopify.com/s/files/1/0240/5856/0608/files/serigrafia-impresion-permeografica-branddu.webp?v=1701425637",
            descripcion:
                "Este servicio es ideal para estampados duraderos y de alta calidad, perfecta para pedidos en cantidad. Te garantiza colores vivos, buena resistencia al lavado y un acabado profesional.",
            estado: "Activo",
        },
        {
            titulo: "Sublimacion", 
            img: "https://www.brildor.com/blog/wp-content/uploads/2014/04/cabecera-que-es-la-sublimacion-2-1024x581.jpg",
            descripcion:
                "La sublimación es perfecta para diseños a todo color con excelente definición. Es ideal para camisetas blancas de poliéster y productos personalizados.",
            estado: "Activo",
        },
        {
            titulo: "Bordado",
            img: "https://cursos.artesdeolga.com/wp-content/uploads/2015/12/curso-bordado.jpg",
            descripcion:
                "El bordado ofrece un acabado elegante, resistente y de alta calidad. Ideal para uniformes, gorras y chaquetas. No se desgasta con el uso.",
            estado: "Activo",
        },
        {
            titulo: "Vinilo Textil",
            img: "https://alianzadigitalsyp.com/wp-content/uploads/2020/09/vinilo-adhesivo-textil-para-corte-alianza-digital-syp.jpg",
            descripcion:
                "El vinilo textil es perfecto para personalizar prendas con colores sólidos y vibrantes. Ideal para camisetas, uniformes deportivos, bolsas, gorras y buzos.",
            estado: "Inactivo",
        },
    ];

    return (
        <>
            <NavbarComponent />
            <section className="py-5 bg-light" id="servicios">
                <Container>
                    {/* Título + Buscador con lupa */}
                    <h3 className="fw-bold mb-0 text-center">Nuestras Técnicas</h3>
                    <div className="d-flex align-items-center justify-content-end gap-3 flex-wrap mb-4">
                        <InputGroup style={{ maxWidth: 320 }}>
                            <InputGroup.Text>
                                {/* Lupa (SVG) */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16" height="16"
                                    viewBox="0 0 16 16"
                                    fill="currentColor"
                                >
                                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.85-3.85h-.017zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                                </svg>
                            </InputGroup.Text>
                            <Form.Control placeholder="Nombre técnica" aria-label="Nombre técnica" />
                        </InputGroup>
                    </div>

                    <Row className="justify-content-center">
                        {tecnicas.map((t, index) => (
                            <Col md={3} sm={6} xs={12} className="mb-4" key={index}>
                                <Card className="shadow-sm h-100">
                                    <Card.Img
                                        variant="top"
                                        src={t.img}
                                        style={{ height: "220px", objectFit: "cover" }}
                                    />
                                    <Card.Body className="d-flex flex-column">
                                        <Card.Title className="fw-bold">{t.titulo}</Card.Title>
                                        <Card.Text className="flex-grow-1">{t.descripcion}</Card.Text>

                                        {/* Estado */}
                                        <div className="mb-2">
                                            {t.estado === "Activo" ? (
                                                <Badge bg="success">Activo</Badge>
                                            ) : (
                                                <Badge bg="danger">Inactivo</Badge>
                                            )}
                                        </div>

                                        {/* Botón */}
                                        {t.estado === "Activo" ? (
                                            <Button variant="primary">Comprar Servicio</Button>
                                        ) : (
                                            <Button
                                                variant="info"
                                                className="w-100 fw-bold"
                                                disabled
                                            >
                                                Inactivo
                                            </Button>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>
            <FooterComponent />
        </>
    );
};

export default Servicios;
