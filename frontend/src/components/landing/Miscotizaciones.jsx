// components/landing/MisCotizaciones.jsx
import React, { useState, useEffect } from "react";
import { Table, Badge, Button, Modal, Row, Col, Spinner, Alert, Tabs, Tab } from "react-bootstrap";
import { FaEye, FaCheckCircle, FaClock, FaTimesCircle, FaShoppingCart, FaFileAlt, FaExchangeAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import NavbarComponent from "./NavBarLanding";
import FooterComponent from "./footer";
import { getCotizaciones } from "../../Services/api-cotizaciones/cotizaciones";
import axios from "axios";

const MisCotizaciones = () => {
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(null);
    const [cotizaciones, setCotizaciones] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [itemSeleccionado, setItemSeleccionado] = useState(null);
    const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
    const [tabActiva, setTabActiva] = useState("todas");

    useEffect(() => {
        verificarAutenticacion();
        cargarDatos();
    }, []);

    const verificarAutenticacion = () => {
        const usuarioStorage = localStorage.getItem("usuario");
        if (!usuarioStorage) {
            Swal.fire({
                icon: "warning",
                title: "Autenticación requerida",
                text: "Debes iniciar sesión para ver tus solicitudes",
            }).then(() => {
                navigate("/login");
            });
            return;
        }
        setUsuario(JSON.parse(usuarioStorage));
    };

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const usuarioStorage = localStorage.getItem("usuario");
            if (!usuarioStorage) return;

            const usuarioData = JSON.parse(usuarioStorage);

            // Cargar cotizaciones
            const responseCotizaciones = await getCotizaciones();
            const dataCotizaciones = Array.isArray(responseCotizaciones) 
                ? responseCotizaciones 
                : (responseCotizaciones?.datos || []);

            const misCotizaciones = dataCotizaciones
                .filter(c => {
                    const docID = c.usuario?.DocumentoID || c.DocumentoID;
                    return docID === usuarioData.DocumentoID;
                })
                .map(c => {
                    const primerDetalle = c.detalles?.[0] || {};
                    const producto = primerDetalle.producto || {};

                    return {
                        id: c.CotizacionID,
                        tipo: 'cotizacion',
                        numeroReferencia: `COT-${c.CotizacionID}`,
                        fecha: c.FechaCotizacion,
                        estado: c.estado?.Nombre || "Pendiente",
                        valorTotal: c.ValorTotal || 0,
                        producto: {
                            nombre: producto.Nombre || "Sin producto",
                            imagen: producto.ImagenProducto || "/placeholder-product.png"
                        },
                        cantidad: primerDetalle.Cantidad || 0,
                        traePrenda: primerDetalle.TraePrenda || false,
                        prendaDescripcion: primerDetalle.PrendaDescripcion || "",
                        disenos: (primerDetalle.tecnicas || []).map(t => ({
                            tecnicaNombre: t.tecnica?.Nombre || "N/A",
                            parteNombre: t.parte?.Nombre || "N/A"
                        })),
                        detalles: c.detalles || []
                    };
                });

            // Cargar ventas del usuario
            const responseVentas = await axios.get("http://localhost:3000/api/ventas");
            const dataVentas = Array.isArray(responseVentas.data) 
                ? responseVentas.data 
                : (responseVentas.data?.datos || []);

            const misVentas = dataVentas
                .filter(v => {
                    const docID = v.usuario?.DocumentoID || v.DocumentoID;
                    return docID === usuarioData.DocumentoID;
                })
                .map(v => {
                    const primerDetalle = v.detalles?.[0] || {};
                    const producto = primerDetalle.producto || {};

                    return {
                        id: v.VentaID,
                        tipo: 'venta',
                        numeroReferencia: `VTA-${v.VentaID}`,
                        fecha: v.FechaVenta,
                        estado: v.estado?.Nombre || "Pendiente",
                        valorTotal: v.Total || 0,
                        producto: {
                            nombre: producto.Nombre || "Sin producto",
                            imagen: producto.ImagenProducto || "/placeholder-product.png"
                        },
                        cantidad: (v.detalles || []).reduce((acc, d) => acc + (d.Cantidad || 0), 0),
                        traePrenda: false,
                        disenos: [],
                        detalles: v.detalles || []
                    };
                });

            setCotizaciones(misCotizaciones);
            setVentas(misVentas);
        } catch (error) {
            console.error("Error al cargar datos:", error);
            Swal.fire("Error", "No se pudieron cargar tus solicitudes", "error");
        } finally {
            setCargando(false);
        }
    };

    const handleVerDetalle = (item, tipo) => {
        setItemSeleccionado(item);
        setTipoSeleccionado(tipo);
        setShowModal(true);
    };

    // ✅ ACTUALIZAR FUNCIÓN PARA INCLUIR ESTADO "PROCESADA"
    const obtenerBadgeEstado = (estado) => {
        switch (estado) {
            case "Pendiente":
                return <Badge bg="warning" className="px-3 py-2">
                    <FaClock className="me-1" /> Pendiente
                </Badge>;
            case "Aprobada":
                return <Badge bg="success" className="px-3 py-2">
                    <FaCheckCircle className="me-1" /> Aprobada
                </Badge>;
            case "Procesada":
                return <Badge bg="info" className="px-3 py-2">
                    <FaExchangeAlt className="me-1" /> Procesada
                </Badge>;
            case "Completada":
            case "Entregada":
                return <Badge bg="success" className="px-3 py-2">
                    <FaCheckCircle className="me-1" /> {estado}
                </Badge>;
            case "Rechazada":
            case "Cancelada":
                return <Badge bg="danger" className="px-3 py-2">
                    <FaTimesCircle className="me-1" /> {estado}
                </Badge>;
            default:
                return <Badge bg="secondary" className="px-3 py-2">{estado}</Badge>;
        }
    };

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const obtenerSolicitudesFiltradas = () => {
        let todasSolicitudes = [];

        if (tabActiva === "todas") {
            todasSolicitudes = [...cotizaciones, ...ventas];
        } else if (tabActiva === "cotizaciones") {
            todasSolicitudes = cotizaciones;
        } else if (tabActiva === "ventas") {
            todasSolicitudes = ventas;
        }

        return todasSolicitudes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    };

    const solicitudesFiltradas = obtenerSolicitudesFiltradas();

    return (
        <>
            <NavbarComponent />

            <div className="container my-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h3 className="fw-bold mb-0">Mis Cotizaciones</h3>
                        {usuario && (
                            <p className="text-muted mb-0">
                                Bienvenido, {usuario.Nombre}
                            </p>
                        )}
                    </div>
                </div>

                <Tabs
                    activeKey={tabActiva}
                    onSelect={(k) => setTabActiva(k)}
                    className="mb-4"
                >
                    <Tab eventKey="todas" title={`Todas (${cotizaciones.length + ventas.length})`} />
                    <Tab eventKey="cotizaciones" title={
                        <span>
                            <FaFileAlt className="me-2" />
                            Cotizaciones con Diseño ({cotizaciones.length})
                        </span>
                    } />
                    <Tab eventKey="ventas" title={
                        <span>
                            <FaShoppingCart className="me-2" />
                            Cotizaciones sin diseño ({ventas.length})
                        </span>
                    } />
                </Tabs>

                {cargando ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-3 text-muted">Cargando solicitudes...</p>
                    </div>
                ) : solicitudesFiltradas.length === 0 ? (
                    <Alert variant="info" className="text-center py-5">
                        <h5>No tienes solicitudes registradas</h5>
                        <p className="mb-3">Explora nuestros productos y solicita tu primera cotización</p>
                        <Button variant="primary" href="/productosLanding">
                            Ver Productos
                        </Button>
                    </Alert>
                ) : (
                    <div className="table-responsive shadow-sm">
                        <Table hover className="mb-0 align-middle">
                            <thead style={{ backgroundColor: '#f8f9fa' }}>
                                <tr>
                                    <th>Referencia</th>
                                    <th>Tipo</th>
                                    <th>Producto</th>
                                    <th>Fecha</th>
                                    <th>Cantidad</th>
                                    <th className="text-center">Estado</th>
                                    <th className="text-end">Valor Total</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {solicitudesFiltradas.map((item) => (
                                    <tr key={`${item.tipo}-${item.id}`}>
                                        <td className="fw-medium">{item.numeroReferencia}</td>
                                        <td>
                                            {item.tipo === 'cotizacion' ? (
                                                <Badge bg="info" className="px-2 py-1">
                                                    <FaFileAlt className="me-1" /> Cotización
                                                </Badge>
                                            ) : (
                                                <Badge bg="primary" className="px-2 py-1">
                                                    <FaShoppingCart className="me-1" /> Venta
                                                </Badge>
                                            )}
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <img
                                                    src={item.producto.imagen}
                                                    alt={item.producto.nombre}
                                                    style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        objectFit: 'cover',
                                                        borderRadius: '6px'
                                                    }}
                                                />
                                                <span className="fw-medium">{item.producto.nombre}</span>
                                            </div>
                                        </td>
                                        <td>{formatearFecha(item.fecha)}</td>
                                        <td>
                                            <Badge bg="secondary">{item.cantidad} unidades</Badge>
                                        </td>
                                        <td className="text-center">
                                            {obtenerBadgeEstado(item.estado)}
                                        </td>
                                        <td className="text-end fw-bold">
                                            {item.valorTotal ? (
                                                <span className="text-success">
                                                    ${item.valorTotal.toLocaleString()}
                                                </span>
                                            ) : (
                                                <span className="text-muted">Por calcular</span>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => handleVerDetalle(item, item.tipo)}
                                            >
                                                <FaEye className="me-1" /> Ver Detalle
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}
            </div>

            {/* ✅ MODAL DETALLE ACTUALIZADO */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Detalle de {tipoSeleccionado === 'cotizacion' ? 'Cotización' : 'Pedido'} - {itemSeleccionado?.numeroReferencia}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {itemSeleccionado && (
                        <>
                            <Row className="mb-4">
                                <Col md={6}>
                                    <div className="d-flex align-items-center gap-2">
                                        <strong>Estado:</strong>
                                        {obtenerBadgeEstado(itemSeleccionado.estado)}
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <strong>Fecha:</strong> {formatearFecha(itemSeleccionado.fecha)}
                                </Col>
                            </Row>

                            {/* ✅ MOSTRAR MENSAJE ESPECIAL SI ESTÁ PROCESADA */}
                            {itemSeleccionado.estado === "Procesada" && (
                                <Alert variant="info" className="mb-3">
                                    <Alert.Heading>
                                        <FaExchangeAlt className="me-2" />
                                        Cotización Procesada
                                    </Alert.Heading>
                                    <p className="mb-0">
                                        Esta cotización ha sido aprobada y convertida en un pedido. 
                                        El administrador está procesando tu solicitud.
                                    </p>
                                </Alert>
                            )}

                            <div className="card mb-3">
                                <div className="card-body">
                                    <h6 className="card-title fw-bold">Producto</h6>
                                    <div className="d-flex align-items-center gap-3">
                                        <img
                                            src={itemSeleccionado.producto.imagen}
                                            alt={itemSeleccionado.producto.nombre}
                                            style={{
                                                width: '100px',
                                                height: '100px',
                                                objectFit: 'cover',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <div>
                                            <h5 className="mb-2">{itemSeleccionado.producto.nombre}</h5>
                                            <p className="mb-1">
                                                <strong>Cantidad:</strong> {itemSeleccionado.cantidad} unidades
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {tipoSeleccionado === 'cotizacion' && itemSeleccionado.disenos && itemSeleccionado.disenos.length > 0 && (
                                <div className="card mb-3">
                                    <div className="card-body">
                                        <h6 className="card-title fw-bold">Diseños Solicitados</h6>
                                        <Table size="sm" bordered>
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Técnica</th>
                                                    <th>Parte</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {itemSeleccionado.disenos.map((d, i) => (
                                                    <tr key={i}>
                                                        <td>{d.tecnicaNombre}</td>
                                                        <td>{d.parteNombre}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            {tipoSeleccionado === 'venta' && itemSeleccionado.detalles && itemSeleccionado.detalles.length > 0 && (
                                <div className="card mb-3">
                                    <div className="card-body">
                                        <h6 className="card-title fw-bold">Detalles del Pedido</h6>
                                        <Table size="sm" bordered>
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Producto</th>
                                                    <th>Color</th>
                                                    <th>Talla</th>
                                                    <th>Cantidad</th>
                                                    <th>Precio Unit.</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {itemSeleccionado.detalles.map((det, i) => (
                                                    <tr key={i}>
                                                        <td>{det.producto?.Nombre || 'N/A'}</td>
                                                        <td>{det.color?.Nombre || '-'}</td>
                                                        <td>{det.talla?.Nombre || '-'}</td>
                                                        <td>{det.Cantidad}</td>
                                                        <td>${(det.PrecioUnitario || 0).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            <div className="card bg-light">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0 fw-bold">Valor Total:</h5>
                                        <h4 className="mb-0">
                                            {itemSeleccionado.valorTotal ? (
                                                <span className="text-success">
                                                    ${itemSeleccionado.valorTotal.toLocaleString()}
                                                </span>
                                            ) : (
                                                <span className="text-warning">Pendiente de cálculo</span>
                                            )}
                                        </h4>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>

            <FooterComponent />
        </>
    );
};

export default MisCotizaciones;