import { useEffect, useState } from "react";
import { FaPlusCircle, FaEye, FaEdit, FaTrash, FaSync } from "react-icons/fa";
import InsumoForm from "./formularios_dash/InsumoForm";
import {
  getInsumos,
  createInsumo,
  updateInsumo,
  deleteInsumo,
  cambiarEstadoInsumo,
} from "../Services/api-insumos/insumos";
import Swal from "sweetalert2";
import { Modal } from "react-bootstrap";

const Insumos = () => {
  const [showForm, setShowForm] = useState(false);
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insumoEdit, setInsumoEdit] = useState(null);
  const [search, setSearch] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState(null);

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

  // Cargar insumos al montar el componente
  useEffect(() => {
    loadInsumos();
  }, []);

  // Función para cargar todos los insumos
  const loadInsumos = async () => {
    try {
      setLoading(true);
      const response = await getInsumos();
      if (response) {
        setInsumos(response);
        setError(null);
      } else {
        setError(response.mensaje);
      }
    } catch (err) {
      setError("Error al cargar los insumos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para guardar insumo (crear o actualizar)
  const handleSave = async (insumoData) => {
    try {
      setLoading(true);
      if (insumoEdit) {
        // Actualizar
        await updateInsumo(insumoEdit.InsumoID, insumoData);
        Toast.fire({
          icon: 'success',
          title: 'Insumo actualizado correctamente'
        });
      } else {
        // Crear nuevo
        await createInsumo(insumoData);
        Toast.fire({
          icon: 'success',
          title: 'Insumo creado correctamente'
        });
      }
      setShowForm(false);
      await loadInsumos();
    } catch (error) {
      console.error("Error:", error);
      Swal.fire(
        "Error",
        error.response?.data?.mensaje || "Error al procesar el insumo",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar insumo
  const handleEliminar = async (insumoID) => {
    try {
      const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "Esta acción no se puede revertir",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });

      if (result.isConfirmed) {
        setLoading(true);
        await deleteInsumo(insumoID);
        await loadInsumos();
        
        Toast.fire({
          icon: 'success',
          title: 'Insumo eliminado correctamente'
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire(
        "Error",
        error.response?.data?.mensaje || "Error al eliminar el insumo",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Función para cambiar estado
  const handleCambiarEstado = async (insumo) => {
    const nuevoEstado = !insumo.Estado;
    const estadoTexto = nuevoEstado ? "Activo" : "Inactivo";

    try {
      const result = await Swal.fire({
        title: '¿Cambiar estado?',
        text: `¿Seguro que desea cambiar el estado de este insumo a ${estadoTexto}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        setLoading(true);
        await cambiarEstadoInsumo(insumo.InsumoID, nuevoEstado);
        await loadInsumos();
        
        Toast.fire({
          icon: 'success',
          title: `Estado cambiado a ${estadoTexto}`
        });
      }
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      Swal.fire(
        'Error',
        error.response?.data?.message || error.message || 'Error al cambiar el estado del insumo',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Manejadores para el modal de detalle
  const handleShowDetail = (insumo) => {
    setSelectedInsumo(insumo);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setSelectedInsumo(null);
    setShowDetailModal(false);
  };

  // Filtrar insumos según búsqueda
  const filtered = insumos.filter((insumo) =>
    insumo.Nombre.toLowerCase().includes(search.toLowerCase())
  );

  // Renderizado condicional del formulario
  if (showForm) {
    return (
      <InsumoForm
        onClose={() => setShowForm(false)}
        onSave={handleSave}
        insumoEdit={insumoEdit}
      />
    );
  }

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100dvh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
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
      {/* Encabezado y botón agregar */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1
          className="fs-5 fw-bold mb-0 text-primary"
          style={{ letterSpacing: 1 }}
        >
          Gestión de Insumos
        </h1>
        <button
          className="btn btn-sm btn-primary d-flex align-items-center gap-2 shadow-sm"
          onClick={() => {
            setInsumoEdit(null);
            setShowForm(true);
          }}
        >
          <FaPlusCircle size={18} />
          Agregar Insumo
        </button>
      </div>

      {/* Buscador */}
      <div className="d-flex justify-content-end mb-3">
        <div className="input-group input-group-sm" style={{ maxWidth: 260 }}>
          <span className="input-group-text bg-white border-end-0"></span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder="Buscar insumo..."
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
                background:
                  "linear-gradient(90deg, #1976d2 60%, #64b5f6 100%)",
                color: "#fff",
                fontSize: "0.85rem",
              }}
            >
              <tr>
                <th style={{ borderTopLeftRadius: 12 }}>Nombre</th>
                <th>Tipo</th>
                <th>Stock</th>
                <th>Estado</th>
                <th style={{ width: 160 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted">
                    No hay insumos para mostrar.
                  </td>
                </tr>
              )}
              {filtered.map((insumo) => (
                <tr
                  key={insumo.InsumoID}
                  style={{ borderBottom: "1px solid #e3e8ee" }}
                >
                  <td className="fw-medium">{insumo.Nombre}</td>
                  <td>
                    <span className="badge bg-info text-dark">
                      {insumo.Tipo || 'Otro'}
                    </span>
                  </td>
                  <td>{insumo.Stock}</td>
                  <td>
                    <span
                      className={`badge px-3 py-2 shadow-sm ${insumo.Estado
                          ? "text-success fw-bold fs-6"
                          : "text-danger fw-bold fs-6"
                        }`}
                    >
                      {insumo.Estado ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex justify-content-center gap-1">
                      <button
                        className="btn btn-outline-primary btn-sm rounded-circle"
                        title="Ver"
                        onClick={() => handleShowDetail(insumo)}
                      >
                        <FaEye size={14} />
                      </button>
                      <button
                        className="btn btn-outline-warning btn-sm rounded-circle"
                        title="Editar"
                        onClick={() => {
                          setInsumoEdit(insumo);
                          setShowForm(true);
                        }}
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm rounded-circle"
                        title="Eliminar"
                        onClick={() => handleEliminar(insumo.InsumoID)}
                      >
                        <FaTrash size={14} />
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm rounded-circle"
                        title="Cambiar estado"
                        onClick={() => handleCambiarEstado(insumo)}
                      >
                        <FaSync size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalles del Insumo */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        centered
        className="fade"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      >
        <div className="modal-content border-0 shadow" style={{ overflow: 'hidden' }}>
          {selectedInsumo && (
            <>
              <div className="modal-header border-0 text-white" 
                style={{ 
                  background: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)',
                  padding: '20px'
                }}>
                <div className="d-flex align-items-center">
                  <div>
                    <h5 className="modal-title fw-bold mb-1">Detalles del Insumo</h5>
                    <p className="mb-0 opacity-75" style={{ fontSize: '0.9rem' }}>
                      ID: {selectedInsumo.InsumoID}
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

              <div className="modal-body p-4">
                <div className="row g-3">
                  <div className="col-12">
                    <div className="p-3 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                      <label className="text-muted mb-1 fs-6">Nombre del Insumo</label>
                      <h4 className="mb-0 fs-6 fw-normal">{selectedInsumo.Nombre}</h4>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="p-3 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                      <label className="text-muted mb-1 fs-6">Tipo</label>
                      <p className="mb-0 fs-6">
                        <span className="badge bg-info text-dark">
                          {selectedInsumo.Tipo || 'Otro'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="p-3 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                      <label className="text-muted mb-1 fs-6">Stock Disponible</label>
                      <p className="mb-0 fs-6">{selectedInsumo.Stock}</p>
                    </div>
                  </div>

                  {/* Mostrar Precio Tela solo si el tipo es "Tela" */}
                  {selectedInsumo.Tipo && selectedInsumo.Tipo.toLowerCase() === 'tela' && (
                    <div className="col-12">
                      <div className="p-3 rounded-3" style={{ backgroundColor: '#e3f2fd' }}>
                        <label className="text-muted mb-1 fs-6">Precio de Tela</label>
                        <p className="mb-0 fs-5 fw-bold text-primary">
                          ${selectedInsumo.PrecioTela 
                            ? parseFloat(selectedInsumo.PrecioTela).toFixed(2) 
                            : '0.00'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="col-12">
                    <div className="p-3 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                      <label className="text-muted mb-1 fs-6">Estado</label>
                      <div className="d-flex align-items-center">
                        <span 
                          className={`badge px-3 py-2 ${
                            selectedInsumo.Estado ? 'bg-success' : 'bg-danger'
                          }`}
                        >
                          {selectedInsumo.Estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer d-flex justify-content-center border-0 pt-0">
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

export default Insumos;