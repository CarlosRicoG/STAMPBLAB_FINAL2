import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import Swal from "sweetalert2";

/* ── Tokens de color (mismos que AgregarProducto) ── */
const C = {
  navy: "#1a2540",
  navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
  accent: "#4f8ef7",
  accentSoft: "#f0f4ff",
  accentBorder: "#c7d9ff",
  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  muted: "#64748b",
  border: "#e2e8f0",
  bg: "#f8fafc",
};

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

  const validarNombre = (nombre) => {
    if (!nombre || nombre.trim().length === 0) return "El nombre del rol es obligatorio";
    const nombreTrim = nombre.trim();
    if (nombreTrim.length < 3) return "El nombre debe tener al menos 3 caracteres";
    if (nombreTrim.length > 40) return "El nombre no puede tener más de 40 caracteres";
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-_]+$/.test(nombreTrim))
      return "Solo se permiten letras, números, espacios, guiones y guiones bajos";
    if (!rolEdit || nombreTrim.toLowerCase() !== rolEdit.Nombre.toLowerCase()) {
      const existe = rolesExistentes.some(
        (r) => r.Nombre.toLowerCase() === nombreTrim.toLowerCase()
      );
      if (existe) return `Ya existe un rol con el nombre "${nombreTrim}"`;
    }
    const nombresProtegidos = ["administrador", "cliente"];
    if (!rolEdit && nombresProtegidos.includes(nombreTrim.toLowerCase()))
      return `El nombre "${nombreTrim}" está reservado por el sistema`;
    return "";
  };

  const validarDescripcion = (descripcion) => {
    if (!descripcion || descripcion.trim().length === 0) return "La descripción es obligatoria";
    if (descripcion.trim().length > 100) return "La descripción no puede tener más de 100 caracteres";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (esRolProtegido && (name === "nombre" || name === "estado")) return;
    const newValue = name === "estado" ? value === "true" : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    let error = "";
    if (name === "nombre") error = validarNombre(value);
    else if (name === "descripcion") error = validarDescripcion(value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const erroresValidacion = {
      nombre: esRolProtegido ? "" : validarNombre(formData.nombre),
      descripcion: validarDescripcion(formData.descripcion),
    };
    const erroresActivos = Object.entries(erroresValidacion)
      .filter(([_, valor]) => valor !== "")
      .reduce((acc, [clave, valor]) => ({ ...acc, [clave]: valor }), {});

    if (Object.keys(erroresActivos).length > 0) {
      setErrors(erroresActivos);
      Swal.fire({
        icon: "error",
        title: "Errores en el formulario",
        text: "Por favor corrige los errores antes de continuar",
        confirmButtonColor: C.danger,
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
    }
  };

  const tieneErrores = Object.values(errors).some((error) => error !== "");

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="container py-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <div className="position-relative mb-4 text-center">
          <p className="fw-bold fs-3 mb-0" style={{ color: C.navy }}>
            {rolEdit ? "Editar Rol" : "Crear Rol"}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm shadow-sm position-absolute top-0 end-0"
            style={{ background: C.danger, color: "#fff", border: "none" }}
            title="Cerrar"
          >
            <FaTimes />
          </button>
        </div>

        {esRolProtegido && (
          <div className="alert" role="alert"
            style={{ background: C.accentSoft, border: `1.5px solid ${C.accentBorder}`, color: C.accent, borderRadius: 8 }}>
            Solo puedes editar la descripción de "{formData.nombre}". El nombre y estado están protegidos y no pueden modificarse.
          </div>
        )}

        <form
          className="p-4 rounded shadow"
          style={{ backgroundColor: C.bg, color: "#2a273a", fontFamily: "'Outfit', sans-serif" }}
          onSubmit={handleSubmit}
        >
          <div className="row g-3">

            {/* Nombre del rol */}
            <div className="col-md-12">
              <label className="form-label fw-bold" style={{ color: C.navy }}>
                Nombre del Rol <span style={{ color: C.danger }}>*</span>
              </label>
              <input
                type="text"
                className={`form-control ${esRolProtegido ? "bg-light" : ""} ${errors.nombre ? "is-invalid" : ""}`}
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ingrese el nombre del rol"
                maxLength="40"
                required
                disabled={esRolProtegido}
                readOnly={esRolProtegido}
                title={esRolProtegido ? "No se puede modificar el nombre de este rol del sistema" : ""}
              />
              {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
              {!esRolProtegido && !errors.nombre && (
                <small style={{ color: C.muted }}>
                  3-40 caracteres. Solo letras, números, espacios, guiones y guiones bajos.
                </small>
              )}
              {esRolProtegido && <small style={{ color: C.muted }}>Este campo no puede ser modificado.</small>}
            </div>

            {/* Descripción */}
            <div className="col-md-12">
              <label className="form-label fw-bold" style={{ color: C.navy }}>
                Descripción <span style={{ color: C.danger }}>*</span>
              </label>
              <textarea
                className={`form-control ${errors.descripcion ? "is-invalid" : ""}`}
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Describa las funciones y permisos del rol"
                rows="4"
                maxLength="100"
                required
              />
              {errors.descripcion && <div className="invalid-feedback">{errors.descripcion}</div>}
              {!errors.descripcion && (
                <small style={{ color: C.muted }}>
                  10-100 caracteres. {formData.descripcion.length}/100
                </small>
              )}
            </div>

            {/* Estado */}
            <div className="col-md-6">
              <label className="form-label fw-bold" style={{ color: C.navy }}>Estado</label>
              <select
                className={`form-select ${esRolProtegido ? "bg-light" : ""}`}
                name="estado"
                value={formData.estado.toString()}
                onChange={handleChange}
                disabled={esRolProtegido}
                title={esRolProtegido ? "No se puede modificar el estado de este rol del sistema" : ""}
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
              {esRolProtegido && <small style={{ color: C.muted }}>Este campo no puede ser modificado.</small>}
            </div>
          </div>

          {/* Botones */}
          <div className="d-flex justify-content-center gap-3 mt-4">
            <button
              type="submit"
              className="btn px-4"
              disabled={tieneErrores}
              style={{ background: C.navy, color: "#fff", border: "none", fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}
            >
              {rolEdit ? "Actualizar Rol" : "Crear Rol"}
            </button>
            <button
              type="button"
              className="btn px-4"
              onClick={onClose}
              style={{ background: "#f1f5f9", color: C.muted, border: "none", fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default RolesForm;