import React, { useState, useEffect } from "react";
import { FaPlusCircle, FaEye, FaEdit, FaSyncAlt, FaTrash } from "react-icons/fa";
import { Modal, Form } from "react-bootstrap";
import Swal from 'sweetalert2';
import NuevaVenta from "./formularios_dash/NuevaVenta";
import { getVentas, getVentaById, updateEstadoVenta, deleteVenta } from "../Services/api-ventas/ventas";
import { getEstadosVenta } from "../Services/api-ventas/estados";

const Ventas = () => {
    const [showForm, setShowForm] = useState(false);
    const [ventaEdit, setVentaEdit] = useState(null);
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVenta, setSelectedVenta] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEstadoModal, setShowEstadoModal] = useState(false);
    const [estadosVenta, setEstadosVenta] = useState([]);
    const [estadoSeleccionado, setEstadoSeleccionado] = useState("");
    const [filtro, setFiltro] = useState("");



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
                    title: '¡Venta registrada exitosamente!',
                    html: `
                    <div style="text-align: left; padding: 10px;">
                        <p><strong>Número de venta:</strong> #${ventaCreada.VentaID || 'N/A'}</p>
                        <p><strong>Cliente:</strong> ${usuarios.find(u => u.DocumentoID === clienteSeleccionado)?.Nombre || 'N/A'}</p>
                        <p><strong>Productos:</strong> ${productosAgregados.length} item(s)</p>
                        <hr style="margin: 10px 0;">
                        <p style="font-size: 1.2rem; color: #28a745;">
                            <strong>Total:</strong> $${total.toLocaleString()}
                        </p>
                        <p class="text-muted" style="font-size: 0.9rem; margin-top: 10px;">
                            El stock ha sido descontado automáticamente
                        </p>
                    </div>
                `,
                    confirmButtonColor: '#28a745',
                    confirmButtonText: 'Ver ventas'
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


    // Toast configuración
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    // Cargar ventas al montar
    useEffect(() => {
        loadVentas();
        loadEstadosVenta();
    }, []);

    // Cargar todas las ventas
    // En Ventas.jsx - línea ~54
    const loadVentas = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getVentas();
            // FILTRAR: Excluir ventas pendientes (EstadoID = 8)
            const noPendientes = (data || []).filter(v => v.EstadoID !== 8);
            setVentas(noPendientes);
        } catch (error) {
            console.error("Error al cargar ventas:", error);
            setError("Error al cargar ventas");
        } finally {
            setLoading(false);
        }
    };

    // Cargar estados tipo 'venta'
    const loadEstadosVenta = async () => {
        try {
            const estados = await getEstadosVenta();
            setEstadosVenta(estados || []);
        } catch (error) {
            console.error("Error al cargar estados:", error);
        }
    };

    // Abrir formulario agregar
    const handleAgregar = () => {
        setVentaEdit(null);
        setShowForm(true);
    };

    // Abrir formulario editar
    const handleEditar = (venta) => {
        setVentaEdit(venta);
        setShowForm(true);
    };

    // estado opcional para evitar doble click
    const [deletingId, setDeletingId] = useState(null);

    const handleEliminar = async (venta) => {
        // Confirmación con SweetAlert2
        const result = await Swal.fire({
            title: `Eliminar venta #${venta.VentaID}?`,
            text: "Esta acción no se puede deshacer. Se eliminarán los detalles también.",
            icon: "warning",
            showCancelButton: true,
            cancelButtonText: "Cancelar",
            confirmButtonText: "Sí, eliminar",
            reverseButtons: false
        });

        if (result.isConfirmed) {
            try {
                setDeletingId(venta.VentaID);
                await deleteVenta(venta.VentaID);
                Toast.fire({
                    icon: 'success',
                    title: `Venta ${venta.VentaID} eliminada`
                });
                // recargar lista
                await loadVentas();
                setDeletingId(null);
            } catch (error) {
                console.error("Error al eliminar venta:", error);
                setDeletingId(null);
                Toast.fire({
                    icon: 'error',
                    title: 'Error al eliminar la venta'
                });
            }
        }
    };


    // Cerrar formulario
    const handleCloseForm = () => {
        setShowForm(false);
        setVentaEdit(null);
        loadVentas(); // Recargar tabla al cerrar
    };

    // Ver detalles
    const handleVer = async (venta) => {
        try {
            const data = await getVentaById(venta.VentaID);
            setSelectedVenta(data);
            setShowDetailModal(true);
        } catch (error) {
            console.error("Error al cargar detalles:", error);
            Toast.fire({
                icon: 'error',
                title: 'Error al cargar detalles de la venta'
            });
        }
    };

    // Cambiar estado
    const handleCambiarEstado = (venta) => {
        setSelectedVenta(venta);
        setEstadoSeleccionado(venta.EstadoID || "");
        setShowEstadoModal(true);
    };

    const confirmarCambioEstado = async () => {
        if (!estadoSeleccionado) {
            Toast.fire({ icon: 'warning', title: 'Seleccione un estado' });
            return;
        }

        try {
            await updateEstadoVenta(selectedVenta.VentaID, parseInt(estadoSeleccionado));

            Toast.fire({
                icon: 'success',
                title: 'Estado actualizado correctamente'
            });

            setShowEstadoModal(false);
            loadVentas();
        } catch (error) {
            console.error("Error al cambiar estado:", error);
            Toast.fire({
                icon: 'error',
                title: 'Error al actualizar el estado'
            });
        }
    };

    // Formatear fecha
    const formatearFecha = (fecha) => {
        if (!fecha) return "-";
        const date = new Date(fecha);
        return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Obtener nombre del estado
    const getEstadoNombre = (estadoID) => {
        const estado = estadosVenta.find(e => e.EstadoID === estadoID);
        return estado?.Nombre || 'Sin estado';
    };

    // Obtener badge del estado
    const getEstadoBadge = (estadoID) => {
        const estado = estadosVenta.find(e => e.EstadoID === estadoID);
        if (!estado) return { bg: 'secondary', nombre: 'Sin estado' };

        const badges = {
            'Pendiente': 'warning',
            'Pagada': 'success',
            'En Producción': 'info',
            'Lista para Entrega': 'primary',
            'Entregada': 'success',
            'Cancelada': 'danger'
        };

        return {
            bg: badges[estado.Nombre] || 'secondary',
            nombre: estado.Nombre
        };
    };

    // Filtrar ventas
    const ventasFiltradas = ventas.filter(v =>
        v.VentaID?.toString().includes(filtro.toLowerCase()) ||
        v.DocumentoID?.toString().includes(filtro.toLowerCase()) ||
        v.usuario?.Nombre?.toLowerCase().includes(filtro.toLowerCase())
    );

    // Si el formulario está abierto
    if (showForm) {
        return (
            <NuevaVenta
                onClose={handleCloseForm}
                ventaEdit={ventaEdit}
                generarVenta={generarVenta}
            />
        );
    }

    return (
        <div
            className="d-flex flex-column"
            style={{
                minHeight: "100dvh",
                background: "linear-gradient(135deg, #ffffffff 0%, #fafcff 100%)",
                padding: "20px 30px",
                fontSize: "0.9rem",
            }}
        >
            {/* Encabezado */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h1
                    className="fs-5 fw-bold mb-0 text-primary"
                    style={{ letterSpacing: 1 }}
                >
                    Gestión de Ventas
                </h1>
                <button
                    className="btn btn-sm btn-primary d-flex align-items-center gap-2 shadow-sm"
                    onClick={handleAgregar}
                    disabled={loading}
                >
                    <FaPlusCircle size={18} />
                    Agregar Venta
                </button>
            </div>

            {/* Filtro */}
            <div className="mb-3 d-flex justify-content-end">
                <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Filtrar por ID o cliente..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    style={{ maxWidth: 350 }}
                />
            </div>

            {/* Error */}
            {error && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                    <div>
                        {error}
                        <button
                            className="btn btn-sm btn-outline-danger ms-2"
                            onClick={loadVentas}
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            )}

            {/* Tabla */}
            <div className="flex-grow-1" style={{ overflow: "auto", minHeight: 0 }}>
                <div
                    className="table-responsive rounded-4 shadow-sm"
                    style={{ background: "#fff" }}
                >
                    <table className="table table-sm table-hover align-middle mb-0">
                        <thead
                            style={{
                                background: "linear-gradient(90deg, #1976d2 60%, #64b5f6 100%)",
                                color: "#fff",
                                fontSize: "0.85rem",
                            }}
                        >
                            <tr>
                                <th style={{ borderTopLeftRadius: 12, minWidth: 80 }}>ID Venta</th>
                                <th style={{ minWidth: 120 }}>Cliente</th>
                                <th style={{ minWidth: 150 }}>Fecha</th>
                                <th style={{ minWidth: 100 }}>Subtotal</th>
                                <th style={{ minWidth: 100 }}>Total</th>
                                <th style={{ minWidth: 120 }}>Estado</th>
                                <th style={{ width: 200, borderTopRightRadius: 12 }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-5">
                                        <div className="d-flex flex-column align-items-center">
                                            <div className="spinner-border spinner-border-sm text-primary mb-2" role="status">
                                                <span className="visually-hidden">Cargando...</span>
                                            </div>
                                            <span className="text-muted">Cargando ventas...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : ventasFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-5">
                                        <div className="d-flex flex-column align-items-center text-muted">
                                            <span className="mb-2">No hay ventas registradas</span>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={handleAgregar}
                                            >
                                                Crear primera venta
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                ventasFiltradas.map((venta) => {
                                    const estadoBadge = getEstadoBadge(venta.EstadoID);
                                    return (
                                        <tr key={venta.VentaID} style={{ borderBottom: "1px solid #e3e8ee" }}>
                                            <td>
                                                <span className="badge bg-light text-dark px-2 py-1 shadow-sm">
                                                    {venta.VentaID}
                                                </span>
                                            </td>
                                            <td className="fw-medium">
                                                {venta.usuario?.Nombre || `Doc: ${venta.DocumentoID}`}
                                            </td>
                                            <td>
                                                <small className="text-muted">
                                                    {formatearFecha(venta.FechaVenta)}
                                                </small>
                                            </td>
                                            <td className="text-end">
                                                ${parseFloat(venta.Subtotal || 0).toLocaleString()}
                                            </td>
                                            <td className="text-end fw-bold">
                                                ${parseFloat(venta.Total || 0).toLocaleString()}
                                            </td>
                                            <td>
                                                <span className={`badge bg-${estadoBadge.bg} px-2 py-1 shadow-sm`}>
                                                    {estadoBadge.nombre}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex justify-content-center gap-1">
                                                    <button
                                                        className="btn btn-outline-primary btn-sm rounded-circle"
                                                        title="Ver detalles"
                                                        onClick={() => handleVer(venta)}
                                                    >
                                                        <FaEye size={14} />
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-warning btn-sm rounded-circle"
                                                        title="Editar venta"
                                                        onClick={() => handleEditar(venta)}
                                                    >
                                                        <FaEdit size={14} />
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-secondary btn-sm rounded-circle"
                                                        title="Cambiar estado"
                                                        onClick={() => handleCambiarEstado(venta)}
                                                    >
                                                        <FaSyncAlt size={14} />
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-danger btn-sm rounded-circle"
                                                        title="Eliminar venta"
                                                        onClick={() => handleEliminar(venta)}
                                                        disabled={deletingId === venta.VentaID}
                                                    >
                                                        <FaTrash size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL DE DETALLES */}
            <Modal
                show={showDetailModal}
                onHide={() => setShowDetailModal(false)}
                centered
                size="lg"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            >
                <div className="modal-content border-0 shadow" style={{ overflow: 'hidden' }}>
                    {selectedVenta && (
                        <>
                            <div className="modal-header border-0 text-white"
                                style={{
                                    background: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)',
                                    padding: '20px'
                                }}>
                                <div>
                                    <h5 className="modal-title fw-bold mb-1">Detalles de la Venta</h5>
                                    <p className="mb-0 opacity-75" style={{ fontSize: '0.9rem' }}>
                                        Venta ID: {selectedVenta.VentaID}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setShowDetailModal(false)}
                                />
                            </div>

                            <div className="modal-body p-4">
                                <div className="row g-3">
                                    {/* Cliente */}
                                    <div className="col-md-6">
                                        <div className="p-3 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                                            <label className="text-muted mb-1 fs-6">Cliente</label>
                                            <h6 className="mb-0 fw-normal">
                                                {selectedVenta.usuario?.Nombre || 'Sin nombre'}
                                            </h6>
                                        </div>
                                    </div>

                                    {/* Documento */}
                                    <div className="col-md-6">
                                        <div className="p-3 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                                            <label className="text-muted mb-1 fs-6">Documento</label>
                                            <h6 className="mb-0 fw-normal">{selectedVenta.DocumentoID}</h6>
                                        </div>
                                    </div>

                                    {/* Fecha */}
                                    <div className="col-md-6">
                                        <div className="p-3 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                                            <label className="text-muted mb-1 fs-6">Fecha de Venta</label>
                                            <h6 className="mb-0 fw-normal">{formatearFecha(selectedVenta.FechaVenta)}</h6>
                                        </div>
                                    </div>

                                    {/* Estado */}
                                    <div className="col-md-6">
                                        <div className="p-3 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                                            <label className="text-muted mb-1 fs-6">Estado</label>
                                            <div>
                                                <span className={`badge bg-${getEstadoBadge(selectedVenta.EstadoID).bg} px-3 py-2`}>
                                                    {getEstadoBadge(selectedVenta.EstadoID).nombre}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subtotal y Total */}
                                    <div className="col-md-6">
                                        <div className="p-3 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                                            <label className="text-muted mb-1 fs-6">Subtotal</label>
                                            <h5 className="mb-0 text-primary">
                                                ${parseFloat(selectedVenta.Subtotal || 0).toLocaleString()}
                                            </h5>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="p-3 rounded-3" style={{ backgroundColor: '#d1f2eb' }}>
                                            <label className="text-muted mb-1 fs-6">Total</label>
                                            <h5 className="mb-0 text-success fw-bold">
                                                ${parseFloat(selectedVenta.Total || 0).toLocaleString()}
                                            </h5>
                                        </div>
                                    </div>

                                    {/* Detalles de productos */}
                                    <div className="col-12">
                                        <div className="p-3 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                                            <label className="text-muted mb-2 fs-6">Productos</label>
                                            {selectedVenta.detalles && selectedVenta.detalles.length > 0 ? (
                                                <table className="table table-sm table-bordered">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Producto</th>
                                                            <th>Color</th>
                                                            <th>Talla</th>
                                                            <th>Cantidad</th>
                                                            <th>Precio Unit.</th>
                                                            <th>Subtotal</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedVenta.detalles.map((det, i) => (
                                                            <tr key={i}>
                                                                <td>{det.producto?.Nombre || '-'}</td>
                                                                <td>{det.color?.Nombre || '-'}</td>
                                                                <td>{det.talla?.Nombre || '-'}</td>
                                                                <td>{det.Cantidad}</td>
                                                                <td>${parseFloat(det.PrecioUnitario).toLocaleString()}</td>
                                                                <td className="fw-bold">
                                                                    ${(det.Cantidad * parseFloat(det.PrecioUnitario)).toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <p className="text-muted mb-0">No hay detalles disponibles</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer border-0 d-flex justify-content-center pt-0">
                                <button
                                    type="button"
                                    className="btn btn-danger px-4"
                                    onClick={() => setShowDetailModal(false)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            {/* MODAL CAMBIAR ESTADO */}
            <Modal
                show={showEstadoModal}
                onHide={() => setShowEstadoModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Cambiar Estado de Venta</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Seleccione el nuevo estado</Form.Label>
                        <Form.Select
                            value={estadoSeleccionado}
                            onChange={(e) => setEstadoSeleccionado(e.target.value)}
                        >
                            <option value="">-- Seleccione --</option>
                            {estadosVenta.map(estado => (
                                <option key={estado.EstadoID} value={estado.EstadoID}>
                                    {estado.Nombre} - {estado.Descripcion}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <button className="btn btn-primary" onClick={confirmarCambioEstado}>
                        Confirmar
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowEstadoModal(false)}>
                        Cancelar
                    </button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Ventas;