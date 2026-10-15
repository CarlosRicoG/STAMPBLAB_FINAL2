import { Container, Row, Col, Card, Button, Carousel } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import FooterComponent from "./footer";
import "../landing/landing.css";
import NavbarComponent from "./NavBarLanding";
import ScrollToTopButton from "./ScrollTopButton";
import { getProductos } from "../../Services/api-productos/productos";
import { getVariantesByProducto } from "../../Services/api-productos/variantes";
import { getColores, getTallas, getTelas } from "../../Services/api-productos/atributos";

const Home = () => {
  const navigate = useNavigate();
  
  // Estados
  const [productos, setProductos] = useState([]);
  const [productosConVariantes, setProductosConVariantes] = useState([]);
  const [colores, setColores] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [telas, setTelas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setCargando(true);

      // Cargar productos y atributos
      const [productosRes, coloresRes, tallasRes, telasRes] = await Promise.all([
        getProductos(),
        getColores(),
        getTallas(),
        getTelas()
      ]);

      const productosData = productosRes.datos || productosRes;
      const coloresData = coloresRes.datos || coloresRes;
      const tallasData = tallasRes.datos || tallasRes;
      const telasData = telasRes || [];

      setProductos(productosData);
      setColores(coloresData);
      setTallas(tallasData);
      setTelas(telasData);

      // Cargar variantes para cada producto
      const productosConInfo = await Promise.all(
        productosData.map(async (producto) => {
          try {
            const variantesRes = await getVariantesByProducto(producto.ProductoID);
            const variantes = variantesRes.datos || variantesRes || [];

            // Extraer información única de las variantes
            const coloresUnicos = [...new Set(variantes.map(v => v.ColorID))];
            const tallasUnicas = [...new Set(variantes.map(v => v.TallaID))];
            const telasUnicas = [...new Set(variantes.filter(v => v.TelaID).map(v => v.TelaID))];

            // Calcular precio mínimo (precio base + talla más barata)
            let precioMinimo = parseFloat(producto.PrecioBase) || 0;
            if (tallasUnicas.length > 0) {
              const preciosTallas = tallasUnicas.map(tallaId => {
                const talla = tallasData.find(t => t.TallaID === tallaId);
                return parseFloat(talla?.Precio) || 0;
              });
              precioMinimo += Math.min(...preciosTallas);
            }

            return {
              ...producto,
              variantes,
              coloresDisponibles: coloresUnicos,
              tallasDisponibles: tallasUnicas,
              telasDisponibles: telasUnicas,
              precioMinimo,
              stockTotal: variantes.reduce((acc, v) => acc + (v.Stock || 0), 0)
            };
          } catch (error) {
            console.error(`Error al cargar variantes del producto ${producto.ProductoID}:`, error);
            return {
              ...producto,
              variantes: [],
              coloresDisponibles: [],
              tallasDisponibles: [],
              telasDisponibles: [],
              precioMinimo: parseFloat(producto.PrecioBase) || 0,
              stockTotal: 0
            };
          }
        })
      );

      // Filtrar solo productos que tengan stock disponible
      const productosDisponibles = productosConInfo.filter(p => p.stockTotal > 0);
      setProductosConVariantes(productosDisponibles);

    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleComprar = (producto) => {
    navigate("/formularioCompra", { 
      state: { 
        producto: {
          ProductoID: producto.ProductoID,
          Nombre: producto.Nombre,
          ImagenProducto: producto.ImagenProducto,
          PrecioBase: producto.PrecioBase,
          Descripcion: producto.Descripcion,
          // Campos adicionales para compatibilidad
          titulo: producto.Nombre,
          img: producto.ImagenProducto,
          precio: producto.precioMinimo,
          estado: "Disponible"
        } 
      } 
    });
  };

  // Función para obtener nombre de color
  const obtenerNombreColor = (colorId) => {
    const color = colores.find(c => c.ColorID === colorId);
    return color?.Nombre || "";
  };

  // Función para obtener código hexadecimal del color
  const obtenerCodigoColor = (colorId) => {
    const color = colores.find(c => c.ColorID === colorId);
    
    // Si existe CodigoHex, usarlo
    if (color?.CodigoHex) {
      return color.CodigoHex;
    }
    
    // Si no, mapear por nombre (solución temporal)
    const nombre = color?.Nombre?.toLowerCase() || '';
    const mapaColores = {
      'rojo': '#FF0000',
      'azul': '#0000FF',
      'verde': '#00FF00',
      'amarillo': '#FFFF00',
      'negro': '#000000',
      'blanco': '#FFFFFF',
      'gris': '#808080',
      'naranja': '#FFA500',
      'morado': '#800080',
      'rosa': '#FFC0CB',
      'cafe': '#8B4513',
      'café': '#8B4513',
      'beige': '#F5F5DC',
      'celeste': '#87CEEB',
      'turquesa': '#40E0D0',
      'violeta': '#EE82EE'
    };
    
    return mapaColores[nombre] || "#CCCCCC";
  };

  // Función para obtener nombre de talla
  const obtenerNombreTalla = (tallaId) => {
    const talla = tallas.find(t => t.TallaID === tallaId);
    return talla?.Nombre || "";
  };

  // Función para obtener nombre de tela
  const obtenerNombreTela = (telaId) => {
    const tela = telas.find(t => t.InsumoID === telaId);
    return tela?.Nombre || "";
  };

  return (
    <div>
      <NavbarComponent />

      {/* Sección principal */}
      <section className="banner-landing">
        <Container fluid className="h-100">
          <Row className="h-100 align-items-center">
            <Col md={6} className="text-center text-md-start px-5">
              <h3 className="fst-italic fw-bold">
                "DISEÑA TU ESTILO, ESTAMPA TU IDENTIDAD"
              </h3>
              <p className="mt-3">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                molestie, neque non scelerisque ultricies, nisl dolor aliquet
                lectus, vitae aliquet elit erat eget nisi.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ¿Quiénes Somos? */}
      <div className="bg-light p-5 text-center d-flex justify-content-center">
        <div className="col-md-8">
          <h4 className="fw-bold">¿QUIÉNES SOMOS?</h4>
          <p className="mt-3">
            En Estampados Lies transformamos tus ideas en prendas únicas. Desde
            2022 personalizamos ropa y accesorios con serigrafía, sublimación,
            vinil textil y bordado. Con tecnología moderna y asesoría creativa,
            damos vida a diseños que reflejan tu estilo.
          </p>
        </div>
      </div>

      {/* Misión y Visión */}
      <section className="p-5 text-center bg-secondary bg-opacity-10">
        <Container>
          <Row>
            <Col md={6}>
              <div className="card-landing">
                <p className="card-landing-title">MISIÓN</p>
                <p className="card-landing-desc">
                  Brindar soluciones creativas en personalización de prendas y
                  accesorios, utilizando técnicas de estampado de alta calidad y
                  tecnología moderna.
                </p>
              </div>
            </Col>

            <Col md={6}>
              <div className="card-landing">
                <p className="card-landing-title">VISIÓN</p>
                <p className="card-landing-desc">
                  Ser una empresa reconocida por la innovación, calidad y el
                  compromiso con la satisfacción de nuestros clientes.
                </p>
                <div className="go-corner">
                  <div className="go-arrow"></div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Productos */}
      <section className="p-5 text-center" style={{ backgroundColor: "#e9ecef" }}>
        <Container>
          <h4 className="fw-bold text-dark">Productos</h4>
          <p className="text-secondary">¡Personaliza tu estilo, crea algo único!</p>
          <br />

          {cargando ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Cargando productos...</span>
              </div>
              <p className="text-muted">Cargando productos disponibles...</p>
            </div>
          ) : productosConVariantes.length === 0 ? (
            <div className="alert alert-info">
              <h5>No hay productos disponibles en este momento</h5>
              <p className="mb-0">Por favor vuelve más tarde</p>
            </div>
          ) : (
            <Carousel
              interval={null}
              controls={true}
              indicators={true}
              pause={false}
              wrap={true}
            >
              {Array.from({ length: Math.ceil(productosConVariantes.length / 3) }).map(
                (_, slideIndex) => (
                  <Carousel.Item key={slideIndex}>
                    <Row className="justify-content-center">
                      {productosConVariantes
                        .slice(slideIndex * 3, slideIndex * 3 + 3)
                        .map((producto) => (
                          <Col md={3} key={producto.ProductoID}>
                            <Card className="shadow-sm h-100 product-card">
                              {/* Contenedor con overlay */}
                              <div className="card-img-container">
                                <Card.Img
                                  variant="top"
                                  src={producto.ImagenProducto || "https://via.placeholder.com/200x200?text=Sin+Imagen"}
                                  alt={producto.Nombre}
                                  style={{
                                    width: "70%",
                                    height: "200px",
                                    objectFit: "contain",
                                    margin: "0 auto",
                                  }}
                                />

                                {/* Overlay al pasar el mouse */}
                                <div className="overlay-info">
                                  {producto.tallasDisponibles.length > 0 && (
                                    <p>
                                      <strong>Tallas:</strong>{" "}
                                      {producto.tallasDisponibles
                                        .map(tallaId => obtenerNombreTalla(tallaId))
                                        .join(", ")}
                                    </p>
                                  )}

                                  {producto.coloresDisponibles.length > 0 && (
                                    <div className="d-flex justify-content-center align-items-center gap-2 mb-2">
                                      <strong>Colores:</strong>
                                      <div className="d-flex gap-2">
                                        {producto.coloresDisponibles.map((colorId) => (
                                          <span
                                            key={colorId}
                                            style={{ 
                                              backgroundColor: obtenerCodigoColor(colorId),
                                              border: "2px solid #ddd",
                                              width: "25px",
                                              height: "25px",
                                              borderRadius: "50%",
                                              display: "inline-block",
                                              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                              cursor: "pointer"
                                            }}
                                            title={obtenerNombreColor(colorId)}
                                          ></span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {producto.telasDisponibles.length > 0 && (
                                    <p>
                                      <strong>Telas:</strong>{" "}
                                      {producto.telasDisponibles
                                        .map(telaId => obtenerNombreTela(telaId))
                                        .filter(Boolean)
                                        .join(", ")}
                                    </p>
                                  )}

                                  <p className="mb-0">
                                    <strong>Stock:</strong>{" "}
                                    <span className={`badge ${
                                      producto.stockTotal > 10 ? 'bg-success' : 
                                      producto.stockTotal > 0 ? 'bg-warning text-dark' : 
                                      'bg-danger'
                                    }`}>
                                      {producto.stockTotal} unidades
                                    </span>
                                  </p>
                                </div>
                              </div>

                              {/* Info básica */}
                              <Card.Body>
                                <div>
                                  <h6 className="mb-1">{producto.Nombre}</h6>
                                  
                                  {producto.Descripcion && (
                                    <p className="text-muted small mb-2" style={{
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      display: "-webkit-box",
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: "vertical"
                                    }}>
                                      {producto.Descripcion}
                                    </p>
                                  )}

                                  <p className="text-success fw-bold mb-0">
                                    ${producto.precioMinimo.toLocaleString()}
                                  </p>
                                  <small className="text-muted">
                                    *Precio varía según talla y tela
                                  </small>
                                </div>

                                <Button
                                  variant="success"
                                  className="w-100 mt-3"
                                  onClick={() => handleComprar(producto)}
                                  aria-label={`Comprar ${producto.Nombre}`}
                                  disabled={producto.stockTotal === 0}
                                >
                                  {producto.stockTotal > 0 ? 'Comprar' : 'Sin Stock'}
                                </Button>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                    </Row>
                  </Carousel.Item>
                )
              )}
            </Carousel>
          )}
        </Container>
      </section>

      <FooterComponent />
      <ScrollToTopButton />
    </div>
  );
};

export default Home;