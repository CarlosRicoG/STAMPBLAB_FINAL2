import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import Swal from "sweetalert2";

const RolesForm = ({ onClose, onSave, rolEdit = null, rolesExistentes = [] }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    estado: true,
  });

  const [errors, setErrors] = useState({});
  const [esRolProtegido, setEsRolProtegido] = useState(false);

  useEffect(() => {
    if (rolEdit) {
      const nombreRol = rolEdit.Nombre || "";
      const esProtegido =
        nombreRol.toLowerCase() === "administrador" ||
        nombreRol.toLowerCase() === "cliente";

      setEsRolProtegido(esProtegido);

      setFormData({
        nombre: nombreRol,
        descripcion: rolEdit.Descripcion || "",
        estado: rolEdit.Estado !== undefined ? rolEdit.Estado : true,
      });
    } else {
      setEsRolProtegido(false);
      setFormData({ nombre: "", descripcion: "", estado: true });
    }
  }, [rolEdit]);

  // Validaciones en tiempo real
  const validarNombre = (nombre) => {
    if (!nombre || nombre.trim().length === 0) {
      return "El nombre del rol es obligatorio";
    }

    const nombreTrim = nombre.trim();

    if (nombreTrim.length < 3) {
      return "El nombre debe tener al menos 3 caracteres";
    }

    if (nombreTrim.length > 40) {
      return "El nombre no puede tener más de 40 caracteres";
    }

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-_]+$/.test(nombreTrim)) {
      return "Solo se permiten letras, números, espacios, guiones y guiones bajos";
    }

    // Verificar si ya existe (solo al crear o si cambió el nombre)
    if (!rolEdit || nombreTrim.toLowerCase() !== rolEdit.Nombre.toLowerCase()) {
      const existe = rolesExistentes.some(
        (r) => r.Nombre.toLowerCase() === nombreTrim.toLowerCase()
      );
      if (existe) {
        return `Ya existe un rol con el nombre "${nombreTrim}"`;
      }
    }

    // Verificar si es un nombre protegido (solo al crear o cambiar nombre)
    const nombresProtegidos = ["administrador", "cliente"];
    if (
      !rolEdit &&
      nombresProtegidos.includes(nombreTrim.toLowerCase())
    ) {
      return `El nombre "${nombreTrim}" está reservado por el sistema`;
    }

    return "";
  };

  const validarDescripcion = (descripcion) => {
    if (!descripcion || descripcion.trim().length === 0) {
      return "La descripción es obligatoria";
    }

    const descripcionTrim = descripcion.trim();

    if (descripcionTrim.length < 10) {
      return "La descripción debe tener al menos 10 caracteres";
    }

    if (descripcionTrim.length > 100) {
      return "La descripción no puede tener más de 100 caracteres";
    }

    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Si es rol protegido, no permitir cambiar nombre ni estado
    if (esRolProtegido && (name === "nombre" || name === "estado")) {
      return;
    }

    const newValue = name === "estado" ? value === "true" : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Validar en tiempo real
    let error = "";
    if (name === "nombre") {
      error = validarNombre(value);
    } else if (name === "descripcion") {
      error = validarDescripcion(value);
    }

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar todos los campos
    const erroresValidacion = {
      nombre: esRolProtegido ? "" : validarNombre(formData.nombre),
      descripcion: validarDescripcion(formData.descripcion),
    };

    // Filtrar errores vacíos
    const erroresActivos = Object.entries(erroresValidacion)
      .filter(([_, valor]) => valor !== "")
      .reduce((acc, [clave, valor]) => ({ ...acc, [clave]: valor }), {});

    if (Object.keys(erroresActivos).length > 0) {
      setErrors(erroresActivos);
      Swal.fire({
        icon: "error",
        title: "Errores en el formulario",
        text: "Por favor corrige los errores antes de continuar",
        confirmButtonColor: "#dc3545",
      });
      return;
    }

    const rolData = {
      Nombre: formData.nombre.trim(),
      Descripcion: formData.descripcion.trim(),
      Estado: formData.estado,
      ...(rolEdit && { RolID: rolEdit.RolID }),
    };

    try {
      await onSave(rolData);
      onClose();
    } catch (error) {
      console.error("Error al guardar el rol:", error);
      // El error ya se maneja en el componente padre
    }
  };

  const tieneErrores = Object.values(errors).some((error) => error !== "");

  return (
    <div className="container py-4">
      <div className="position-relative mb-4 text-center">
        <p className="fw-bold fs-3 mb-0">
          {rolEdit ? "Editar Rol" : "Crear Rol"}
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

      {esRolProtegido && (
        <div className="alert alert-info" role="alert">
          Solo puedes editar la descripción
          de "{formData.nombre}". El nombre y estado están protegidos y no pueden
          modificarse.
        </div>
      )}

      <form
        className="p-4 rounded shadow"
        style={{ backgroundColor: "#f5f5fa", color: "#2a273a" }}
        onSubmit={handleSubmit}
      >
        <div className="row g-3">
          {/* Nombre del rol */}
          <div className="col-md-12">
            <label className="form-label fw-bold">
              Nombre del Rol <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${
                esRolProtegido ? "bg-light" : ""
              } ${errors.nombre ? "is-invalid" : ""}`}
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ingrese el nombre del rol"
              maxLength="40"
              required
              disabled={esRolProtegido}
              readOnly={esRolProtegido}
              title={
                esRolProtegido
                  ? "No se puede modificar el nombre de este rol del sistema"
                  : ""
              }
            />
            {errors.nombre && (
              <div className="invalid-feedback">{errors.nombre}</div>
            )}
            {!esRolProtegido && !errors.nombre && (
              <small className="text-muted">
                3-40 caracteres. Solo letras, números, espacios, guiones y guiones
                bajos.
              </small>
            )}
            {esRolProtegido && (
              <small className="text-muted">
                Este campo no puede ser modificado.
              </small>
            )}
          </div>

          {/* Descripción */}
          <div className="col-md-12">
            <label className="form-label fw-bold">
              Descripción <span className="text-danger">*</span>
            </label>
            <textarea
              className={`form-control ${
                errors.descripcion ? "is-invalid" : ""
              }`}
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Describa las funciones y permisos del rol"
              rows="4"
              maxLength="100"
              required
            />
            {errors.descripcion && (
              <div className="invalid-feedback">{errors.descripcion}</div>
            )}
            {!errors.descripcion && (
              <small className="text-muted">
                10-100 caracteres. {formData.descripcion.length}/100
              </small>
            )}
          </div>

          {/* Estado */}
          <div className="col-md-6">
            <label className="form-label fw-bold">Estado</label>
            <select
              className={`form-select ${esRolProtegido ? "bg-light" : ""}`}
              name="estado"
              value={formData.estado.toString()}
              onChange={handleChange}
              disabled={esRolProtegido}
              title={
                esRolProtegido
                  ? "No se puede modificar el estado de este rol del sistema"
                  : ""
              }
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
            {esRolProtegido && (
              <small className="text-muted">
                Este campo no puede ser modificado.
              </small>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="d-flex justify-content-center gap-3 mt-4">
          <button
            type="submit"
            className="btn btn-success px-4"
            disabled={tieneErrores}
          >
            {rolEdit ? "Actualizar Rol" : "Crear Rol"}
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
    </div>
  );
};

export default RolesForm;