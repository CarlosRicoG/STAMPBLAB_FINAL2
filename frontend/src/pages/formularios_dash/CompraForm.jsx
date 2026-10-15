import { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaTrash, FaSearch } from "react-icons/fa";
import { Modal, Button } from "react-bootstrap";
import Swal from 'sweetalert2';
import { getProveedores } from "../../Services/api-compras/compras";
import { getInsumos } from "../../Services/api-insumos/insumos";

const NuevaCompra = ({ onClose, onSave, compra = null }) => {
    // ==========================
    // ESTADOS DEL FORMULARIO
    // ==========================
    const [formData, setFormData] = useState({
        proveedorRefId: "",
        fechaCompra: new Date().toISOString().split('T')[0]
    });

    const [proveedores, setProveedores] = useState([]);
    const [insumos, setInsumos] = useState([]);
    const [detalles, setDetalles] = useState([]);
    
    // Estado para el insumo seleccionado temporalmente
    const [insumoSeleccionado, setInsumoSeleccionado] = useState(null);
    const [cantidadInsumo, setCantidadInsumo] = useState(1);
    
    // Modal
    const [showModalInsumo, setShowModalInsumo] = useState(false);
    const [busquedaInsumo, setBusquedaInsumo] = useState("");

    // Estados
    const estados = [
        { id: "Pendiente", nombre: "Pendiente" },
        { id: "Aprobada", nombre: "Aprobada" },
        { id: "Rechazada", nombre: "Rechazada" }
    ];

    // ==========================
    // CARGAR DATOS INICIALES
    // ==========================
    useEffect(() => {
        cargarProveedores();
        cargarInsumos();
        
        // Cargar datos si estamos editando
        if (compra) {
            setFormData({
                proveedorRefId: compra.ProveedorRefId?.toString() || "",
                estadoId: compra.EstadoID || "Pendiente",
                fechaCompra: compra.FechaCompra 
                    ? new Date(compra.FechaCompra).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0]
            });
            
            // Cargar los detalles existentes
            if (compra.detalles && compra.detalles.length > 0) {
                const detallesFormateados = compra.detalles.map(detalle => ({
                    InsumoID: detalle.InsumoID,
                    NombreInsumo: detalle.insumo?.Nombre || 'N/A',
                    Cantidad: detalle.Cantidad,
                    Tipo: detalle.insumo?.Tipo || 'N/A',
                    StockActual: detalle.insumo?.Stock || 0
                }));
                setDetalles(detallesFormateados);
            }
        }
    }, [compra]);

    const cargarProveedores = async () => {
        try {
            const data = await getProveedores();
            const proveedoresActivos = data.filter(p => 
                p.Estado === true || p.Estado === 1
            );
            setProveedores(proveedoresActivos);
        } catch (error) {
            console.error("Error cargando proveedores:", error);
            Swal.fire("Error", "No se pudieron cargar los proveedores", "error");
        }
    };

    const cargarInsumos = async () => {
        try {
            const data = await getInsumos();
            const insumosActivos = data.filter(i => 
                i.Estado === true || i.Estado === 1
            );
            setInsumos(insumosActivos);
        } catch (error) {
            console.error("Error cargando insumos:", error);
            Swal.fire("Error", "No se pudieron cargar los insumos", "error");
        }
    };

    // ==========================
    // MANEJADORES
    // ==========================
    const handleChange = (e) => {
        const { name, value } = e.target;
        // ✅ CAMBIO: Convertir estadoId a número
        const processedValue = name === 'estadoId' ? parseInt(value) : value;
        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleSeleccionarInsumo = (insumo) => {
        setInsumoSeleccionado(insumo);
        setCantidadInsumo(1);
        setShowModalInsumo(false);
    };

    const handleAgregarInsumo = () => {
        if (!insumoSeleccionado) {
            Swal.fire("Atención", "Por favor seleccione un insumo", "warning");
            return;
        }

        if (!cantidadInsumo || cantidadInsumo <= 0) {
            Swal.fire({
                icon: "warning",
                title: "Cantidad inválida",
                text: "La cantidad debe ser mayor a 0"
            });
            return;
        }

        // ✅ NOTA: En pedidos NO validamos contra stock porque estás COMPRANDO para AUMENTAR el inventario
        // Si tienes 20 y pides 22, terminarás con 42 total (correcto ✓)

        // Verificar si el insumo ya está en la lista
        const yaExiste = detalles.find(d => d.InsumoID === insumoSeleccionado.InsumoID);
        if (yaExiste) {
            Swal.fire("Atención", "Este insumo ya fue agregado. Puede editar la cantidad en la tabla.", "warning");
            return;
        }

        const nuevoDetalle = {
            InsumoID: insumoSeleccionado.InsumoID,
            NombreInsumo: insumoSeleccionado.Nombre,
            Cantidad: cantidadInsumo,
            Tipo: insumoSeleccionado.Tipo,
            StockActual: insumoSeleccionado.Stock
        };

        setDetalles([...detalles, nuevoDetalle]);
        setInsumoSeleccionado(null);
        setCantidadInsumo(1);
        
        Swal.fire({
            icon: "success",
            title: "Insumo agregado",
            text: `${insumoSeleccionado.Nombre} (Cantidad: ${cantidadInsumo})`,
            timer: 1500,
            showConfirmButton: false
        });
    };

    const handleEliminarInsumo = (insumoId) => {
        setDetalles(detalles.filter(d => d.InsumoID !== insumoId));
    };

    const handleLimpiarFormulario = () => {
        setInsumoSeleccionado(null);
        setCantidadInsumo(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ✅ VALIDACIONES REQUERIDAS
        if (!formData.proveedorRefId) {
            Swal.fire("Error", "Debe seleccionar un proveedor", "error");
            return;
        }

        if (!formData.fechaCompra) {
            Swal.fire("Error", "Debe seleccionar una fecha para la compra", "error");
            return;
        }

        if (detalles.length === 0) {
            Swal.fire("Error", "Debe agregar al menos un insumo", "error");
            return;
        }

        // ✅ Validar que todos los detalles tengan cantidad válida
        const detalleInvalido = detalles.find(d => !d.Cantidad || d.Cantidad <= 0);
        if (detalleInvalido) {
            Swal.fire({
                icon: "error",
                title: "Cantidad inválida",
                text: "Todos los insumos deben tener una cantidad mayor a 0"
            });
            return;
        }

        // ✅ Validar fecha del pedido (debe ser hoy o futura)
        const fechaSeleccionada = new Date(formData.fechaCompra);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        if (fechaSeleccionada < hoy) {
            Swal.fire({
                icon: "warning",
                title: "Fecha inválida",
                text: "La fecha del pedido no puede ser anterior a hoy. Debe ser hoy o una fecha futura."
            });
            return;
        }

        // ✅ CAMBIO: Asegurar que EstadoID sea número
        const compraData = {
            ProveedorRefId: parseInt(formData.proveedorRefId),
            EstadoID: formData.estadoId,
            FechaCompra: formData.fechaCompra,
            detalles: detalles.map(d => ({
                InsumoID: d.InsumoID,
                Cantidad: d.Cantidad,
                PrecioUnitario: 0
            }))
        };

        console.log("📦 Datos finales a enviar:", JSON.stringify(compraData, null, 2));

        onSave(compraData);
    };

    // Filtrar insumos para el modal
    const insumosFiltrados = insumos.filter(insumo =>
        insumo.Nombre.toLowerCase().includes(busquedaInsumo.toLowerCase())
    );

    return (
        <div className="container py-4">
            <div className="position-relative mb-4 text-center">
                <p className="fw-bold fs-3 mb-0">
                    {compra ? "Editar Compra" : "Nueva Compra a Proveedor"}
                </p>
                <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-danger btn-sm shadow-sm position-absolute top-0 end-0"
                    title="Cerrar"
                >
                    <FaTimes />
                </button>
            </div>

            <form
                className="p-4 rounded shadow mb-4"
                style={{ backgroundColor: "#f5f5fa", color: "#2a273a" }}
                onSubmit={handleSubmit}
            >
                {/* Sección 1: Datos de la compra */}
                <div className="row g-3 mb-4">
                    <div className="col-md-8">
                        <label className="form-label fw-bold">
                            Proveedor <span className="text-danger">*</span>
                        </label>
                        <select
                            className="form-select"
                            name="proveedorRefId"
                            value={formData.proveedorRefId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Seleccione un proveedor...</option>
                            {proveedores.map(proveedor => (
                                <option key={proveedor.id} value={proveedor.id}>
                                    {proveedor.Nombre} - {proveedor.Nit}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-4">
                        <label className="form-label fw-bold">
                            Fecha de Compra <span className="text-danger">*</span>
                        </label>
                        <input
                            type="date"
                            className="form-control"
                            name="fechaCompra"
                            value={formData.fechaCompra}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <hr className="my-4" />

                {/* Sección 2: Seleccionar Insumo */}
                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Agregar Insumos <span className="text-danger">*</span></h5>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => setShowModalInsumo(true)}
                        >
                            <FaSearch className="me-2" />
                            Elegir Insumo
                        </button>
                    </div>

                    {/* Card con insumo seleccionado */}
                    <div className="card p-3 mb-3" style={{ backgroundColor: "#ffffff" }}>
                        <div className="row g-3 align-items-end">
                            <div className="col-md-6">
                                <label className="form-label">Insumo Seleccionado</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={insumoSeleccionado ? insumoSeleccionado.Nombre : "Seleccione un insumo..."}
                                    readOnly
                                    style={{ backgroundColor: "#f8f9fa" }}
                                />
                            </div>

                            <div className="col-md-2">
                                <label className="form-label">Tipo</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={insumoSeleccionado ? insumoSeleccionado.Tipo : "-"}
                                    readOnly
                                    style={{ backgroundColor: "#f8f9fa" }}
                                />
                            </div>

                            <div className="col-md-2">
                                <label className="form-label">Cantidad <span className="text-danger">*</span></label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={cantidadInsumo}
                                    onChange={(e) => {
                                        const valor = parseInt(e.target.value) || 0;
                                        if (valor >= 0) {
                                            setCantidadInsumo(valor);
                                        }
                                    }}
                                    min="1"
                                    max="99999"
                                    disabled={!insumoSeleccionado}
                                    placeholder="Ej: 100"
                                />
                                {insumoSeleccionado && (
                                    <small className="text-muted">
                                        Stock actual: {insumoSeleccionado.Stock}
                                    </small>
                                )}
                            </div>

                            <div className="col-md-2 d-flex gap-2">
                                <button
                                    type="button"
                                    className="btn btn-success flex-grow-1"
                                    onClick={handleAgregarInsumo}
                                    disabled={!insumoSeleccionado}
                                >
                                    <FaPlus />
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={handleLimpiarFormulario}
                                >
                                    Limpiar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botones finales */}
                <div className="d-flex justify-content-center gap-3 mt-4">
                    <button
                        type="submit"
                        className="btn btn-success px-4"
                        disabled={detalles.length === 0 || !formData.proveedorRefId || !formData.fechaCompra}
                    >
                        Registrar Compra
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary px-4"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                </div>
            </form>

            {/* Tabla de insumos agregados */}
            <div className="card p-4 shadow">
                <h5 className="mb-3">Insumos Agregados ({detalles.length})</h5>
                
                {detalles.length === 0 ? (
                    <div className="text-center text-muted py-4">
                        <p>No hay insumos agregados. Use el botón "Elegir Insumo" para agregar.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped table-hover">
                            <thead className="table-primary">
                                <tr>
                                    <th>#</th>
                                    <th>Insumo</th>
                                    <th>Tipo</th>
                                    <th>Cantidad</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detalles.map((detalle, index) => (
                                    <tr key={detalle.InsumoID}>
                                        <td>{index + 1}</td>
                                        <td className="fw-medium">{detalle.NombreInsumo}</td>
                                        <td>
                                            <span className="badge bg-info">{detalle.Tipo}</span>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                style={{ width: "100px" }}
                                                value={detalle.Cantidad}
                                                onChange={(e) => {
                                                    const nuevaCantidad = parseInt(e.target.value) || 0;
                                                    if (nuevaCantidad >= 1) {
                                                        const nuevosDetalles = detalles.map(d =>
                                                            d.InsumoID === detalle.InsumoID
                                                                ? { ...d, Cantidad: nuevaCantidad }
                                                                : d
                                                        );
                                                        setDetalles(nuevosDetalles);
                                                    }
                                                }}
                                                min="1"
                                                max="99999"
                                            />
                                            <small className="text-muted d-block">
                                                Stock: {detalle.StockActual || 0}
                                            </small>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() => handleEliminarInsumo(detalle.InsumoID)}
                                                title="Eliminar"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL: Seleccionar Insumo */}
            <Modal
                show={showModalInsumo}
                onHide={() => setShowModalInsumo(false)}
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Seleccionar Insumo</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="input-group mb-4">
                        <span className="input-group-text">
                            <FaSearch />
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar insumo por nombre..."
                            value={busquedaInsumo}
                            onChange={(e) => setBusquedaInsumo(e.target.value)}
                        />
                    </div>

                    <div className="table-responsive" style={{ maxHeight: "400px", overflow: "auto" }}>
                        <table className="table table-hover">
                            <thead className="table-light sticky-top">
                                <tr>
                                    <th>Nombre</th>
                                    <th>Tipo</th>
                                    <th>Stock Actual</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {insumosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center text-muted">
                                            No se encontraron insumos
                                        </td>
                                    </tr>
                                ) : (
                                    insumosFiltrados.map(insumo => (
                                        <tr key={insumo.InsumoID}>
                                            <td className="fw-medium">{insumo.Nombre}</td>
                                            <td>
                                                <span className="badge bg-secondary">{insumo.Tipo}</span>
                                            </td>
                                            <td>
                                                <span className={`badge ${insumo.Stock > 10 ? 'bg-success' : 'bg-warning'}`}>
                                                    {insumo.Stock} unidades
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => handleSeleccionarInsumo(insumo)}
                                                >
                                                    Seleccionar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModalInsumo(false)}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default NuevaCompra;