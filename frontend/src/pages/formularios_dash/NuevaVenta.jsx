import React, { useState, useEffect } from "react";
import {
    Container, Card, Row, Col, Form, Button, Modal,
    InputGroup, Table, Badge
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import axios from "axios";
import { crearVenta, updateVenta, getVentaById } from "../../Services/api-ventas/ventas";
import Swal from 'sweetalert2';


export default function NuevaVenta({ onClose, ventaEdit }) {
    const navigate = useNavigate();
    const modoEdicion = !!ventaEdit;

    // UI states
    const [showModalProducto, setShowModalProducto] = useState(false);
    const [busquedaProducto, setBusquedaProducto] = useState("");

    // Datos maestros
    const [usuarios, setUsuarios] = useState([]);
    const [productos, setProductos] = useState([]);

    // Producto seleccionado y sus variantes
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [variantes, setVariantes] = useState([]);

    // Selects dependientes
    const [colorSeleccionado, setColorSeleccionado] = useState("");
    const [tallaSeleccionada, setTallaSeleccionada] = useState("");
    const [cantidadSeleccionada, setCantidadSeleccionada] = useState(1);

    // Carrito / venta
    const [productosAgregados, setProductosAgregados] = useState([]);
    const [subtotal, setSubtotal] = useState(0);
    const [total, setTotal] = useState(0);
    const [clienteSeleccionado, setClienteSeleccionado] = useState("");

    // Carga inicial
    useEffect(() => {
        const token = localStorage.getItem("token");

        const fetchUsuarios = async () => {
            try {
                const res = await axios.get("http://localhost:3000/api/usuarios", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsuarios(res.data);
            } catch (err) {
                console.error(err);
            }
        };

        const fetchProductos = async () => {
            try {
                const res = await axios.get("http://localhost:3000/api/productos", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProductos(res.data.datos || []);
            } catch (err) {
                console.error(err);
            }
        };

        fetchUsuarios();
        fetchProductos();

        // Si estamos editando, cargar datos de la venta
        if (ventaEdit) {
            cargarDatosVenta();
        }
    }, [ventaEdit]);

    // Cargar datos de la venta para editar
    const cargarDatosVenta = async () => {
        try {
            const ventaData = await getVentaById(ventaEdit.VentaID);

            setClienteSeleccionado(ventaData.DocumentoID);
            setSubtotal(parseFloat(ventaData.Subtotal));
            setTotal(parseFloat(ventaData.Total));

            // Cargar productos agregados desde los detalles
            if (ventaData.detalles && ventaData.detalles.length > 0) {
                const productosEditados = ventaData.detalles.map(det => ({
                    ProductoID: det.ProductoID,
                    Nombre: det.producto?.Nombre || 'Producto',
                    Cantidad: det.Cantidad,
                    PrecioUnitario: parseFloat(det.PrecioUnitario),
                    ColorID: det.ColorID,
                    ColorNombre: det.color?.Nombre || '-',
                    TallaID: det.TallaID,
                    TallaNombre: det.talla?.Nombre || '-',
                    TelaID: null,
                    TelaNombre: "Sin tela",
                    InventarioID: null,
                    StockDisponible: 999 // En edición no validamos stock
                }));
                setProductosAgregados(productosEditados);
            }
        } catch (error) {
            console.error("Error al cargar venta:", error);
            alert("Error al cargar datos de la venta");
        }
    };

    // Filtrados para el modal
    const productosFiltrados = productos.filter(p =>
        p.Nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
    );

    // Recalcula totales
    useEffect(() => {
        const sub = productosAgregados.reduce((acc, item) =>
            acc + (item.Cantidad * item.PrecioUnitario), 0
        );
        setSubtotal(sub);
        setTotal(sub);
    }, [productosAgregados]);

    // Cargar variantes de un producto
    const onSeleccionarProductoModal = async (producto) => {
        setProductoSeleccionado(producto);
        setColorSeleccionado("");
        setTallaSeleccionada("");
        setCantidadSeleccionada(1);

        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(
                `http://localhost:3000/api/inventarioproducto/producto/${producto.ProductoID}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const variantesResp = res.data.datos || res.data || [];

            if (!Array.isArray(variantesResp)) {
                console.warn("⚠ Backend no devolvió array:", variantesResp);
                setVariantes([]);
                return;
            }

            setVariantes(variantesResp);

        } catch (error) {
            console.error("Error cargando variantes:", error);
            alert("Error al cargar variantes del producto");
            setVariantes([]);
        }
    };

    // Colores únicos disponibles
    const coloresDisponibles = variantes
        .map(v => v.color)
        .filter((c, index, self) =>
            index === self.findIndex(x => x.ColorID === c.ColorID)
        );

    // Tallas disponibles según color
    const tallasDisponibles = variantes
        .filter(v => v.ColorID === parseInt(colorSeleccionado))
        .map(v => v.talla)
        .filter((t, i, self) =>
            i === self.findIndex(x => x.TallaID === t.TallaID)
        );

    /**
 * Calcula el stock disponible real de una variante, restando lo ya agregado en el carrito.
 * @param {Object} variante - objeto variante (de la lista variantes)
 * @param {number|null} excludeIndex - índice en productosAgregados a excluir de la resta (útil al editar cantidad)
 * @returns {number} stock disponible
 */
    const calcularStockDisponible = (variante, excludeIndex = null) => {
        if (!variante) return 0;
        const usadoEnCarrito = productosAgregados
            .map((p, idx) => ({ ...p, idx }))
            .filter(p =>
                p.ProductoID === productoSeleccionado?.ProductoID &&
                p.ColorID === variante.ColorID &&
                p.TallaID === variante.TallaID &&
                (excludeIndex === null || p.idx !== excludeIndex) // posible exclusión
            )
            .reduce((acc, p) => acc + (p.Cantidad || 0), 0);

        const baseStock = typeof variante.Stock === 'number' ? variante.Stock : 0;
        return Math.max(0, baseStock - usadoEnCarrito);
    };


    const obtenerVarianteActual = () => {
        return variantes.find(v =>
            v.ColorID === parseInt(colorSeleccionado) &&
            v.TallaID === parseInt(tallaSeleccionada)
        );
    };


    const calcularStockDisponiblePor = (productoID, colorID, tallaID, excludeIndex = null) => {
        const variante = variantes.find(v =>
            v.ProductoID === productoID &&
            v.ColorID === parseInt(colorID) &&
            v.TallaID === parseInt(tallaID)
        );
        if (!variante) return 0;
        const usadoEnCarrito = productosAgregados
            .map((p, idx) => ({ ...p, idx }))
            .filter(p =>
                p.ProductoID === productoID &&
                p.ColorID === variante.ColorID &&
                p.TallaID === variante.TallaID &&
                (excludeIndex === null || p.idx !== excludeIndex)
            )
            .reduce((acc, p) => acc + (p.Cantidad || 0), 0);

        return Math.max(0, variante.Stock - usadoEnCarrito);
    };


    // Agregar producto
    const agregarProducto = () => {
        if (!productoSeleccionado) return alert('Seleccione un producto');
        if (!colorSeleccionado) return alert('Seleccione color');
        if (!tallaSeleccionada) return alert('Seleccione talla');

        const variante = obtenerVarianteActual();
        if (!variante) return alert('Variante no encontrada');

        const cantidad = parseInt(cantidadSeleccionada) || 1;
        if (cantidad <= 0) return alert('Cantidad inválida');

        // Usamos el stock real teniendo en cuenta lo ya agregado
        const stockDisponible = calcularStockDisponible(variante);

        if (!modoEdicion && cantidad > stockDisponible) {
            return alert(`Stock insuficiente. Solo quedan ${stockDisponible} unidades`);
        }

        const precioBase = parseFloat(productoSeleccionado.PrecioBase) || 0;
        const precioTalla = parseFloat(variante.talla?.Precio) || 0;
        const precioTela = parseFloat(variante.tela?.PrecioTela) || 0;
        const precioUnitario = precioBase + precioTalla + precioTela;

        // Verificar si ya existe en carrito (misma variante)
        const existenteIndex = productosAgregados.findIndex(p =>
            p.ProductoID === productoSeleccionado.ProductoID &&
            p.ColorID === variante.ColorID &&
            p.TallaID === variante.TallaID
        );

        if (existenteIndex >= 0) {
            const nuevos = [...productosAgregados];
            const nuevoTotal = nuevos[existenteIndex].Cantidad + cantidad;

            // Al verificar el límite, debemos considerar que 'calcularStockDisponible' ya resta lo existente,
            // así que comparamos con variante.Stock (restado del carrito sin incluir este item)
            const stockDisponibleParaAgregar = calcularStockDisponible(variante, existenteIndex);
            if (!modoEdicion && cantidad > stockDisponibleParaAgregar) {
                return alert(`No puedes añadir ${cantidad} unidades. Stock máximo disponible: ${stockDisponibleParaAgregar}`);
            }

            nuevos[existenteIndex].Cantidad = nuevoTotal;
            setProductosAgregados(nuevos);
        } else {
            setProductosAgregados(prev => ([
                ...prev,
                {
                    ProductoID: productoSeleccionado.ProductoID,
                    Nombre: productoSeleccionado.Nombre,
                    Cantidad: cantidad,
                    PrecioUnitario: precioUnitario,
                    ColorID: variante.ColorID,
                    ColorNombre: variante.color?.Nombre,
                    TallaID: variante.TallaID,
                    TallaNombre: variante.talla?.Nombre,
                    TelaID: variante.TelaID,
                    TelaNombre: variante.tela?.Nombre || "Sin tela",
                    InventarioID: variante.InventarioID,
                    StockDisponible: variante.Stock
                }
            ]));
        }

        // --- Actualizar variantes localmente para reflejar el nuevo stock en UI ---
        setVariantes(prev =>
            prev.map(v =>
                (v.ColorID === variante.ColorID && v.TallaID === variante.TallaID)
                    ? { ...v, Stock: Math.max(0, (v.Stock || 0) - cantidad) }
                    : v
            )
        );

        // Reset UI
        setProductoSeleccionado(null);
        setVariantes([]);
        setColorSeleccionado("");
        setTallaSeleccionada("");
        setCantidadSeleccionada(1);
        setShowModalProducto(false);
    };


    // Eliminar producto
    const eliminarProducto = (index) => {
        const nuevos = [...productosAgregados];
        nuevos.splice(index, 1);
        setProductosAgregados(nuevos);
    };

    // Cambiar cantidad
    const cambiarCantidad = (index, valor) => {
        const nuevos = [...productosAgregados];
        const cantidad = parseInt(valor);

        if (isNaN(cantidad) || cantidad <= 0) return;

        const item = nuevos[index];

        // buscamos la variante correspondiente en 'variantes' para calcular stock real
        const variante = variantes.find(v =>
            v.ProductoID === item.ProductoID &&
            v.ColorID === item.ColorID &&
            v.TallaID === item.TallaID
        );

        // si no existe la variante localmente (p.ej. venimos de editar), usamos la propiedad StockDisponible guardada
        let stockTotal = variante ? variante.Stock : (item.StockDisponible ?? 0);

        // calcular stock disponible exclusión del propio item
        const usadoExcluyendoActual = productosAgregados
            .map((p, idx) => ({ ...p, idx }))
            .filter(p =>
                p.ProductoID === item.ProductoID &&
                p.ColorID === item.ColorID &&
                p.TallaID === item.TallaID &&
                p.idx !== index
            )
            .reduce((acc, p) => acc + (p.Cantidad || 0), 0);

        const stockDisponible = Math.max(0, stockTotal - usadoExcluyendoActual);

        if (!modoEdicion && cantidad > stockDisponible) {
            alert(`Stock insuficiente. Solo quedan ${stockDisponible} unidades.`);
            return;
        }

        item.Cantidad = cantidad;
        setProductosAgregados(nuevos);
    };


    // Generar o actualizar venta
    // const handleGenerarVenta  = async () => {
    //     if (!clienteSeleccionado) return alert('Seleccione un cliente');
    //     if (productosAgregados.length === 0) return alert('Agregue al menos un producto');

    //     const detalles = productosAgregados.map(p => ({
    //         ProductoID: p.ProductoID,
    //         Cantidad: p.Cantidad,
    //         PrecioUnitario: parseFloat(p.PrecioUnitario),
    //         ColorID: p.ColorID,
    //         TallaID: p.TallaID,
    //         TelaID: p.TelaID ?? null,
    //         InventarioID: p.InventarioID
    //     }));

    //     const venta = {
    //         DocumentoID: clienteSeleccionado,
    //         Subtotal: parseFloat(subtotal.toFixed(2)),
    //         Total: parseFloat(total.toFixed(2)),
    //         EstadoID: modoEdicion ? ventaEdit.EstadoID : 8, // 8 = Pendiente
    //         detalles
    //     };

    //     try {
    //         const token = localStorage.getItem('token');

    //         if (modoEdicion) {
    //             // Actualizar venta existente
    //             await axios.put(
    //                 `http://localhost:3000/api/ventas/${ventaEdit.VentaID}`,
    //                 venta,
    //                 { headers: { Authorization: `Bearer ${token}` } }
    //             );
    //             alert('Venta actualizada con éxito!');
    //         } else {
    //             // Crear nueva venta
    //             await axios.post('http://localhost:3000/api/ventas', venta, {
    //                 headers: { Authorization: `Bearer ${token}` }
    //             });
    //             alert('Venta registrada con éxito!');
    //         }

    //         // Cerrar formulario y volver a la tabla
    //         if (onClose) {
    //             onClose();
    //         } else {
    //             navigate('/dashboard/ventas');
    //         }
    //     } catch (err) {
    //         console.error('Error completo:', err.response?.data || err);
    //         alert(`Error: ${err.response?.data?.error || 'Error al procesar la venta'}`);
    //     }
    // };

    const generarVenta = async () => {
        if (!clienteSeleccionado) {
            await Swal.fire({
                icon: 'warning',
                title: 'Cliente requerido',
                text: 'Por favor selecciona un cliente'
            });
            return;
        }

        if (productosAgregados.length === 0) {
            await Swal.fire({
                icon: 'warning',
                title: 'Sin productos',
                text: 'Debes agregar al menos un producto a la venta'
            });
            return;
        }

        const detalles = productosAgregados.map(p => ({
            ProductoID: p.ProductoID,
            Cantidad: p.Cantidad,
            PrecioUnitario: parseFloat(p.PrecioUnitario),
            ColorID: p.ColorID,
            TallaID: p.TallaID,
            TelaID: p.TelaID ?? null,
            InventarioID: p.InventarioID
        }));

        const venta = {
            DocumentoID: clienteSeleccionado,
            Subtotal: parseFloat(subtotal.toFixed(2)),
            Total: parseFloat(total.toFixed(2)),
            EstadoID: modoEdicion ? ventaEdit.EstadoID : 8, // 8 = Pendiente
            detalles
        };

        try {
            const token = localStorage.getItem('token');

            if (modoEdicion) {
                // Actualizar venta existente
                const response = await axios.put(
                    `http://localhost:3000/api/ventas/${ventaEdit.VentaID}`,
                    venta,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                await Swal.fire({
                    icon: 'success',
                    title: '¡Venta actualizada!',
                    html: `
                    <p>La venta <strong>#${ventaEdit.VentaID}</strong> se ha actualizado correctamente</p>
                    <p class="mt-2"><strong>Total:</strong> $${total.toLocaleString()}</p>
                `,
                    confirmButtonColor: '#28a745',
                    confirmButtonText: 'Entendido'
                });
            } else {
                // Crear nueva venta
                const response = await axios.post(
                    'http://localhost:3000/api/ventas',
                    venta,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const ventaCreada = response.data?.venta || response.data;

                await Swal.fire({
                    icon: 'success',
                    title: '¡Venta registrada exitosamente!'
                });
            }

            // Cerrar formulario y volver a la tabla
            if (onClose) {
                onClose();
            } else {
                navigate('/dashboard/ventas');
            }
        } catch (err) {
            console.error('Error completo:', err.response?.data || err);

            // ALERTAS DE ERROR ESPECÍFICAS
            if (err.response?.data?.error?.includes('Stock insuficiente') ||
                err.response?.data?.error?.includes('stock')) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Stock insuficiente',
                    text: err.response.data.error,
                    confirmButtonColor: '#d33'
                });
            } else if (err.response?.status === 404) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error de datos',
                    text: 'Uno o más productos no fueron encontrados',
                    confirmButtonColor: '#d33'
                });
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error al procesar la venta',
                    text: err.response?.data?.error || err.message || 'Ocurrió un error inesperado',
                    confirmButtonColor: '#d33'
                });
            }
        }
    };

    return (
        <Container className="py-4">
            <h3 className="text-center mb-4 text-primary fw-bold">
                {modoEdicion ? 'EDITAR VENTA' : 'FORMULARIO DE VENTA'}
            </h3>

            <Card className="p-4 mb-4" style={{ background: "#f5f5fa" }}>
                <Row className="mb-4 align-items-end">
                    <Col md={5}>
                        <Form.Group>
                            <Form.Label className="fw-bold">Cliente *</Form.Label>
                            <Form.Select
                                value={clienteSeleccionado}
                                onChange={e => setClienteSeleccionado(e.target.value)}
                                disabled={modoEdicion}
                            >
                                <option value="">Seleccione un cliente...</option>
                                {usuarios.map(u => (
                                    <option key={u.DocumentoID} value={u.DocumentoID}>
                                        {u.Nombre} - {u.DocumentoID}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>

                    <Col md={2}>
                        <Form.Group>
                            <Form.Label className="fw-bold">Subtotal</Form.Label>
                            <Form.Control
                                readOnly
                                value={`$${subtotal.toLocaleString()}`}
                                style={{ background: "#e9ecef", fontWeight: "600" }}
                            />
                        </Form.Group>
                    </Col>

                    <Col md={2}>
                        <Form.Group>
                            <Form.Label className="fw-bold">Total</Form.Label>
                            <Form.Control
                                readOnly
                                value={`$${total.toLocaleString()}`}
                                style={{ background: "#d1e7dd", fontWeight: "700" }}
                            />
                        </Form.Group>
                    </Col>

                    <Col md={3} className="d-flex justify-content-end gap-2">
                        <Button variant="success" className="px-3" onClick={generarVenta}>
                            {modoEdicion ? 'Actualizar Venta' : 'Generar Venta'}
                        </Button>
                        <Button
                            variant="danger"
                            onClick={onClose || (() => navigate('/dashboard/ventas'))}
                        >
                            Cancelar
                        </Button>
                    </Col>
                </Row>

                <hr className="my-4" />

                <Row className="mb-3">
                    <Col className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Agregar Productos</h5>
                        <Button
                            variant="primary"
                            onClick={() => setShowModalProducto(true)}
                        >
                            + Elegir Producto
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* TABLA */}
            <Card className="p-3 mb-4">
                <h5 className="mb-3">Productos Agregados</h5>
                <Table striped bordered hover responsive>
                    <thead className="table-primary text-center">
                        <tr>
                            <th>#</th>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Color</th>
                            <th>Talla</th>
                            <th>Subtotal</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productosAgregados.map((p, i) => (
                            <tr key={i}>
                                <td className="text-center">{i + 1}</td>
                                <td>{p.Nombre}</td>
                                <td className="text-center">
                                    <Form.Control
                                        type="number"
                                        min={1}
                                        value={p.Cantidad}
                                        onChange={e => cambiarCantidad(i, e.target.value)}
                                        style={{ width: 70, margin: "0 auto" }}
                                    />
                                </td>
                                <td className="text-end">
                                    ${parseFloat(p.PrecioUnitario).toLocaleString()}
                                </td>
                                <td className="text-center">{p.ColorNombre}</td>
                                <td className="text-center">{p.TallaNombre}</td>
                                <td className="text-end fw-bold">
                                    ${(p.Cantidad * parseFloat(p.PrecioUnitario)).toLocaleString()}
                                </td>
                                <td className="text-center">
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => eliminarProducto(i)}
                                    >
                                        <X size={16} />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {productosAgregados.length === 0 && (
                            <tr>
                                <td colSpan={8} className="text-center text-muted">
                                    <em>No hay productos agregados</em>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>

                <div className="d-flex justify-content-end mt-3">
                    <div className="text-end">
                        <h6 className="mb-1">
                            Subtotal: <span className="text-primary">${subtotal.toLocaleString()}</span>
                        </h6>
                        <h5 className="mb-0">
                            Total: <Badge bg="success" className="fs-6">${total.toLocaleString()}</Badge>
                        </h5>
                    </div>
                </div>
            </Card>

            {/* MODAL (igual que antes) */}
            <Modal
                show={showModalProducto}
                onHide={() => setShowModalProducto(false)}
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Seleccionar Producto</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <InputGroup className="mb-4">
                        <InputGroup.Text><Search size={18} /></InputGroup.Text>
                        <Form.Control
                            placeholder="Buscar producto por nombre..."
                            value={busquedaProducto}
                            onChange={e => setBusquedaProducto(e.target.value)}
                        />
                    </InputGroup>

                    <Row>
                        {productosFiltrados.map(producto => (
                            <Col md={4} className="mb-3" key={producto.ProductoID}>
                                <Card
                                    className="h-100 shadow-sm"
                                    style={{ cursor: "pointer", transition: "transform 0.2s" }}
                                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
                                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                                    onClick={() => onSeleccionarProductoModal(producto)}
                                >
                                    <div style={{
                                        height: 180,
                                        background: "#f0f0f0",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}>
                                        {producto.ImagenProducto ? (
                                            <img
                                                src={producto.ImagenProducto}
                                                alt={producto.Nombre}
                                                style={{ maxHeight: "100%", maxWidth: "100%" }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: 14, color: "#999" }}>
                                                Imagen del producto
                                            </span>
                                        )}
                                    </div>
                                    <Card.Body>
                                        <Card.Title style={{ fontSize: 16 }}>
                                            {producto.Nombre}
                                        </Card.Title>
                                        <Card.Text>
                                            <strong>Precio base:</strong> ${parseFloat(producto.PrecioBase || 0).toLocaleString()}
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {productoSeleccionado && (
                        <div className="mt-3 p-3 border rounded">
                            <h6>Configuración: {productoSeleccionado.Nombre}</h6>
                            <Row>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Color</Form.Label>
                                        <Form.Select
                                            value={colorSeleccionado}
                                            onChange={e => {
                                                setColorSeleccionado(e.target.value);
                                                setTallaSeleccionada("");
                                                setCantidadSeleccionada(1);
                                            }}
                                        >
                                            <option value="">Seleccione color</option>
                                            {coloresDisponibles.map(c => (
                                                <option key={c.ColorID} value={c.ColorID}>
                                                    {c.Nombre}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>

                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Talla</Form.Label>
                                        <Form.Select
                                            value={tallaSeleccionada}
                                            onChange={e => setTallaSeleccionada(e.target.value)}
                                        >
                                            <option value="">Seleccione talla</option>
                                            {tallasDisponibles.map(t => (
                                                <option key={t.TallaID} value={t.TallaID}>
                                                    {t.Nombre}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>

                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Cantidad</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min={1}
                                            value={cantidadSeleccionada}
                                            onChange={e => setCantidadSeleccionada(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <div className="mt-3">
                                {colorSeleccionado && tallaSeleccionada ? (
                                    <div>
                                        <strong>Stock disponible:</strong> {calcularStockDisponible(obtenerVarianteActual())}
                                        <Button
                                            variant="primary"
                                            className="ms-3"
                                            onClick={agregarProducto}
                                            disabled={calcularStockDisponible(obtenerVarianteActual()) <= 0}
                                        >
                                            Agregar a la venta
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-muted">
                                        Seleccione color y talla para ver stock
                                    </div>
                                )}

                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowModalProducto(false)}
                    >
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}