import { useState, useEffect } from "react";
import RolesForm from "./formularios_dash/RolesForm";
import {
  FaPlusCircle,
  FaEdit,
  FaTrash,
  FaSyncAlt,
} from "react-icons/fa";
import {
  getRoles,
  createRol,
  updateRol,
  deleteRol,
} from "../Services/api-roles/roles";
import Swal from "sweetalert2";

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [rolEdit, setRolEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Toast configuración
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getRoles();

      console.log("Respuesta de roles:", response);

      if (Array.isArray(response)) {
        setRoles(response);
      } else {
        setError("Error al cargar roles");
      }
    } catch (error) {
      console.error("Error al cargar roles:", error);
      setError("Error de conexión al servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (rolData) => {
    try {
      setLoading(true);
      let response;

      if (rolEdit) {
        // Actualizar rol existente
        response = await updateRol(rolEdit.RolID, rolData);
        
        if (response.estado) {
          // Actualizar el rol en el estado local
          setRoles((prevRoles) =>
            prevRoles.map((r) =>
              r.RolID === rolEdit.RolID ? { ...r, ...response.datos } : r
            )
          );

          Toast.fire({
            icon: "success",
            title: "Rol actualizado correctamente",
          });
        }
      } else {
        // Crear nuevo rol
        response = await createRol(rolData);
        
        if (response.estado) {
          // Agregar el nuevo rol al estado local
          setRoles((prevRoles) => [...prevRoles, response.datos]);

          Toast.fire({
            icon: "success",
            title: "Rol creado correctamente",
          });
        }
      }

      if (response.estado) {
        setShowForm(false);
        setRolEdit(null);
      } else {
        throw new Error(response.mensaje || "Error al guardar el rol");
      }
    } catch (error) {
      console.error("Error al guardar rol:", error);

      const mensaje =
        error.message ||
        error.response?.data?.mensaje ||
        "Error al guardar el rol";

      if (mensaje.toLowerCase().includes("ya existe")) {
        Swal.fire({
          icon: "warning",
          title: "Rol duplicado",
          text: mensaje,
          confirmButtonColor: "#f0ad4e",
        });
      } else if (mensaje.toLowerCase().includes("protegido")) {
        Swal.fire({
          icon: "warning",
          title: "Rol protegido",
          text: mensaje,
          confirmButtonColor: "#f0ad4e",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: mensaje,
          confirmButtonColor: "#d33",
        });
      }
      throw error; // Re-lanzar para que el formulario lo maneje
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rol) => {
    setRolEdit(rol);
    setShowForm(true);
  };

  const handleEliminar = async (id) => {
    // Encontrar el rol para mostrar su nombre
    const rol = roles.find((r) => r.RolID === id);
    const nombreRol = rol ? rol.Nombre : "este rol";

    try {
      const result = await Swal.fire({
        title: "¿Eliminar rol?",
        html: `¿Estás seguro de eliminar el rol <strong>"${nombreRol}"</strong>?<br><small>Esta acción no se puede revertir</small>`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });

      if (result.isConfirmed) {
        setLoading(true);
        const response = await deleteRol(id);

        if (response.estado) {
          // Eliminar del estado local
          setRoles((prevRoles) => prevRoles.filter((r) => r.RolID !== id));

          Toast.fire({
            icon: "success",
            title: "Rol eliminado correctamente",
          });
        } else {
          throw new Error(response.mensaje || "Error al eliminar el rol");
        }
      }
    } catch (error) {
      console.error("Error al eliminar rol:", error);

      const errorMsg =
        error.message ||
        error.response?.data?.mensaje ||
        "Error al eliminar el rol";

      if (
        errorMsg.toLowerCase().includes("protegido") ||
        errorMsg.toLowerCase().includes("no se puede eliminar") ||
        errorMsg.toLowerCase().includes("necesario")
      ) {
        Swal.fire({
          icon: "warning",
          title: "Rol Protegido",
          text: errorMsg,
          confirmButtonColor: "#f0ad4e",
        });
      } else if (errorMsg.toLowerCase().includes("usuario")) {
        Swal.fire({
          icon: "info",
          title: "Rol en uso",
          text: errorMsg,
          confirmButtonColor: "#0dcaf0",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMsg,
          confirmButtonColor: "#dc3545",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (rol) => {
    const nuevoEstado = !rol.Estado;
    const estadoTexto = nuevoEstado ? "Activo" : "Inactivo";

    try {
      const result = await Swal.fire({
        title: "¿Cambiar estado?",
        html: `¿Seguro que deseas cambiar el estado del rol <strong>"${rol.Nombre}"</strong> a <strong>${estadoTexto}</strong>?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, cambiar",
        cancelButtonText: "Cancelar",
      });

      if (result.isConfirmed) {
        setLoading(true);
        const rolActualizado = { ...rol, Estado: nuevoEstado };
        const response = await updateRol(rol.RolID, rolActualizado);

        if (response.estado) {
          // Actualizar el estado local
          setRoles((prevRoles) =>
            prevRoles.map((r) =>
              r.RolID === rol.RolID ? { ...r, Estado: nuevoEstado } : r
            )
          );

          Toast.fire({
            icon: "success",
            title: `Estado cambiado a ${estadoTexto}`,
          });
        } else {
          throw new Error(response.mensaje || "Error al cambiar el estado");
        }
      }
    } catch (error) {
      console.error("Error al cambiar estado:", error);

      const errorMsg =
        error.message ||
        error.response?.data?.mensaje ||
        "Error al cambiar el estado";

      if (
        errorMsg.toLowerCase().includes("protegido") ||
        errorMsg.toLowerCase().includes("no se puede")
      ) {
        Swal.fire({
          icon: "warning",
          title: "Rol Protegido",
          text: errorMsg,
          confirmButtonColor: "#f0ad4e",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMsg,
          confirmButtonColor: "#dc3545",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setRolEdit(null);
  };

  if (showForm) {
    return (
      <RolesForm
        onClose={handleCloseForm}
        onSave={handleSave}
        rolEdit={rolEdit}
        rolesExistentes={roles}
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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1
          className="fs-5 fw-bold mb-0 text-primary"
          style={{ letterSpacing: 1 }}
        >
          Gestión de Roles
        </h1>
        <button
          className="btn btn-sm btn-primary d-flex align-items-center gap-2 shadow-sm"
          onClick={() => {
            setRolEdit(null);
            setShowForm(true);
          }}
          disabled={loading}
        >
          <FaPlusCircle size={18} />
          Agregar Rol
        </button>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <div>
            {error}
            <button
              className="btn btn-sm btn-outline-danger ms-2"
              onClick={loadRoles}
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

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
                <th style={{ borderTopLeftRadius: 12, minWidth: 80 }}>ID</th>
                <th style={{ minWidth: 150 }}>Nombre</th>
                <th style={{ minWidth: 200 }}>Descripción</th>
                <th style={{ minWidth: 100 }}>Estado</th>
                <th style={{ width: 160, borderTopRightRadius: 12 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-5">
                    <div className="d-flex flex-column align-items-center">
                      <div
                        className="spinner-border spinner-border-sm text-primary mb-2"
                        role="status"
                      >
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                      <span className="text-muted">Cargando roles...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-danger">
                    <div className="d-flex flex-column align-items-center">
                      <span className="mb-2">❌ Error al cargar datos</span>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={loadRoles}
                      >
                        Reintentar
                      </button>
                    </div>
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5">
                    <div className="d-flex flex-column align-items-center text-muted">
                      <span className="mb-2">📝 No hay roles registrados</span>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          setRolEdit(null);
                          setShowForm(true);
                        }}
                      >
                        Crear primer rol
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                roles.map((r) => (
                  <tr key={r.RolID} style={{ borderBottom: "1px solid #e3e8ee" }}>
                    <td>
                      <span className="badge bg-light text-dark px-2 py-1 shadow-sm">
                        {r.RolID}
                      </span>
                    </td>
                    <td className="fw-medium">{r.Nombre}</td>
                    <td>
                      <small className="text-muted">
                        {r.Descripcion && r.Descripcion.length > 50
                          ? r.Descripcion.substring(0, 50) + "..."
                          : r.Descripcion}
                      </small>
                    </td>
                    <td>
                      <span
                        className={`badge px-2 py-1 shadow-sm ${
                          r.Estado ? "bg-success" : "bg-danger"
                        }`}
                      >
                        {r.Estado ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex justify-content-center gap-1">
                        <button
                          className="btn btn-outline-warning btn-sm rounded-circle"
                          title="Editar"
                          onClick={() => handleEdit(r)}
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm rounded-circle"
                          title="Eliminar"
                          onClick={() => handleEliminar(r.RolID)}
                        >
                          <FaTrash size={14} />
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm rounded-circle"
                          title="Cambiar estado"
                          onClick={() => handleCambiarEstado(r)}
                        >
                          <FaSyncAlt size={14} />
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
    </div>
  );
};

export default Roles;