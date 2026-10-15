// src/pages/formularios_dash/TecnicasForm.jsx
import { useState, useEffect } from "react";
import Swal from "sweetalert2";

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

const TecnicasForm = ({ onClose, onSave, tecnicaEdit = null, tecnicasExistentes = [], saving = false }) => {
  const [formData, setFormData] = useState({ nombre: "", descripcion: "", imagenTecnica: "", estado: true });
  const [errors, setErrors]   = useState({ nombre: "", descripcion: "", imagenTecnica: "" });
  const [touched, setTouched] = useState({ nombre: false, descripcion: false, imagenTecnica: false });
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    if (tecnicaEdit) {
      setFormData({
        nombre:        tecnicaEdit.Nombre        || "",
        descripcion:   tecnicaEdit.Descripcion   || "",
        imagenTecnica: tecnicaEdit.imagenTecnica || "",
        estado:        tecnicaEdit.Estado !== undefined ? tecnicaEdit.Estado : true,
      });
    }
  }, [tecnicaEdit]);

  const validarNombre = (valor) => {
    const trimmed = valor.trim();
    if (!trimmed) return "El nombre es obligatorio.";
    if (trimmed.length < 4)  return "El nombre debe tener al menos 4 caracteres.";
    if (trimmed.length > 40) return "El nombre no puede superar 40 caracteres.";
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.,]+$/.test(trimmed)) return "Solo letras, espacios, puntos y comas.";
    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(trimmed)) return "Debe contener al menos una letra.";
    const dup = tecnicasExistentes.some(t =>
      t.Nombre.toLowerCase().trim() === trimmed.toLowerCase() && t.TecnicaID !== tecnicaEdit?.TecnicaID
    );
    if (dup) return "Ya existe una técnica con este nombre.";
    return "";
  };

  const validarDescripcion = (valor) => {
    if (!valor.trim())             return "La descripción es obligatoria.";
    if (valor.trim().length < 10)  return "Mínimo 10 caracteres.";
    if (valor.trim().length > 200) return "Máximo 200 caracteres.";
    return "";
  };

  const validarImagen = (valor) => {
    const trimmed = valor.trim();
    if (!trimmed) return "La imagen es obligatoria.";
    const isBase64    = /^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);base64,/.test(trimmed);
    const isURL       = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i.test(trimmed);
    const isLocalPath = /^[a-zA-Z0-9_\-/.]+\.(jpg|jpeg|png|gif|webp|svg)$/i.test(trimmed);
    if (!isBase64 && !isURL && !isLocalPath) return "Debe ser Base64, URL válida o ruta de archivo.";
    if (isBase64 && trimmed.length > 7000000) return "Imagen demasiado grande. Máximo 5MB.";
    return "";
  };

  const validateField = (fieldName, value) => {
    let error = "";
    if (fieldName === "nombre")        error = validarNombre(value);
    if (fieldName === "descripcion")   error = validarDescripcion(value);
    if (fieldName === "imagenTecnica") error = validarImagen(value);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === "estado" ? value === "true" : value }));
    if (name === "imagenTecnica") setPreviewError(false);
    if (touched[name]) validateField(name, value);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ["image/jpeg","image/jpg","image/png","image/gif","image/webp","image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, imagenTecnica: "Solo JPG, PNG, GIF, WEBP, SVG" })); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, imagenTecnica: "Máximo 5MB" })); return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, imagenTecnica: reader.result }));
      setTouched(prev => ({ ...prev, imagenTecnica: true }));
      validateField("imagenTecnica", reader.result);
      setPreviewError(false);
    };
    reader.onerror = () => setErrors(prev => ({ ...prev, imagenTecnica: "Error al cargar la imagen" }));
    reader.readAsDataURL(file);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const validateForm = () => {
    const ne = validarNombre(formData.nombre);
    const de = validarDescripcion(formData.descripcion);
    const ie = validarImagen(formData.imagenTecnica);
    setErrors({ nombre: ne, descripcion: de, imagenTecnica: ie });
    setTouched({ nombre: true, descripcion: true, imagenTecnica: true });
    return !ne && !de && !ie;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    await onSave({
      Nombre:        formData.nombre.trim(),
      Descripcion:   formData.descripcion.trim(),
      imagenTecnica: formData.imagenTecnica.trim(),
      Estado:        formData.estado,
    });
  };

  const shouldShowPreview = formData.imagenTecnica && !errors.imagenTecnica && !previewError;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="container py-4" style={{ fontFamily: "'Outfit', sans-serif" }}>

        <div className="position-relative mb-4 text-center">
          <p className="fw-bold fs-3 mb-0" style={{ color: C.navy }}>
            {tecnicaEdit ? "Editar Técnica" : "Crear Técnica"}
          </p>
          <button type="button" onClick={onClose} disabled={saving}
            className="btn btn-sm shadow-sm position-absolute top-0 end-0"
            style={{ background: C.danger, color: "#fff", border: "none" }}>✕</button>
        </div>

        <div className="p-4 rounded shadow" style={{ backgroundColor: C.bg }}>
          <div className="row g-3">

            <div className="col-md-12">
              <label className="form-label fw-bold" style={{ color: C.navy }}>Nombre <span style={{ color: C.danger }}>*</span></label>
              <input type="text" className={`form-control ${touched.nombre && errors.nombre ? "is-invalid" : ""}`}
                name="nombre" value={formData.nombre} onChange={handleChange} onBlur={handleBlur}
                placeholder="Ej: Serigrafía, Bordado..." maxLength={40} />
              {touched.nombre && errors.nombre && <div className="invalid-feedback d-block">{errors.nombre}</div>}
            </div>

            <div className="col-md-12">
              <label className="form-label fw-bold" style={{ color: C.navy }}>Descripción <span style={{ color: C.danger }}>*</span></label>
              <textarea className={`form-control ${touched.descripcion && errors.descripcion ? "is-invalid" : ""}`}
                name="descripcion" value={formData.descripcion} onChange={handleChange} onBlur={handleBlur}
                placeholder="Describa la técnica (mínimo 10 caracteres)" rows="4" maxLength={200} />
              {touched.descripcion && errors.descripcion && <div className="invalid-feedback d-block">{errors.descripcion}</div>}
            </div>

            <div className="col-md-12">
              <label className="form-label fw-bold" style={{ color: C.navy }}>Cargar Imagen <span style={{ color: C.danger }}>*</span></label>
              <input type="file" className="form-control"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                onChange={handleFileChange} />
              <small style={{ color: C.muted }} className="d-block mt-2 ms-1">JPG, PNG, GIF, WEBP, SVG · Máx 5MB</small>
              {touched.imagenTecnica && errors.imagenTecnica && <div className="invalid-feedback d-block">{errors.imagenTecnica}</div>}
            </div>

            {shouldShowPreview && (
              <div className="col-md-12">
                <div className="card" style={{ border: `1.5px solid ${C.accentBorder}` }}>
                  <div className="card-header text-white" style={{ background: C.navyGrad }}><small>Vista Previa</small></div>
                  <div className="card-body text-center">
                    <img src={formData.imagenTecnica} alt="Preview"
                      className="img-fluid rounded shadow-sm" style={{ maxHeight: "250px", objectFit: "contain" }}
                      onError={() => { setPreviewError(true); setErrors(prev => ({ ...prev, imagenTecnica: "No se pudo cargar la imagen." })); }} />
                  </div>
                </div>
              </div>
            )}

            <div className="col-md-6">
              <label className="form-label fw-bold" style={{ color: C.navy }}>Estado</label>
              <select className="form-select" name="estado" value={formData.estado.toString()} onChange={handleChange}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="d-flex justify-content-center gap-3 mt-4">
            <button type="button" onClick={handleSubmit} disabled={saving}
              style={{ background: saving ? C.muted : C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
              {saving
                ? <><span className="spinner-border spinner-border-sm" role="status" /> Guardando...</>
                : tecnicaEdit ? "Actualizar Técnica" : "Crear Técnica"
              }
            </button>
            <button type="button" onClick={onClose} disabled={saving}
              style={{ background: "#f1f5f9", color: C.muted, border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif" }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TecnicasForm;