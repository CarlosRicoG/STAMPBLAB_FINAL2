import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";

const InsumoForm = ({ onClose, onSave, insumoEdit = null }) => {
  // ==========================
  // ESTADOS DEL FORMULARIO
  // ==========================
  const [formData, setFormData] = useState({
    nombre: "",
    stock: "",
    tipo: "Otro",
    precioTela: "",
    estado: true,
  });

  const [errors, setErrors] = useState({
    nombre: "",
    stock: "",
    tipo: "",
    precioTela: "",
  });

  const [touched, setTouched] = useState({
    nombre: false,
    stock: false,
    tipo: false,
    precioTela: false,
  });

  // ==========================
  //  CARGAR DATOS AL EDITAR
  // ==========================
  useEffect(() => {
    if (insumoEdit) {
      setFormData({
        nombre: insumoEdit.Nombre || "",
        stock: insumoEdit.Stock?.toString() || "",
        tipo: insumoEdit.Tipo || "Otro",
        precioTela: insumoEdit.PrecioTela?.toString() || "",
        estado: insumoEdit.Estado !== undefined ? insumoEdit.Estado : true,
      });
    } else {
      setFormData({
        nombre: "",
        stock: "",
        tipo: "Otro",
        precioTela: "",
        estado: true,
      });
    }

    setErrors({ nombre: "", stock: "", tipo: "", precioTela: "" });
    setTouched({ nombre: false, stock: false, tipo: false, precioTela: false });
  }, [insumoEdit]);

  // ==========================
  // ✅ VALIDACIONES
  // ==========================
  const validateNombre = (value) => {
    const nombre = value.trim();

    if (!nombre) return "El nombre es obligatorio";
    if (nombre.length < 4) return "El nombre debe tener al menos 4 caracteres";
    if (nombre.length > 50) return "El nombre no puede exceder 50 caracteres";
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-_]+$/.test(nombre))
      return "Solo se permiten letras, números, espacios, guiones y guiones bajos";
    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(nombre))
      return "No se permiten números solamente, debe contener letras";

    return "";
  };

  const validateStock = (value) => {
    if (value === "" || value === null) return "El stock es obligatorio";

    const stockNum = Number(value);
    if (isNaN(stockNum)) return "El stock debe ser un número válido";
    if (!Number.isInteger(stockNum))
      return "El stock debe ser un número entero";
    if (stockNum < 0) return "El stock no puede ser negativo";

    return "";
  };

  const validateTipo = (value) => {
    if (!value || !value.trim()) return "El tipo es obligatorio";
    return "";
  };

  const validatePrecioTela = (value, tipo) => {
    // Solo validar si el tipo es "Tela"
    if (tipo.toLowerCase() !== "tela") return "";

    // Permitir campo vacío (se guardará como 0)
    if (value === "" || value === null) {
      return ""; // Sin error, se permite vacío
    }

    const precio = parseFloat(value);

    // Validar que sea número
    if (isNaN(precio)) return "El precio debe ser un número válido";

    // Validar que no sea negativo
    if (precio < 0) return "El precio no puede ser negativo";

    // Si el precio es mayor a 0, debe ser mínimo 5000
    if (precio > 0 && precio < 5000) {
      return "El precio debe ser mínimo $5,000 o dejarlo en $0";
    }

    // Validar precio máximo (100,000 COP)
    if (precio > 100000) return "El precio no puede exceder $100,000";

    // Validar máximo 1 decimal
    const stringValue = value.toString();
    const decimals = stringValue.includes(".")
      ? stringValue.split(".")[1].length
      : 0;

    if (decimals > 1) return "Solo se permite 1 decimal (ej: 6000.5)";

    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = name === "estado" ? value === "true" : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: newValue };

      // Si cambia el tipo y no es "Tela", limpiar precioTela
      if (name === "tipo" && value.toLowerCase() !== "tela") {
        updated.precioTela = "";
        setErrors((prevErrors) => ({ ...prevErrors, precioTela: "" }));
      }

      return updated;
    });

    // Validar en tiempo real si ya fue tocado
    if (touched[name]) {
      let error = "";
      if (name === "nombre") error = validateNombre(value);
      else if (name === "stock") error = validateStock(value);
      else if (name === "tipo") error = validateTipo(value);
      else if (name === "precioTela")
        error = validatePrecioTela(value, formData.tipo);

      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    let error = "";
    if (name === "nombre") error = validateNombre(value);
    else if (name === "stock") error = validateStock(value);
    else if (name === "tipo") error = validateTipo(value);
    else if (name === "precioTela")
      error = validatePrecioTela(value, formData.tipo);

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validar todos los campos antes de enviar
    const nombreError = validateNombre(formData.nombre);
    const stockError = validateStock(formData.stock);
    const tipoError = validateTipo(formData.tipo);
    const precioTelaError = validatePrecioTela(
      formData.precioTela,
      formData.tipo
    );

    setErrors({
      nombre: nombreError,
      stock: stockError,
      tipo: tipoError,
      precioTela: precioTelaError,
    });
    setTouched({ nombre: true, stock: true, tipo: true, precioTela: true });

    if (nombreError || stockError || tipoError || precioTelaError) return;

    // Preparar datos para guardar
    const insumoData = {
      Nombre: formData.nombre.trim(),
      Stock: formData.stock === "" ? 0 : parseInt(formData.stock),
      Tipo: formData.tipo,
      Estado: formData.estado,
      ...(insumoEdit && { InsumoID: insumoEdit.InsumoID }),
    };

    // Solo agregar PrecioTela si el tipo es "Tela"
    if (formData.tipo.toLowerCase() === "tela") {
      insumoData.PrecioTela =
        formData.precioTela === "" ? 0 : parseFloat(formData.precioTela);
    }

    onSave(insumoData);
  };

  // Determinar si se debe mostrar el campo de precio
  const mostrarPrecioTela = formData.tipo.toLowerCase() === "tela";

  return (
    <div className="container py-4">
      <div className="position-relative mb-4 text-center">
        <p className="fw-bold fs-3 mb-0">
          {insumoEdit ? "Editar Insumo" : "Crear Insumo"}
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

      <form
        className="p-4 rounded shadow"
        style={{ backgroundColor: "#f5f5fa", color: "#2a273a" }}
        onSubmit={handleSubmit}
      >
        <div className="row g-3">
          {/* Nombre del insumo */}
          <div className="col-md-12">
            <label className="form-label fw-bold">
              Nombre del Insumo <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Ingrese el nombre del insumo"
              maxLength="50"
              className={`form-control ${
                touched.nombre && errors.nombre
                  ? "is-invalid"
                  : touched.nombre && !errors.nombre
                  ? "is-valid"
                  : ""
              }`}
            />
            {touched.nombre && errors.nombre && (
              <div className="invalid-feedback d-block">{errors.nombre}</div>
            )}
          </div>

          {/* Tipo de Insumo */}
          <div className="col-md-6">
            <label className="form-label fw-bold">
              Tipo de Insumo <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${
                touched.tipo && errors.tipo
                  ? "is-invalid"
                  : touched.tipo && !errors.tipo
                  ? "is-valid"
                  : ""
              }`}
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              <option value="Tela">Tela</option>
              <option value="Material">Material</option>
              <option value="Otro">Otro</option>
            </select>
            {touched.tipo && errors.tipo && (
              <div className="invalid-feedback d-block">{errors.tipo}</div>
            )}
          </div>

          {/* Stock */}
          <div className="col-md-6">
            <label className="form-label fw-bold">
              Stock <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Cantidad disponible"
              min="0"
              step="1"
              className={`form-control ${
                touched.stock && errors.stock
                  ? "is-invalid"
                  : touched.stock && !errors.stock
                  ? "is-valid"
                  : ""
              }`}
            />
            {touched.stock && errors.stock && (
              <div className="invalid-feedback d-block">{errors.stock}</div>
            )}
          </div>

          {/* Precio Tela - Solo visible si tipo es "Tela" */}
          {mostrarPrecioTela && (
            <div className="col-md-6">
              <label className="form-label fw-bold">
                Precio de Tela (COP) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                name="precioTela"
                value={formData.precioTela}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Ej: 6000 o 6000.5"
                min="0"
                max="100000"
                step="0.1"
                className={`form-control ${
                  touched.precioTela && errors.precioTela
                    ? "is-invalid"
                    : touched.precioTela && !errors.precioTela
                    ? "is-valid"
                    : ""
                }`}
              />
              {touched.precioTela && errors.precioTela && (
                <div className="invalid-feedback d-block">
                  {errors.precioTela}
                </div>
              )}
              <small className="text-muted">
                Máximo: $100,000 | Solo 1 decimal permitido
              </small>
            </div>
          )}

          {/* Estado */}
          <div className={mostrarPrecioTela ? "col-md-6" : "col-md-12"}>
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
            {formData.stock === "0" && (
              <small className="text-muted">
                * Si el stock es 0, el estado será inactivo automáticamente
              </small>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="d-flex justify-content-center gap-3 mt-4">
          <button
            type="submit"
            className="btn btn-success px-4"
            disabled={
              !!errors.nombre ||
              !!errors.stock ||
              !!errors.tipo ||
              !!errors.precioTela
            }
          >
            {insumoEdit ? "Actualizar Insumo" : "Crear Insumo"}
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

export default InsumoForm;
