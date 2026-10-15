// src/pages/formularios_dash/usuariosForm.jsx
import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import Swal from "sweetalert2";
import { createUsuario, updateUsuario, getRoles } from "../../Services/api-usuarios/usuarios";

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

const UsuariosForm = ({ onClose, onSave, usuario = null }) => {
  const [formData, setFormData] = useState({
    DocumentoID: "",
    Nombre: "",
    Correo: "",
    Direccion: "",
    Telefono: "",
    Contraseña: "",
    RolID: "",
  });

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => { loadRoles(); }, []);

  useEffect(() => {
    if (usuario) {
      setFormData({
        DocumentoID: usuario.DocumentoID ? usuario.DocumentoID.toString() : "",
        Nombre: usuario.Nombre || "",
        Correo: usuario.Correo || "",
        Direccion: usuario.Direccion || "",
        Telefono: usuario.Telefono || "",
        Contraseña: "",
        RolID: usuario.RolID ? usuario.RolID.toString() : "",
      });
    }
  }, [usuario]);

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const result = await getRoles();
      if (result.estado && Array.isArray(result.datos)) {
        setRoles(result.datos.map(rol => ({ ...rol, RolID: rol.RolID.toString() })));
      } else setRoles([]);
    } catch (error) {
      console.error("Error al cargar roles:", error);
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  const validarDocumento = (documento) => {
    const doc = String(documento || "").trim();
    if (!doc) return "El documento es obligatorio";
    if (!/^\d+$/.test(doc)) return "Solo números";
    if (doc.length < 7 || doc.length > 10) return "Entre 7 y 10 dígitos";
    return "";
  };

  const validarNombre = (nombre) => {
    const nom = String(nombre || "").trim();
    if (!nom) return "El nombre es obligatorio";
    if (nom.length < 3 || nom.length > 50) return "Entre 3 y 50 caracteres";
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñüÜ\s]+$/.test(nom)) return "Solo letras y espacios";
    return "";
  };

  const validarCorreo = (correo) => {
    const cor = String(correo || "").trim();
    if (!cor) return "El correo es obligatorio";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cor)) return "Correo inválido";
    return "";
  };

  const validarTelefono = (telefono) => {
    const tel = String(telefono || "").trim();
    if (!tel) return "El teléfono es obligatorio";
    if (!/^\d+$/.test(tel)) return "Solo números";
    if (tel.length < 7 || tel.length > 10) return "Entre 7 y 10 dígitos";
    return "";
  };

  const validarDireccion = (direccion) => {
    const dir = String(direccion || "").trim();
    if (!dir) return "La dirección es obligatoria";
    if (dir.length > 255) return "Máximo 255 caracteres";
    return "";
  };

  const validarContraseña = (contraseña, esEdicion) => {
    if (esEdicion && !contraseña) return "";
    const pass = String(contraseña || "");
    if (!pass) return "La contraseña es obligatoria";
    if (pass.length < 4) return "Mínimo 4 caracteres";
    if (pass.length > 50) return "Máximo 50 caracteres";
    return "";
  };

  const validarRol = (rolID) => {
    if (!rolID || rolID === "") return "Debe seleccionar un rol";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    let error = "";
    switch (name) {
      case "DocumentoID": error = validarDocumento(value); break;
      case "Nombre": error = validarNombre(value); break;
      case "Correo": error = validarCorreo(value); break;
      case "Telefono": error = validarTelefono(value); break;
      case "Direccion": error = validarDireccion(value); break;
      case "Contraseña": error = validarContraseña(value, !!usuario); break;
      case "RolID": error = validarRol(value); break;
      default: break;
    }
    setErrors({ ...errors, [name]: error });
  };

  const validateForm = () => {
    const newErrors = {
      DocumentoID: validarDocumento(formData.DocumentoID),
      Nombre: validarNombre(formData.Nombre),
      Correo: validarCorreo(formData.Correo),
      Telefono: validarTelefono(formData.Telefono),
      Direccion: validarDireccion(formData.Direccion),
      Contraseña: validarContraseña(formData.Contraseña, !!usuario),
      RolID: validarRol(formData.RolID),
    };
    const filteredErrors = {};
    Object.keys(newErrors).forEach(key => { if (newErrors[key]) filteredErrors[key] = newErrors[key]; });
    return filteredErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      Swal.fire({ icon: "error", title: "Errores en el formulario", text: "Por favor corrija los errores antes de continuar", confirmButtonColor: C.danger });
      return;
    }
    setLoading(true); setErrors({});
    try {
      const dataToSend = {
        DocumentoID: String(formData.DocumentoID).trim(),
        Nombre: String(formData.Nombre).trim(),
        Correo: String(formData.Correo).trim(),
        Telefono: String(formData.Telefono).trim(),
        Direccion: String(formData.Direccion).trim(),
        RolID: String(formData.RolID).trim(),
      };
      if (usuario) { if (formData.Contraseña && formData.Contraseña.trim()) dataToSend.Contraseña = String(formData.Contraseña).trim(); }
      else dataToSend.Contraseña = String(formData.Contraseña).trim();

      let result;
      if (usuario) result = await updateUsuario(usuario.DocumentoID, dataToSend);
      else result = await createUsuario(dataToSend);

      if (result.estado) {
        Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 3000, timerProgressBar: true })
          .fire({ icon: "success", title: usuario ? "Usuario actualizado correctamente" : "Usuario creado correctamente" });
        onSave();
      } else throw new Error(result.mensaje || "Error al guardar usuario");
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      Swal.fire({ icon: "error", title: "Error", text: error.response?.data?.mensaje || error.message || "Error al guardar el usuario", confirmButtonColor: C.danger });
    } finally {
      setLoading(false);
    }
  };

  const tieneErrores = Object.values(errors).some(error => error !== "");

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="card shadow-sm border-0 p-4 mx-4" style={{ fontFamily: "'Outfit', sans-serif", background: C.bg }}>
        <div className="position-relative mb-4 text-center">
          <p className="fw-bold fs-3 mb-0" style={{ color: C.navy }}>
            {usuario ? "Editar Usuario" : "Crear Usuario"}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm shadow-sm position-absolute top-0 end-0"
            style={{ background: C.danger, color: "#fff", border: "none" }}
            disabled={loading}
          >
            <FaTimes />
          </button>
        </div>

        <form className="row g-3" onSubmit={handleSubmit}>
          <div className="col-md-6">
            <label className="form-label fw-bold" style={{ color: C.navy }}>Documento</label>
            <input
              type="text"
              className={`form-control ${errors.DocumentoID ? "is-invalid" : ""}`}
              name="DocumentoID"
              value={formData.DocumentoID}
              onChange={handleChange}
              disabled={loading || !!usuario}
              readOnly={!!usuario}
              required
            />
            {errors.DocumentoID && <div className="invalid-feedback">{errors.DocumentoID}</div>}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold" style={{ color: C.navy }}>Nombre Completo</label>
            <input
              type="text"
              className={`form-control ${errors.Nombre ? "is-invalid" : ""}`}
              name="Nombre"
              value={formData.Nombre}
              onChange={handleChange}
              disabled={loading}
              required
            />
            {errors.Nombre && <div className="invalid-feedback">{errors.Nombre}</div>}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold" style={{ color: C.navy }}>Correo Electrónico</label>
            <input
              type="email"
              className={`form-control ${errors.Correo ? "is-invalid" : ""}`}
              name="Correo"
              value={formData.Correo}
              onChange={handleChange}
              disabled={loading}
              required
            />
            {errors.Correo && <div className="invalid-feedback">{errors.Correo}</div>}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold" style={{ color: C.navy }}>Teléfono</label>
            <input
              type="text"
              className={`form-control ${errors.Telefono ? "is-invalid" : ""}`}
              name="Telefono"
              value={formData.Telefono}
              onChange={handleChange}
              disabled={loading}
              required
            />
            {errors.Telefono && <div className="invalid-feedback">{errors.Telefono}</div>}
          </div>

          <div className="col-12">
            <label className="form-label fw-bold" style={{ color: C.navy }}>Dirección</label>
            <input
              type="text"
              className={`form-control ${errors.Direccion ? "is-invalid" : ""}`}
              name="Direccion"
              value={formData.Direccion}
              onChange={handleChange}
              disabled={loading}
              required
            />
            {errors.Direccion && <div className="invalid-feedback">{errors.Direccion}</div>}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold" style={{ color: C.navy }}>
              Contraseña
              {usuario && <small style={{ color: C.muted }}> (opcional)</small>}
            </label>
            <input
              type="password"
              className={`form-control ${errors.Contraseña ? "is-invalid" : ""}`}
              name="Contraseña"
              value={formData.Contraseña}
              onChange={handleChange}
              disabled={loading}
              required={!usuario}
            />
            {errors.Contraseña && <div className="invalid-feedback">{errors.Contraseña}</div>}
            <small style={{ color: C.muted }}>Mínimo 4 caracteres</small>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold" style={{ color: C.navy }}>Rol</label>
            <select
              className={`form-select ${errors.RolID ? "is-invalid" : ""}`}
              name="RolID"
              value={formData.RolID}
              onChange={handleChange}
              disabled={loading || loadingRoles}
              required
            >
              <option value="">{loadingRoles ? "Cargando..." : "Seleccione un rol"}</option>
              {roles.map((rol) => (
                <option key={rol.RolID} value={rol.RolID}>{rol.Nombre}</option>
              ))}
            </select>
            {errors.RolID && <div className="invalid-feedback">{errors.RolID}</div>}
          </div>

          <div className="col-12 d-flex justify-content-center gap-2">
            <button
              type="submit"
              className="btn shadow-sm"
              disabled={loading || loadingRoles || tieneErrores}
              style={{ background: C.navy, color: "#fff", border: "none", fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" role="status"></span>{usuario ? "Actualizando..." : "Guardando..."}</>
              ) : (
                usuario ? "Actualizar" : "Guardar"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn shadow-sm"
              disabled={loading}
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

export default UsuariosForm;