// src/pages/formularios_dash/NuevaCotizacion.jsx
import React, { useEffect, useState } from "react";
import {
    Container,
    Card,

    Row,
    Col,
    Form,
    Button,
    Modal,
    InputGroup,
    Table,
    Alert,
} from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BASE = "http://localhost:3001";
const TALLAS = ["S", "M", "L", "XL", "XXL"];

export default function NuevaCotizacion() {
    const navigate = useNavigate();

    // Datos maestros
    const [usuarios, setUsuarios] = useState([]);
    const [telas, setTelas] = useState([]);
    const [colores, setColores] = useState([]);
    const [variantes, setVariantes] = useState([]);
    const [productos, setProductos] = useState([]); // para obtener tela si variante no tiene
    const [tecnicas, setTecnicas] = useState([]);

    // UI & búsqueda modal
    const [showModal, setShowModal] = useState(false);
    const [busqueda, setBusqueda] = useState("");

    // Estado master cotización
    const [selectedUser, setSelectedUser] = useState("");
    const [valorTotal, setValorTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);

    // Formulario de detalle actual (product-level)
    const [traePrenda, setTraePrenda] = useState(false);
    const [aplicarDiseno, setAplicarDiseno] = useState(false);
    const [selectedVariante, setSelectedVariante] = useState(null); // objeto variante seleccionado

    const [detalleForm, setDetalleForm] = useState({
        TipoPrenda: "Camiseta",
        TelaID: "",
        TelaNombre: "",
        Cantidad: 1,
        ColorID: "",
        ColorNombre: "",
        Talla: "S",
        VarianteID: null,
        PrecioUnitario: 0,
        PrendaDescripcion: "",
    });

    // Diseños temporales para el detalle actual
    const [disenoForm, setDisenoForm] = useState({
        TecnicaID: "",
        Parte: "Superior",
        Subparte: "",
        Observacion: "",
    });
    const [disenosActual, setDisenosActual] = useState([]); // array de diseños agregados al detalle actual

    // Productos añadidos a la cotización (temporales)
    const [productosAgregados, setProductosAgregados] = useState([]);

    // Carga inicial
    useEffect(() => {
        (async () => {
            try {
                const [uRes, tRes, cRes, vRes, pRes, tecRes] = await Promise.all([
                    axios.get(`${BASE}/usuarios`),
                    axios.get(`${BASE}/telas`),
                    axios.get(`${BASE}/colores`),
                    axios.get(`${BASE}/productosVariantes`),
                    axios.get(`${BASE}/productos`),
                    axios.get(`${BASE}/tecnicas`),
                ]);

                setUsuarios(uRes.data?.datos || []);
                setTelas(tRes.data?.datos || []);
                setColores(cRes.data?.datos || []);
                // algunas respuestas devuelven array directo (productosVariantes), otras {datos:[]}
                setVariantes(Array.isArray(vRes.data) ? vRes.data : vRes.data?.datos || []);
                setProductos(pRes.data?.datos || []);
                setTecnicas(tecRes.data?.datos || []);
            } catch (err) {
                console.error("Error cargando recursos:", err);
                setAlert({ type: "danger", message: "Error cargando datos desde el servidor." });
            }
        })();
    }, []);

    // Filtrado para modal
    const variantesFiltradas = variantes.filter((v) =>
        `${v.Producto} ${v.Color} ${v.Talla}`.toLowerCase().includes(busqueda.toLowerCase())
    );

    // Cuando selecciono variante en modal -> autocompleta campos
    const seleccionarVariante = (v) => {
        setSelectedVariante(v);

        // intentar encontrar Tela a partir del producto (si producto tiene info en /productos)
        const prodInfo = productos.find(p => p.Nombre?.toLowerCase() === (v.Producto || "").toLowerCase());

        // intentar encontrar ColorID por nombre
        const colorObj = colores.find(c => c.Nombre?.toLowerCase() === (v.Color || "").toLowerCase());

        setDetalleForm(prev => ({
            ...prev,
            TipoPrenda: v.Producto || prev.TipoPrenda,
            TelaID: prodInfo ? prodInfo.ProductoID ? "" : "" : prev.TelaID, // no hay TelaID en producto response, keep manual selection
            TelaNombre: prodInfo?.Tela || prev.TelaNombre,
            Cantidad: 1,
            ColorID: colorObj ? colorObj.ColorID : prev.ColorID,
            ColorNombre: colorObj ? colorObj.Nombre : v.Color || prev.ColorNombre,
            Talla: v.Talla || prev.Talla,
            VarianteID: v.VarianteID,
            PrecioUnitario: Number(v.Precio) || 0,
        }));

        // actualizar total temporal
        setValorTotal(prev => {
            const subtotal = (Number(v.Precio) || 0) * 1;
            // keep previous productosAgregados total + this provisional? we'll update when added
            return productosAgregados.reduce((s, p) => s + (p.Subtotal || 0), 0) + subtotal;
        });

        setShowModal(false);
        setAlert(null);
    };

    // Si el usuario marca "Trae prenda" -> limpiar selección de variante y campos relacionados
    const onToggleTraePrenda = (checked) => {
        setTraePrenda(checked);
        if (checked) {
            setSelectedVariante(null);
            setDetalleForm(prev => ({
                ...prev,
                VarianteID: null,
                PrecioUnitario: 0,
                ColorID: "",
                ColorNombre: "",
                TelaID: "",
                TelaNombre: "",
                Talla: "S",
            }));
        }
    };

    // Cambios en detalle form
    const onDetalleChange = (e) => {
        const { name, value } = e.target;

        // si cambia cantidad, recalcular subtotal visual (PrecioUnitario * Cantidad)
        if (name === "Cantidad") {
            const cantidad = Number(value) || 0;
            setDetalleForm(prev => ({ ...prev, [name]: cantidad }));
            // actualizar valorTotal provisional (no persistido) como suma de agregados + posible producto actual
            const currentSubtotal = (detalleForm.PrecioUnitario || 0) * cantidad;
            const agregadosSubtotal = productosAgregados.reduce((s, p) => s + (p.Subtotal || 0), 0);
            setValorTotal(agregadosSubtotal + currentSubtotal);
            return;
        }

        setDetalleForm(prev => ({ ...prev, [name]: value }));
    };

    // Diseño handlers
    const onDisenoChange = (e) => {
        const { name, value } = e.target;
        setDisenoForm(prev => ({ ...prev, [name]: value }));
    };

    const agregarDiseno = () => {
        if (!disenoForm.TecnicaID || !disenoForm.Parte) {
            setAlert({ type: "warning", message: "Selecciona técnica y parte antes de agregar diseño." });
            return;
        }
        const tecnicaObj = tecnicas.find(t => String(t.TecnicaID) === String(disenoForm.TecnicaID));
        const nuevo = {
            ...disenoForm,
            TecnicaNombre: tecnicaObj?.Nombre || disenoForm.TecnicaID,
        };
        setDisenosActual(prev => [...prev, nuevo]);
        setDisenoForm({ TecnicaID: "", Parte: "Superior", Subparte: "", Observacion: "" });
        setAlert(null);
    };

    const eliminarDiseno = (index) => {
        setDisenosActual(prev => prev.filter((_, i) => i !== index));
    };

    // Añadir producto a la tabla temporal
    const handleAgregarProducto = () => {
        // validaciones
        if (!selectedUser) {
            setAlert({ type: "warning", message: "Selecciona el usuario (cliente) antes de agregar productos." });
            return;
        }
        // Si no trae prenda -> puede venir de una variante o rellenado manualmente
        if (!traePrenda && !detalleForm.VarianteID && (!detalleForm.ColorID || !detalleForm.TelaNombre)) {
            setAlert({ type: "warning", message: "Si no trae prenda, selecciona una variante o completa tela y color." });
            return;
        }
        if (!detalleForm.Cantidad || Number(detalleForm.Cantidad) <= 0) {
            setAlert({ type: "warning", message: "Cantidad debe ser mayor que 0." });
            return;
        }

        const precioUnit = Number(detalleForm.PrecioUnitario || 0);
        const subtotal = precioUnit * Number(detalleForm.Cantidad);

        const productoTemporal = {
            tempId: Date.now(),
            TipoPrenda: detalleForm.TipoPrenda,
            TelaID: detalleForm.TelaID,
            TelaNombre: detalleForm.TelaNombre,
            Cantidad: Number(detalleForm.Cantidad),
            ColorID: detalleForm.ColorID,
            ColorNombre: detalleForm.ColorNombre,
            Talla: detalleForm.Talla,
            VarianteID: detalleForm.VarianteID,
            PrecioUnitario: precioUnit,
            Subtotal: subtotal,
            TraePrenda: traePrenda,
            PrendaDescripcion: detalleForm.PrendaDescripcion || null,
            Disenos: [...disenosActual],
        };

        setProductosAgregados(prev => [...prev, productoTemporal]);
        // recalcular total
        const nuevaTotal = productosAgregados.reduce((s, p) => s + p.Subtotal, 0) + subtotal;
        setValorTotal(nuevaTotal);

        // limpiar detalle form para próxima entrada
        setSelectedVariante(null);
        setDetalleForm({
            TipoPrenda: "Camiseta",
            TelaID: "",
            TelaNombre: "",
            Cantidad: 1,
            ColorID: "",
            ColorNombre: "",
            Talla: "S",
            VarianteID: null,
            PrecioUnitario: 0,
            PrendaDescripcion: "",
        });
        setDisenosActual([]);
        setAplicarDiseno(false);
        setAlert(null);
    };

    const eliminarProductoTemporal = (tempId) => {
        const removed = productosAgregados.find(p => p.tempId === tempId);
        setProductosAgregados(prev => prev.filter(p => p.tempId !== tempId));
        setValorTotal(prev => prev - (removed?.Subtotal || 0));
    };

    // Resumen de diseños (string)
    const resumenDisenos = (arr) => arr.map((d, i) => `${i + 1}) ${d.TecnicaNombre} ${d.Parte}${d.Subparte ? ` (${d.Subparte})` : ""}${d.Observacion ? `: ${d.Observacion}` : ""}`).join(" | ");

    // Generar cotizacion y detalles -> POST /cotizaciones then POST /detallecotizacion
    const handleGenerarCotizacion = async () => {
        if (!selectedUser) {
            setAlert({ type: "warning", message: "Selecciona el usuario antes de generar la cotización." });
            return;
        }
        if (productosAgregados.length === 0) {
            setAlert({ type: "warning", message: "Agrega al menos un producto antes de generar la cotización." });
            return;
        }

        setLoading(true);
        setAlert(null);

        try {
            // 1) Crear cotizacion master
            const cotPayload = {
                DocumentoID: selectedUser,
                FechaCotizacion: new Date().toISOString().slice(0, 10),
                ValorTotal: Number(valorTotal) || 0,
                Estado: "en_carrito",
            };

            const cotRes = await axios.post(`${BASE}/cotizaciones`, cotPayload);
            // la respuesta puede venir distinta; intento distintas rutas:
            const nuevaCot = cotRes.data?.datos || cotRes.data;
            const CotizacionID = nuevaCot?.CotizacionID || cotRes.data?.CotizacionID || (cotRes.data?.insertId) || null;

            if (!CotizacionID) {
                console.warn("Respuesta POST /cotizaciones:", cotRes.data);
                throw new Error("No se obtuvo CotizacionID desde la API.");
            }

            // 2) Crear detalles para cada producto agregado
            for (const p of productosAgregados) {
                const detallePayload = {
                    CotizacionID: Number(CotizacionID),
                    VarianteID: p.TraePrenda ? null : (p.VarianteID ? Number(p.VarianteID) : null),
                    Cantidad: Number(p.Cantidad),
                    TraePrenda: p.TraePrenda ? true : false,
                    PrendaDescripcion: p.TraePrenda
                        ? (p.PrendaDescripcion || (p.Disenos?.length ? "Diseños: " + resumenDisenos(p.Disenos) : null))
                        : (p.Disenos?.length ? "Diseños: " + resumenDisenos(p.Disenos) : null),
                };

                await axios.post(`${BASE}/detalleCotizacion`, detallePayload);
                // Si necesitas guardar cada diseño por separado en detalleDiseno, podemos hacerlo aquí con un POST adicional.
            }

            setAlert({ type: "success", message: "Cotización creada correctamente." });
            // limpiar todo
            setProductosAgregados([]);
            setValorTotal(0);
            setSelectedUser("");
            setDetalleForm({
                TipoPrenda: "Camiseta",
                TelaID: "",
                TelaNombre: "",
                Cantidad: 1,
                ColorID: "",
                ColorNombre: "",
                Talla: "S",
                VarianteID: null,
                PrecioUnitario: 0,
                PrendaDescripcion: "",
            });
            setDisenosActual([]);
            setSelectedVariante(null);
            // redirigir a listado
            setTimeout(() => navigate("/dashboard/cotizaciones"), 900);
        } catch (err) {
            console.error("Error generando cotización:", err);
            setAlert({ type: "danger", message: "Error al generar cotización. Revisa la consola." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-4">
            <h3 className="text-center mb-3">Formulario de cotización</h3>

            {alert && (
                <Alert variant={alert.type === "danger" ? "danger" : alert.type === "warning" ? "warning" : "success"}>
                    {alert.message}
                </Alert>
            )}

            <Card className="p-4 mb-4" style={{ background: "#f5f5fa" }}>
                {/* Usuario y acciones */}
                <Row className="mb-3 align-items-end">
                    <Col md={5}>
                        <Form.Group>
                            <Form.Label>Cliente (Usuario)</Form.Label>
                            <Form.Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                                <option value="">Seleccione usuario</option>
                                {usuarios.map(u => (
                                    <option key={u.DocumentoID} value={u.DocumentoID}>
                                        {u.Nombre} — {u.DocumentoID}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>

                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Valor total</Form.Label>
                            <Form.Control readOnly value={valorTotal?.toLocaleString?.() ?? 0} />
                        </Form.Group>
                    </Col>

                    <Col md={3} className="d-flex justify-content-end gap-2">
                        <Button variant="success" onClick={handleGenerarCotizacion} disabled={loading}>
                            {loading ? "Generando..." : "Generar cotización"}
                        </Button>
                        <Button variant="danger" onClick={() => navigate("/dashboard/cotizaciones")}>Cancelar</Button>
                    </Col>
                </Row>

                {/* trae prenda + boton elegir variante */}
                <Row className="mb-3">
                    <Col md={6} className="d-flex align-items-center gap-3">
                        <Form.Label className="mb-0 fw-bold">¿Traes la prenda?</Form.Label>
                        <Form.Check
                            type="switch"
                            checked={traePrenda}
                            onChange={(e) => onToggleTraePrenda(e.target.checked)}
                        />
                        <small className="text-muted">Si marca Sí, los campos de variante se limpiarán.</small>
                    </Col>

                    <Col md={6} className="text-end">
                        {/* botón elegir variante (solo si no trae prenda) */}
                        {!traePrenda && (
                            <Button variant="primary" onClick={() => setShowModal(true)}>
                                Elegir variante
                            </Button>
                        )}
                    </Col>
                </Row>

                {/* si trae prenda: descripcion */}
                {traePrenda && (
                    <Row className="mb-3">
                        <Col>
                            <Form.Group>
                                <Form.Label>Descripción de la prenda</Form.Label>
                                <Form.Control
                                    name="PrendaDescripcion"
                                    value={detalleForm.PrendaDescripcion}
                                    onChange={(e) => setDetalleForm(prev => ({ ...prev, PrendaDescripcion: e.target.value }))}
                                    placeholder="Ej: Camiseta propia, zona a estampar..."
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                )}

                {/* campos principales */}
                <Row className="g-3 mb-3">
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Tipo Prenda</Form.Label>
                            <Form.Control value={detalleForm.TipoPrenda} readOnly />
                        </Form.Group>
                    </Col>

                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Tipo Tela</Form.Label>
                            {/* si seleccionaste variante y esa variante no tiene TelaID, mostramos TelaNombre si existe */}
                            <Form.Select
                                name="TelaID"
                                value={detalleForm.TelaID}
                                onChange={(e) => {
                                    const id = e.target.value;
                                    const nombre = (telas.find(t => String(t.TelaID) === String(id)) || {}).Nombre || "";
                                    setDetalleForm(prev => ({ ...prev, TelaID: id, TelaNombre: nombre }));
                                }}
                                disabled={traePrenda === true}
                            >
                                <option value="">{detalleForm.TelaNombre ? `${detalleForm.TelaNombre} (autocompletado)` : "Seleccione tela"}</option>
                                {telas.map(t => <option key={t.TelaID} value={t.TelaID}>{t.Nombre}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </Col>

                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Cantidad</Form.Label>
                            <Form.Control
                                type="number"
                                min={1}
                                name="Cantidad"
                                value={detalleForm.Cantidad}
                                onChange={onDetalleChange}
                            />
                        </Form.Group>
                    </Col>

                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Color</Form.Label>
                            <Form.Select
                                name="ColorID"
                                value={detalleForm.ColorID}
                                onChange={(e) => {
                                    const id = e.target.value;
                                    const nombre = (colores.find(c => String(c.ColorID) === String(id)) || {}).Nombre || "";
                                    setDetalleForm(prev => ({ ...prev, ColorID: id, ColorNombre: nombre }));
                                }}
                                disabled={traePrenda === true}
                            >
                                <option value="">{detalleForm.ColorNombre ? `${detalleForm.ColorNombre} (autocompletado)` : "Seleccione color"}</option>
                                {colores.map(c => <option key={c.ColorID} value={c.ColorID}>{c.Nombre}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </Col>

                    <Col md={2}>
                        <Form.Group>
                            <Form.Label>Talla</Form.Label>
                            <Form.Select name="Talla" value={detalleForm.Talla} onChange={onDetalleChange} disabled={traePrenda === true}>
                                {TALLAS.map(t => <option key={t} value={t}>{t}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </Col>

                    <Col md={2}>
                        <Form.Group>
                            <Form.Label>Precio unitario</Form.Label>
                            <Form.Control
                                type="number"
                                name="PrecioUnitario"
                                value={detalleForm.PrecioUnitario}
                                onChange={(e) => setDetalleForm(prev => ({ ...prev, PrecioUnitario: Number(e.target.value) }))}
                                readOnly={!selectedVariante} // si viene variante, precio proviene de ella; si no, permitir editar? aquí lo dejamos editable cuando no hay variante
                                disabled={traePrenda === true}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                {/* Aplicar diseño */}
                <Form.Group className="mb-3">
                    <Form.Check
                        type="checkbox"
                        label="Aplicar diseño"
                        checked={aplicarDiseno}
                        onChange={(e) => setAplicarDiseno(e.target.checked)}
                        disabled={traePrenda === true && false /* still allow designs with traePrenda */}
                    />
                </Form.Group>

                {/* panel diseños */}
                {aplicarDiseno && (
                    <div className="p-3 rounded" style={{ background: "#efe8f6", border: "1px solid #e0d7f0" }}>
                        <h5 className="text-center mb-3">Diseños</h5>

                        <Row className="g-2 align-items-end">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Técnica</Form.Label>
                                    <Form.Select name="TecnicaID" value={disenoForm.TecnicaID} onChange={onDisenoChange}>
                                        <option value="">Seleccione técnica</option>
                                        {tecnicas.map(t => <option key={t.TecnicaID} value={t.TecnicaID}>{t.Nombre}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Parte</Form.Label>
                                    <Form.Select name="Parte" value={disenoForm.Parte} onChange={onDisenoChange}>
                                        <option value="Superior">Superior</option>
                                        <option value="Inferior">Inferior</option>
                                        <option value="Mangas">Mangas</option>
                                        <option value="Lateral">Lateral</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Subparte</Form.Label>
                                    <Form.Control name="Subparte" value={disenoForm.Subparte} onChange={onDisenoChange} />
                                </Form.Group>
                            </Col>

                            <Col md={2} className="d-grid">
                                <Button variant="success" onClick={agregarDiseno}>+ Agregar diseño</Button>
                            </Col>

                            <Col md={12} className="mt-3">
                                <Table size="sm" striped bordered>
                                    <thead className="table-light text-center">
                                        <tr>
                                            <th>Técnica</th>
                                            <th>Parte</th>
                                            <th>Subparte</th>
                                            <th>Observación</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {disenosActual.length === 0 ? (
                                            <tr><td colSpan={5} className="text-center text-muted">No hay diseños agregados</td></tr>
                                        ) : disenosActual.map((d, i) => (
                                            <tr key={i} className="text-center">
                                                <td>{d.TecnicaNombre}</td>
                                                <td>{d.Parte}</td>
                                                <td>{d.Subparte}</td>
                                                <td>{d.Observacion}</td>
                                                <td>
                                                    <Button size="sm" variant="danger" onClick={() => eliminarDiseno(i)}>Eliminar</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Col>
                        </Row>
                    </div>
                )}

                {/* botones agregar producto y limpiar */}
                <div className="d-flex gap-2 mt-3">
                    <Button variant="primary" onClick={handleAgregarProducto}>+ Agregar Producto</Button>
                    <Button variant="outline-secondary" onClick={() => {
                        setSelectedVariante(null);
                        setDetalleForm({
                            TipoPrenda: "Camiseta",
                            TelaID: "",
                            TelaNombre: "",
                            Cantidad: 1,
                            ColorID: "",
                            ColorNombre: "",
                            Talla: "S",
                            VarianteID: null,
                            PrecioUnitario: 0,
                            PrendaDescripcion: "",
                        });
                        setDisenosActual([]);
                        setAplicarDiseno(false);
                        setAlert(null);
                    }}>Limpiar</Button>
                </div>
            </Card>

            {/* tabla productos agregados */}
            <Card className="p-3 mb-4">
                <Table striped bordered hover responsive>
                    <thead className="table-light text-center">
                        <tr>
                            <th>Prenda</th>
                            <th>Tela</th>
                            <th>Cantidad</th>
                            <th>Color</th>
                            <th>Talla</th>
                            <th>Precio unit.</th>
                            <th>Subtotal</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productosAgregados.length === 0 ? (
                            <tr><td colSpan={8} className="text-center text-muted">No hay productos agregados</td></tr>
                        ) : productosAgregados.map(p => (
                            <tr key={p.tempId}>
                                <td>{p.TipoPrenda}</td>
                                <td>{p.TelaNombre}</td>
                                <td className="text-center">{p.Cantidad}</td>
                                <td>{p.ColorNombre}</td>
                                <td className="text-center">{p.Talla}</td>
                                <td className="text-end">${p.PrecioUnitario?.toLocaleString?.() ?? 0}</td>
                                <td className="text-end">${p.Subtotal?.toLocaleString?.() ?? 0}</td>
                                <td className="text-center">
                                    <div className="d-flex justify-content-center gap-2">
                                        <Button size="sm" variant="outline-primary" onClick={() => alert("Ver diseño - no implementado")}>Ver</Button>
                                        <Button size="sm" variant="outline-danger" onClick={() => eliminarProductoTemporal(p.tempId)}>Eliminar</Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>

                <div className="d-flex justify-content-end">
                    <h5>Total: ${valorTotal?.toLocaleString?.() ?? 0}</h5>
                </div>
            </Card>

            {/* MODAL: Elegir variante (cards) */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Elegir variante</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <InputGroup className="mb-3">
                        <Form.Control
                            placeholder="Buscar por producto, color o talla..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </InputGroup>

                    <Row>
                        {variantesFiltradas.length === 0 ? (
                            <Col><p className="text-center text-muted">No se encontraron variantes</p></Col>
                        ) : variantesFiltradas.map(v => (
                            <Col md={4} key={v.VarianteID} className="mb-3">
                                <Card className="h-100 shadow-sm" style={{ cursor: "pointer" }} onClick={() => seleccionarVariante(v)}>
                                    <div style={{ height: 160, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f8f8" }}>
                                        <img src={v.Imagen || ""} alt={v.Producto} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "cover" }} />
                                    </div>
                                    <Card.Body>
                                        <Card.Title style={{ fontSize: 16 }}>{v.Producto}</Card.Title>
                                        <Card.Text style={{ fontSize: 14 }}>
                                            <strong>Color:</strong> {v.Color} <br />
                                            <strong>Talla:</strong> {v.Talla} <br />
                                            <strong>Precio:</strong> ${v.Precio}
                                        </Card.Text>
                                        <div className="d-grid">
                                            <Button variant="primary" onClick={(e) => { e.stopPropagation(); seleccionarVariante(v); }}>
                                                Seleccionar
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Modal.Body>
            </Modal>
        </Container>
    );
}