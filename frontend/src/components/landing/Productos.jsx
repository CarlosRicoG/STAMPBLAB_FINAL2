import { useState, useEffect } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Badge,
    InputGroup,
    Form,
    Spinner,
} from "react-bootstrap";
import NavbarComponent from "./NavBarLanding";
import FooterComponent from "./footer";
import { useNavigate } from "react-router-dom";
import { getProductos } from "../../Services/api-productos/productos";
import { getTallas } from "../../Services/api-productos/atributos";

const ProductosLanding = () => {
    const [search, setSearch] = useState("");
    const [productos, setProductos] = useState([]);
    const [tallas, setTallas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const [productosRes, tallasRes] = await Promise.all([
                getProductos(),
                getTallas()
            ]);

            const productosData = productosRes.datos || productosRes;

            // 🆕 FILTRAR SOLO PRODUCTOS DISPONIBLES
            const productosDisponibles = productosData.filter(p => {
                if (!p.inventario || p.inventario.length === 0) return false;
                // Verificar que tenga al menos una variante con stock > 0 y Estado = true/1
                return p.inventario.some(inv => inv.Stock > 0 && inv.Estado);
            });

            setProductos(productosDisponibles);
            setTallas(tallasRes.datos || tallasRes);
        } catch (error) {
            console.error("Error al cargar productos:", error);
        } finally {
            setCargando(false);
        }
    };


    const obtenerTallasProducto = (producto) => {
        if (!producto.inventario || producto.inventario.length === 0) return [];

        const tallasUnicas = [...new Set(
            producto.inventario
                .filter(inv => inv.Stock > 0 && inv.Estado) // Solo variantes disponibles
                .map(inv => inv.talla?.Nombre)
                .filter(Boolean)
        )];
        return tallasUnicas;
    };

    const obtenerColoresProducto = (producto) => {
        if (!producto.inventario || producto.inventario.length === 0) return [];

        const coloresUnicos = [...new Set(
            producto.inventario
                .filter(inv => inv.Stock > 0 && inv.Estado) // Solo variantes disponibles
                .map(inv => inv.color?.Nombre)
                .filter(Boolean)
        )];
        return coloresUnicos;
    };


    const obtenerPrecioProducto = (producto) => {
        const precioBase = parseFloat(producto.PrecioBase) || 0;

        if (!producto.inventario || producto.inventario.length === 0) {
            return precioBase;
        }

        // Obtener variantes disponibles
        const variantesDisponibles = producto.inventario.filter(inv => inv.Stock > 0 && inv.Estado);

        if (variantesDisponibles.length === 0) return precioBase;

        // Obtener la talla más económica disponible
        const tallasIds = [...new Set(variantesDisponibles.map(inv => inv.TallaID))].sort((a, b) => a - b);
        const tallaMasPequena = tallas.find(t => t.TallaID === tallasIds[0]);
        const precioTalla = parseFloat(tallaMasPequena?.Precio) || 0;

        // Obtener la tela más económica disponible (si existe)
        const telasDelProducto = variantesDisponibles
            .map(inv => inv.tela)
            .filter(Boolean);

        let precioTelaMasBarata = 0;
        if (telasDelProducto.length > 0) {
            const preciosTelas = telasDelProducto.map(t => parseFloat(t.PrecioTela) || 0);
            precioTelaMasBarata = Math.min(...preciosTelas);
        }

        return precioBase + precioTalla + precioTelaMasBarata;
    };


    const coloresHex = {
        "Rojo": "#FF0000",
        "Azul": "#0000FF",
        "Verde": "#00FF00",
        "Amarillo": "#FFFF00",
        "Negro": "#000000",
        "Blanco": "#FFFFFF",
        "Rosa": "#FFC0CB",
        "Morado": "#800080",
        "Naranja": "#FFA500",
        "Gris": "#808080",
        "Café": "#8B4513",
    };

    const obtenerColorHex = (nombreColor) => {
        return coloresHex[nombreColor] || "#CCCCCC";
    };

    // Filtrar productos por búsqueda
    const filtered = productos.filter((p) =>
        p.Nombre.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <NavbarComponent />

            <section className="py-5 bg-light" id="productos">
                <Container>
                    <h3 className="fw-bold mb-0 text-center">Nuestros Productos</h3>
                    <br />
                    <div className="d-flex align-items-center justify-content-end gap-3 flex-wrap mb-4">
                        <InputGroup style={{ maxWidth: 250 }}>
                            <Form.Control
                                placeholder="Buscar por nombre"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <InputGroup.Text>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    fill="currentColor"
                                    viewBox="0 0 16 16"
                                >
                                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.85-3.85h-.017zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                                </svg>
                            </InputGroup.Text>
                        </InputGroup>
                    </div>

                    {cargando ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3">Cargando productos...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-5">
                            <p className="text-muted">
                                {search
                                    ? "No se encontraron productos con ese criterio"
                                    : "No hay productos disponibles en este momento"}
                            </p>
                        </div>
                    ) : (
                        <Row className="g-4">
                            {filtered.map((p) => {
                                const tallasProducto = obtenerTallasProducto(p);
                                const coloresProducto = obtenerColoresProducto(p);
                                const precio = obtenerPrecioProducto(p);

                                return (
                                    <Col md={3} sm={6} xs={12} className="d-flex" key={p.ProductoID}>
                                        <Card className="shadow-lg flex-fill h-75 product-card">
                                            <div
                                                className="card-img-container"
                                                style={{
                                                    position: "relative",
                                                    height: 370,
                                                    overflow: "hidden",
                                                }}
                                            >
                                                {p.ImagenProducto ? (
                                                    <Card.Img
                                                        src={p.ImagenProducto}
                                                        alt={p.Nombre}
                                                        className="w-100"
                                                        style={{
                                                            height: 182,
                                                            objectFit: "contain",
                                                            display: "block",
                                                            margin: "0 auto",
                                                        }}
                                                        onError={(e) => {
                                                            e.target.style.display = "none";
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        className="bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center"
                                                        style={{ height: 182 }}
                                                    >
                                                        <span className="text-muted">Sin imagen</span>
                                                    </div>
                                                )}

                                                <div className="overlay-info">
                                                    {tallasProducto.length > 0 && (
                                                        <p>
                                                            <strong>Tallas:</strong>{" "}
                                                            {tallasProducto.join(", ")}
                                                        </p>
                                                    )}
                                                    {coloresProducto.length > 0 && (
                                                        <div className="d-flex justify-content-center align-items-center gap-2 mb-2">
                                                            <strong>Colores:</strong>
                                                            <div className="d-flex gap-2">
                                                                {coloresProducto.map((color, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="color-circle"
                                                                        style={{
                                                                            backgroundColor:
                                                                                obtenerColorHex(color),
                                                                        }}
                                                                    ></span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <Card.Body className="d-flex flex-column justify-content-between align-items-center text-center">
                                                <div>
                                                    <div className="mb-2">
                                                        <Badge bg="success">Disponible</Badge>
                                                    </div>

                                                    <Card.Title className="fw-bold">
                                                        {p.Nombre}
                                                    </Card.Title>
                                                    <Card.Text className="text-muted">
                                                        {p.Descripcion || "Sin descripción"}
                                                    </Card.Text>


                                                    <Card.Text className="fw-bold mb-3 fs-5">
                                                        ${obtenerPrecioProducto(p).toLocaleString()}
                                                    </Card.Text>
                                                </div>

                                                <Button
                                                    className="btn btn-primary mt-2"
                                                    onClick={() =>
                                                        navigate("/formularioCompra", {
                                                            state: { producto: p },
                                                        })
                                                    }
                                                >
                                                    Comprar Producto
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                    )}
                </Container>
            </section>

            <FooterComponent />
        </>
    );
};

export default ProductosLanding;