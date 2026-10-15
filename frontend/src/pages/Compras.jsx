import { useState, useEffect } from "react";
import { FaEdit, FaEye, FaPlusCircle, FaTrash } from "react-icons/fa";
import { getCompras, createCompra, updateCompra, deleteCompra } from "../Services/api-compras/compras";
import Swal from 'sweetalert2';
import { Modal } from 'react-bootstrap';
import NuevaCompra from "./formularios_dash/CompraForm";

const Compras = () => {
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [selectedCompra, setSelectedCompra] = useState(null);
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        cargarCompras();
    }, []);

    const cargarCompras = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getCompras();

            if (response) {
                setCompras(response);
            } else {
                setError('Error al cargar las compras');
            }
        } catch (err) {
            console.error("Error cargando compras:", err);
            setError('Error de conexión al cargar compras');
        } finally {
            setLoading(false);
        }
    };

    const handleAgregar = () => {
        setSelectedCompra(null);
        setShowForm(true);
    };

    // función para editar (abre el formulario con la compra cargada)
    const handleEdit = (compra) => {
        setSelectedCompra(compra);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setSelectedCompra(null);
    };

    const handleEliminar = async (compraId) => {
        try {
            const result = await Swal.fire({
                title: '¿Está seguro?',
                text: "Eliminará la compra y todos sus detalles",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                const response = await deleteCompra(compraId);
                if (response.estado) {
                    await cargarCompras();
                    Swal.fire('Eliminado', 'La compra ha sido eliminada', 'success');
                } else {
                    throw new Error(response.mensaje || 'No se pudo eliminar la compra');
                }
            }
        } catch (error) {
            console.error("Error:", error);
            Swal.fire('Error', error.message || 'Error al eliminar la compra', 'error');
        }
    };

    // handleSave actualizado: crea o actualiza según selectedCompra
    const handleSave = async (compraData) => {
        try {
            setLoading(true);

            if (selectedCompra && selectedCompra.CompraID) {
                // EDITAR compra existente
                const response = await updateCompra(selectedCompra.CompraID, compraData);

                if (response && response.estado) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Éxito!',
                        text: response.mensaje || 'Compra actualizada correctamente'
                    });
                    setShowForm(false);
                    setSelectedCompra(null);
                    await cargarCompras();
                } else {
                    throw new Error(response?.mensaje || 'No se pudo actualizar la compra');
                }
            } else {
                // CREAR nueva compra
                const response = await createCompra(compraData);

                if (response && response.estado) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Éxito!',
                        text: response.mensaje || 'Compra creada correctamente'
                    });
                    setShowForm(false);
                    await cargarCompras();
                } else {
                    throw new Error(response?.mensaje || 'No se pudo crear la compra');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Ocurrió un error al procesar la solicitud'
            });
        } finally {
            setLoading(false);
        }
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return "-";
        const date = new Date(fecha);
        return date.toLocaleDateString('es-CO');
    };

    // Filtrar compras
    const comprasFiltradas = compras.filter(compra => {
        const busqueda = search.toLowerCase();
        return (
            compra.CompraID?.toString().includes(busqueda) ||
            compra.proveedor?.Nombre?.toLowerCase().includes(busqueda) ||
            compra.proveedor?.Nit?.toLowerCase().includes(busqueda)
        );
    });

    if (showForm) {
        return (
            <NuevaCompra
                onClose={handleCloseForm}
                onSave={handleSave}
                compra={selectedCompra}
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
                    Gestión de Compras a Proveedores
                </h1>
                <button
                    className="btn btn-sm btn-primary d-flex align-items-center gap-2 shadow-sm"
                    onClick={handleAgregar}
                >
                    <FaPlusCircle size={18} />
                    Agregar Compra
                </button>
            </div>

            {/* Buscador */}
            <div className="d-flex justify-content-end mb-3">
                <div className="input-group input-group-sm" style={{ maxWidth: 260 }}>
                    <span className="input-group-text bg-white border-end-0"></span>
                    <input
                        type="text"
                        className="form-control border-start-0"
                        placeholder="Buscar compra..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabla */}
            <div className="flex-grow-1" style={{ overflow: "auto", minHeight: 0 }}>
                <div
                    className="table-responsive rounded-4 shadow-sm"
                    style={{ background: "#fff" }}
                >
                    <table className="table table-sm align-middle mb-0">
                        <thead
                            style={{
                                background: "linear-gradient(90deg, #1976d2 60%, #64b5f6 100%)",
                                color: "#fff",
                                fontSize: "0.85rem",
                            }}
                        >
                            <tr>
                                <th style={{ borderTopLeftRadius: 12 }}>ID</th>
                                <th>Proveedor</th>
                                <th>NIT</th>
                                <th>Fecha</th>
                                <th># Insumos</th>
                                <th style={{ width: 120 }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-4">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Cargando...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-4 text-danger">
                                        {error}
                                        <br />
                                        <button
                                            className="btn btn-outline-primary btn-sm mt-2"
                                            onClick={cargarCompras}
                                        >
                                            Reintentar
                                        </button>
                                    </td>
                                </tr>
                            ) : comprasFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-4 text-muted">
                                        {compras.length === 0
                                            ? "No hay compras registradas."
                                            : "No se encontraron compras con los filtros aplicados."
                                        }
                                    </td>
                                </tr>
                            ) : (
                                comprasFiltradas.map((compra) => (
                                    <tr key={compra.CompraID} style={{ borderBottom: "1px solid #e3e8ee" }}>
                                        <td>
                                            <span className="badge bg-light text-dark px-2 py-1 shadow-sm">
                                                {compra.CompraID}
                                            </span>
                                        </td>
                                        <td className="fw-medium">{compra.proveedor?.Nombre || 'N/A'}</td>
                                        <td>{compra.proveedor?.Nit || 'N/A'}</td>
                                        <td>{formatearFecha(compra.FechaCompra)}</td>
                                        <td className="text-center">
                                            <span className="badge bg-info">
                                                {compra.detalles?.length || 0}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex justify-content-center gap-1">
                                                <button
                                                    className="btn btn-outline-primary btn-sm rounded-circle"
                                                    title="Ver"
                                                    onClick={() => {
                                                        setSelectedCompra(compra);
                                                        setShowDetailModal(true);
                                                    }}
                                                >
                                                    <FaEye size={14} />
                                                </button>

                                                {/* Botón de editar agregado */}
                                                <button
                                                    className="btn btn-outline-warning btn-sm rounded-circle"
                                                    title="Editar"
                                                    onClick={() => handleEdit(compra)}
                                                >
                                                    <FaEdit size={14} />
                                                </button>

                                                <button
                                                    className="btn btn-outline-danger btn-sm rounded-circle"
                                                    title="Eliminar"
                                                    onClick={() => handleEliminar(compra.CompraID)}
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Detalles */}
            <Modal
                show={showDetailModal}
                onHide={() => setShowDetailModal(false)}
                centered
                size="lg"
            >
                <div className="modal-content border-0 shadow">
                    {selectedCompra && (
                        <>
                            <div className="modal-header border-0 text-white"
                                style={{
                                    background: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)',
                                    padding: '20px'
                                }}>
                                <div>
                                    <h5 className="modal-title fw-bold mb-1">Detalle de la Compra</h5>
                                    <p className="mb-0 opacity-75" style={{ fontSize: '0.9rem' }}>
                                        ID: {selectedCompra.CompraID}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setShowDetailModal(false)}
                                />
                            </div>

                            <div className="modal-body p-4">
                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <div className="p-3 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                                            <label className="text-muted mb-1 fs-6">Proveedor</label>
                                            <h5 className="mb-0">{selectedCompra.proveedor?.Nombre}</h5>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="p-3 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                                            <label className="text-muted mb-1 fs-6">NIT</label>
                                            <h5 className="mb-0">{selectedCompra.proveedor?.Nit}</h5>
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="p-3 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                                            <label className="text-muted mb-1 fs-6">Fecha</label>
                                            <p className="mb-0">{formatearFecha(selectedCompra.FechaCompra)}</p>
                                        </div>
                                    </div>
                                </div>

                                <h6 className="mb-3">Insumos ({selectedCompra.detalles?.length || 0})</h6>
                                <div className="table-responsive">
                                    <table className="table table-sm table-striped">
                                        <thead className="table-light">
                                            <tr>
                                                <th>#</th>
                                                <th>Insumo</th>
                                                <th>Cantidad</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedCompra.detalles?.map((detalle, index) => (
                                                <tr key={detalle.DetalleCompraID}>
                                                    <td>{index + 1}</td>
                                                    <td>{detalle.insumo?.Nombre || 'N/A'}</td>
                                                    <td className="fw-bold">{detalle.Cantidad}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="modal-footer border-0">
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={() => setShowDetailModal(false)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default Compras;
