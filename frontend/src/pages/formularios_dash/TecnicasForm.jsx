import { useState, useEffect } from "react";

const TecnicasForm = ({ onClose, onSave, tecnicaEdit = null }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    imagenTecnica: "",
    estado: true,
  });

  const [errors, setErrors] = useState({
    nombre: "",
    descripcion: "",
    imagenTecnica: "",
  });

  const [touched, setTouched] = useState({
    nombre: false,
    descripcion: false,
    imagenTecnica: false,
  });

  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    if (tecnicaEdit) {
      setFormData({
        nombre: tecnicaEdit.Nombre || "",
        descripcion: tecnicaEdit.Descripcion || "",
        imagenTecnica: tecnicaEdit.imagenTecnica || "",
        estado: tecnicaEdit.Estado !== undefined ? tecnicaEdit.Estado : true,
      });
    }
  }, [tecnicaEdit]);

  // ================= VALIDACIONES =================
  const validarNombre = (valor) => {
    const trimmed = valor.trim();
    
    if (!trimmed) {
      return "El nombre es obligatorio.";
    }
    
    if (trimmed.length < 4) {
      return "El nombre debe tener al menos 4 caracteres.";
    }
    
    if (trimmed.length > 40) {
      return "El nombre no puede superar 40 caracteres.";
    }
    
    // Solo letras, espacios, puntos y comas
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.,]+$/;
    if (!regex.test(trimmed)) {
      return "El nombre solo puede contener letras, espacios, puntos y comas.";
    }
    
    // Verificar que contenga al menos una letra
    const tieneLetras = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(trimmed);
    if (!tieneLetras) {
      return "El nombre debe contener al menos una letra.";
    }
    
    return "";
  };

  const validarDescripcion = (valor) => {
    if (!valor.trim()) {
      return "La descripción es obligatoria.";
    }
    if (valor.trim().length < 10) {
      return "La descripción debe tener al menos 10 caracteres.";
    }
    if (valor.trim().length > 200) {
      return "La descripción no puede superar 200 caracteres.";
    }
    return "";
  };

  const validarImagen = (valor) => {
    const trimmed = valor.trim();
    
    if (!trimmed) {
      return "La imagen es obligatoria.";
    }
    
    // Validar Base64
    const isBase64 = /^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);base64,/.test(trimmed);
    
    // Validar URL
    const isURL = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i.test(trimmed);
    
    // Validar ruta local
    const isLocalPath = /^[a-zA-Z0-9_\-\/\.]+\.(jpg|jpeg|png|gif|webp|svg)$/i.test(trimmed);
    
    if (!isBase64 && !isURL && !isLocalPath) {
      return "Debe ser una imagen Base64, URL válida o ruta de archivo.";
    }
    
    // Validar tamaño de Base64 (máximo ~5MB en Base64 = ~6.6MB en texto)
    if (isBase64 && trimmed.length > 7000000) {
      return "La imagen es demasiado grande. Máximo 5MB.";
    }
    
    return "";
  };

  // ================= EVENTOS =================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "estado" ? value === "true" : value,
    }));
    
    if (name === "imagenTecnica") {
      setPreviewError(false);
    }
    
    if (touched[name]) {
      validateField(name, value);
    }
  };

  // Manejar carga de archivo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        imagenTecnica: "Solo se permiten imágenes (JPG, PNG, GIF, WEBP, SVG)"
      }));
      return;
    }
    
    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        imagenTecnica: "La imagen no puede superar 5MB"
      }));
      return;
    }
    
    // Convertir a Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        imagenTecnica: reader.result
      }));
      setTouched(prev => ({ ...prev, imagenTecnica: true }));
      validateField("imagenTecnica", reader.result);
      setPreviewError(false);
    };
    reader.onerror = () => {
      setErrors(prev => ({
        ...prev,
        imagenTecnica: "Error al cargar la imagen"
      }));
    };
    reader.readAsDataURL(file);
  };

  const validateField = (fieldName, value) => {
    let error = "";
    switch (fieldName) {
      case "nombre":
        error = validarNombre(value);
        break;
      case "descripcion":
        error = validarDescripcion(value);
        break;
      case "imagenTecnica":
        error = validarImagen(value);
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [fieldName]: error }));
    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const validateForm = () => {
    const nombreError = validarNombre(formData.nombre);
    const descripcionError = validarDescripcion(formData.descripcion);
    const imagenError = validarImagen(formData.imagenTecnica);

    setErrors({ 
      nombre: nombreError, 
      descripcion: descripcionError, 
      imagenTecnica: imagenError 
    });
    
    setTouched({ 
      nombre: true, 
      descripcion: true, 
      imagenTecnica: true 
    });

    return !nombreError && !descripcionError && !imagenError;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const tecnicaData = {
      Nombre: formData.nombre.trim(),
      Descripcion: formData.descripcion.trim(),
      imagenTecnica: formData.imagenTecnica.trim(),
      Estado: formData.estado,
    };

    onSave(tecnicaData);
  };

  // Determinar si mostrar preview
  const shouldShowPreview = formData.imagenTecnica && 
                           !errors.imagenTecnica && 
                           !previewError;

  // ================= INTERFAZ =================
  return (
    <div className="container py-4">
      <div className="position-relative mb-4 text-center">
        <p className="fw-bold fs-3 mb-0">
          {tecnicaEdit ? "Editar Técnica" : "Crear Técnica"}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-danger btn-sm shadow-sm position-absolute top-0 end-0"
          title="Cerrar"
        >
          ✕
        </button>
      </div>

      <div 
        className="p-4 rounded shadow" 
        style={{ backgroundColor: "#f5f5fa" }}
      >
        <div className="row g-3">
          {/* NOMBRE */}
          <div className="col-md-12">
            <label className="form-label fw-bold">
              Nombre de la Técnica <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${touched.nombre && errors.nombre ? "is-invalid" : ""}`}
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Ej: Serigrafía, Bordado..."
              maxLength={40}
            />
            {touched.nombre && errors.nombre && (
              <div className="invalid-feedback d-block">{errors.nombre}</div>
            )}
          </div>

          {/* DESCRIPCIÓN */}
          <div className="col-md-12">
            <label className="form-label fw-bold">
              Descripción <span className="text-danger">*</span>
            </label>
            <textarea
              className={`form-control ${touched.descripcion && errors.descripcion ? "is-invalid" : ""}`}
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Describa la técnica de estampado (mínimo 10 caracteres)"
              rows="4"
              maxLength={200}
            />
            {touched.descripcion && errors.descripcion && (
              <div className="invalid-feedback d-block">{errors.descripcion}</div>
            )}
          </div>

          {/* IMAGEN - SUBIR ARCHIVO */}
          <div className="col-md-12">
            <label className="form-label fw-bold">
              Cargar Imagen <span className="text-danger">*</span>
            </label>
            <input
              type="file"
              className="form-control"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
              onChange={handleFileChange}
            />
            <small className="text-muted d-block mt-2 ms-1">
              Formatos: JPG, PNG, GIF, WEBP, SVG. Tamaño máximo: 5MB
            </small>
          </div>

          {/* IMAGEN - URL O BASE64 MANUAL */}
          <div className="col-md-12">
            <label className="form-label fw-bold">
              O pegar URL/Base64
            </label>
            <textarea
              className={`form-control ${touched.imagenTecnica && errors.imagenTecnica ? "is-invalid" : ""}`}
              name="imagenTecnica"
              value={formData.imagenTecnica}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="https://ejemplo.com/imagen.png o data:image/jpeg;base64,..."
              rows="3"
              style={{ fontSize: "0.85rem" }}
            />
            {touched.imagenTecnica && errors.imagenTecnica && (
              <div className="invalid-feedback d-block">{errors.imagenTecnica}</div>
            )}
          </div>

          {/* PREVIEW DE IMAGEN */}
          {shouldShowPreview && (
            <div className="col-md-12">
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <small>Vista Previa</small>
                </div>
                <div className="card-body text-center">
                  <img
                    src={formData.imagenTecnica}
                    alt="Preview"
                    className="img-fluid rounded shadow-sm"
                    style={{ maxHeight: "250px", objectFit: "contain" }}
                    onError={() => {
                      setPreviewError(true);
                      setErrors(prev => ({
                        ...prev,
                        imagenTecnica: "No se pudo cargar la imagen. Verifica el formato."
                      }));
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ESTADO */}
          <div className="col-md-6">
            <label className="form-label fw-bold">Estado</label>
            <select 
              className="form-select" 
              name="estado" 
              value={formData.estado.toString()} 
              onChange={handleChange}
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>
        </div>

        {/* BOTONES */}
        <div className="d-flex justify-content-center gap-3 mt-4">
          <button 
            type="button" 
            className="btn btn-success px-4"
            onClick={handleSubmit}
          >
            {tecnicaEdit ? "Actualizar Técnica" : "Crear Técnica"}
          </button>
          <button type="button" className="btn btn-secondary px-4" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TecnicasForm;