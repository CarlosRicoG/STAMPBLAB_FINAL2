import React, { useState, useEffect } from "react";
import { FaPlusCircle, FaEye, FaEdit, FaTrash, FaSyncAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import { Modal } from "react-bootstrap";

import TecnicasForm from "../pages/formularios_dash/TecnicasForm";
import { getAllTecnicas, createTecnica, updateTecnica, deleteTecnica } from "../services/api-tecnicas/tecnicas";

const Tecnicas = () => {
    const [search, setSearch] = useState("");
    const [tecnicas, setTecnicas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [tecnicaEdit, setTecnicaEdit] = useState(null);

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedTecnica, setSelectedTecnica] = useState(null);

    useEffect(() => {
        loadTecnicas();
    }, []);

    const loadTecnicas = async () => {
        try {
            setLoading(true);
            const response = await getAllTecnicas();
            if (response) setTecnicas(response);
            else setError("Error al cargar técnicas");
        } catch (err) {
            setError("Error al cargar las técnicas: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const filtered = tecnicas.filter((t) =>
        t.Nombre.toLowerCase().includes(search.toLowerCase())
    );

    const handleAgregar = () => {
        setTecnicaEdit(null);
        setShowForm(true);
    };

    const handleEditar = (tecnica) => {
        setTecnicaEdit(tecnica);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setTecnicaEdit(null);
    };

    const handleSave = async (tecnicaData) => {
        try {
            setLoading(true);
            let response;

            if (tecnicaEdit) {
                response = await updateTecnica(tecnicaEdit.TecnicaID, tecnicaData);
            } else {
                response = await createTecnica(tecnicaData);
            }

            if (response.estado) {
                await loadTecnicas();
                handleCloseForm();

                Swal.fire({
                    toast: true,
                    icon: "success",
                    title: tecnicaEdit ? "Técnica actualizada" : "Técnica creada",
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 2500,
                    timerProgressBar: true,
                });
            } else {
                throw new Error(response.message || "Error desconocido");
            }
        } catch (error) {
            console.error("Error al guardar técnica:", error);

            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";

            Swal.fire({
                icon: "error",
                title: "Error",
                text: tecnicaEdit
                    ? `No se pudo actualizar: ${errorMsg}`
                    : `No se pudo crear: ${errorMsg}`,
                footer: error.response?.data?.detalles || ""
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async (tecnicaID) => {
        try {
            const result = await Swal.fire({
                title: "¿Estás seguro?",
                text: "Esta acción no se puede revertir",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, eliminar",
                cancelButtonText: "Cancelar",
            });

            if (result.isConfirmed) {
                setLoading(true);
                const response = await deleteTecnica(tecnicaID);

                if (response.estado) {
                    await loadTecnicas();
                    Swal.fire({
                        toast: true,
                        icon: "success",
                        title: "Técnica eliminada",
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 2000,
                    });
                } else throw new Error("Error al eliminar");
            }
        } catch (error) {
            console.error(error);
            Swal.fire("Error", error.message || "No se pudo eliminar", "error");
        } finally {
            setLoading(false);
        }
    };

    
    const handleCambiarEstado = async (tecnica) => {
        const nuevoEstado = !tecnica.Estado;

        try {
            const result = await Swal.fire({
                title: "¿Cambiar estado?",
                text: `¿Seguro que desea cambiar a ${nuevoEstado ? "Activo" : "Inactivo"}?`,
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Sí, cambiar",
                cancelButtonText: "Cancelar",
                confirmButtonColor: "#1976d2",
                cancelButtonColor: "#d33",
            });

            if (!result.isConfirmed) return;

            const response = await updateTecnica(tecnica.TecnicaID, {
                Nombre: tecnica.Nombre,
                Descripcion: tecnica.Descripcion,
                imagenTecnica: tecnica.imagenTecnica,
                Estado: nuevoEstado,
            });

            if (response.estado) {
                await loadTecnicas();

                Swal.fire({
                    toast: true,
                    icon: "success",
                    title: `Estado cambiado a ${nuevoEstado ? "Activo" : "Inactivo"}`,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 2500,
                    timerProgressBar: true,
                });

            } else {
                throw new Error(response.message || "Error desconocido");
            }

        } catch (error) {
            console.error(error);

            const errorMsg =
                error.response?.data?.message ||
                error.message ||
                "Error al cambiar estado";

            Swal.fire({
                icon: "error",
                title: "Error al cambiar estado",
                text: errorMsg,
                footer: error.response?.data?.detalles || "",
            });
        }
    };


    if (showForm)
        return (
            <TecnicasForm
                onClose={handleCloseForm}
                onSave={handleSave}
                tecnicaEdit={tecnicaEdit}
            />
        );

    if (loading) return <div className="text-center p-5">Cargando...</div>;
    if (error) return <div className="alert alert-danger m-3">Error: {error}</div>;

    return (
        <div className="d-flex flex-column" style={{ minHeight: "100dvh", padding: "20px 30px" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h1 className="fs-5 fw-bold mb-0 text-primary">Gestión de Técnicas</h1>
                <button
                    className="btn btn-sm btn-primary d-flex align-items-center gap-2"
                    onClick={handleAgregar}
                >
                    <FaPlusCircle /> Agregar Técnica
                </button>
            </div>

            <div className="d-flex justify-content-end mb-3">
                <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Buscar técnica..."
                    style={{ maxWidth: 260 }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="table-responsive rounded-4 shadow-sm bg-white">
                <table className="table table-sm align-middle mb-0">
                    <thead className="text-white" style={{ background: "#1976d2" }}>
                        <tr>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Imagen</th>
                            <th>Estado</th>
                            <th style={{ width: 200 }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-4 text-muted">
                                    No hay técnicas para mostrar.
                                </td>
                            </tr>
                        )}

                        {filtered.map((t) => (
                            <tr key={t.TecnicaID}>
                                <td>{t.Nombre}</td>
                                <td>{t.Descripcion}</td>

                                <td>
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => {
                                            setSelectedTecnica(t);
                                            setShowImageModal(true);
                                        }}
                                    >
                                        Ver Imagen
                                    </button>
                                </td>

                                <td>
                                    <span
                                        className={`badge ${t.Estado ? "bg-success" : "bg-danger"}`}
                                    >
                                        {t.Estado ? "Activo" : "Inactivo"}
                                    </span>
                                </td>

                                <td className="d-flex gap-1">
                                    <button
                                        className="btn btn-outline-primary btn-sm rounded-circle"
                                        onClick={() => {
                                            setSelectedTecnica(t);
                                            setShowDetailModal(true);
                                        }}
                                        title="Ver detalle"
                                    >
                                        <FaEye size={14} />
                                    </button>
                                    <button
                                        className="btn btn-outline-warning btn-sm rounded-circle"
                                        onClick={() => handleEditar(t)}
                                        title="Editar"
                                    >
                                        <FaEdit size={14} />
                                    </button>

                                    <button
                                        className="btn btn-outline-danger btn-sm rounded-circle"
                                        onClick={() => handleEliminar(t.TecnicaID)}
                                        title="Eliminar"
                                    >
                                        <FaTrash size={14} />
                                    </button>

                                    <button
                                        className="btn btn-outline-secondary btn-sm rounded-circle"
                                        onClick={() => handleCambiarEstado(t)}
                                        title="Cambiar estado"
                                    >
                                        <FaSyncAlt size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL VER IMAGEN RÁPIDA */}
            <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered size="lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title>{selectedTecnica?.Nombre}</Modal.Title>
                </Modal.Header>

                <Modal.Body className="text-center py-4">
                    {selectedTecnica?.imagenTecnica ? (
                        <img
                            src={selectedTecnica.imagenTecnica}
                            alt={selectedTecnica.Nombre}
                            className="img-fluid rounded shadow"
                            style={{ maxHeight: "500px", objectFit: "contain" }}
                            onError={(e) => {
                                e.target.src = "https://via.placeholder.com/500x400?text=Error+al+cargar+imagen";
                            }}
                        />
                    ) : (
                        <p className="text-muted">No hay imagen disponible</p>
                    )}
                </Modal.Body>
            </Modal>

            {/* MODAL VER DETALLES */}
            <Modal
                show={showDetailModal}
                onHide={() => setShowDetailModal(false)}
                centered
                size="lg"
                className="fade"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            >
                <div className="modal-content border-0 shadow" style={{ overflow: 'hidden' }}>
                    {selectedTecnica && (
                        <>
                            {/* Encabezado del Modal */}
                            <div
                                className="modal-header border-0 text-white"
                                style={{
                                    background: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)',
                                    padding: '20px'
                                }}
                            >
                                <div className="d-flex align-items-center">
                                    <div>
                                        <h5 className="modal-title fw-bold mb-1">Detalles de la Técnica</h5>
                                        <p className="mb-0 opacity-75" style={{ fontSize: '0.9rem' }}>
                                            ID: {selectedTecnica.TecnicaID}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setShowDetailModal(false)}
                                    aria-label="Close"
                                />
                            </div>

                            {/* Cuerpo del Modal */}
                            <div className="modal-body p-4">
                                <div className="row g-3">
                                    {/* Nombre */}
                                    <div className="col-12">
                                        <div className="p-3 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                                            <label className="text-muted mb-1 fs-6">Nombre de la Técnica</label>
                                            <h4 className="mb-0 fs-5 fw-bold text-primary">
                                                {selectedTecnica.Nombre}
                                            </h4>
                                        </div>
                                    </div>

                                    {/* Descripción */}
                                    <div className="col-12">
                                        <div className="p-3 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                                            <label className="text-muted mb-1 fs-6">Descripción</label>
                                            <p className="mb-0 fs-6 text-dark">
                                                {selectedTecnica.Descripcion || "Sin descripción"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Estado */}
                                    <div className="col-12">
                                        <div className="p-3 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                                            <label className="text-muted mb-2 fs-6">Estado</label>
                                            <div>
                                                <span
                                                    className={`badge px-3 py-2 fs-6 ${selectedTecnica.Estado ? "bg-success" : "bg-danger"
                                                        }`}
                                                >
                                                    {selectedTecnica.Estado ? "✓ Activo" : "✗ Inactivo"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Imagen */}
                                    <div className="col-12">
                                        <div className="p-3 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                                            <label className="text-muted mb-3 fs-6">Imagen de la Técnica</label>
                                            <div className="text-center">
                                                {selectedTecnica.imagenTecnica ? (
                                                    <img
                                                        src={selectedTecnica.imagenTecnica}
                                                        alt={selectedTecnica.Nombre}
                                                        className="img-fluid rounded shadow-sm"
                                                        style={{
                                                            maxHeight: "400px",
                                                            objectFit: "contain",
                                                            border: "2px solid #dee2e6"
                                                        }}
                                                        onError={(e) => {
                                                            e.target.src = "https://via.placeholder.com/400x300?text=Error+al+cargar+imagen";
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        className="d-flex flex-column align-items-center justify-content-center text-muted"
                                                        style={{ minHeight: "200px" }}
                                                    >
                                                        <svg
                                                            width="80"
                                                            height="80"
                                                            fill="currentColor"
                                                            className="mb-3 opacity-50"
                                                            viewBox="0 0 16 16"
                                                        >
                                                            <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                                                            <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z" />
                                                        </svg>
                                                        <p className="mb-0">No hay imagen disponible</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pie del Modal */}
                            <div className="modal-footer d-flex justify-content-between border-0 pt-0">
                                <button
                                    type="button"
                                    className="btn btn-outline-primary px-4"
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        handleEditar(selectedTecnica);
                                    }}
                                >
                                    <FaEdit className="me-2" />
                                    Editar
                                </button>
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
        </div>
    );
};

export default Tecnicas;