import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";

const ProveedoresForm = ({ onClose, onSave, proveedor = null }) => {
    // ==========================
    // ESTADOS DEL FORMULARIO
    // ==========================
    const [formData, setFormData] = useState({
        nit: "",
        nombre: "",
        correo: "",
        telefono: "",
        direccion: "",
        estado: true
    });

    const [errors, setErrors] = useState({
        nit: "",
        nombre: "",
        correo: "",
        telefono: "",
        direccion: ""
    });

    const [touched, setTouched] = useState({
        nit: false,
        nombre: false,
        correo: false,
        telefono: false,
        direccion: false
    });

    // ==========================
    //  CARGAR DATOS AL EDITAR
    // ==========================
    useEffect(() => {
        if (proveedor) {
            setFormData({
                nit: proveedor.Nit || "",
                nombre: proveedor.Nombre || "",
                correo: proveedor.Correo || "",
                telefono: proveedor.Telefono || "",
                direccion: proveedor.Direccion || "",
                estado: proveedor.Estado !== undefined ? proveedor.Estado : true
            });
        } else {
            setFormData({
                nit: "",
                nombre: "",
                correo: "",
                telefono: "",
                direccion: "",
                estado: true
            });
        }

        setErrors({ nit: "", nombre: "", correo: "", telefono: "", direccion: "" });
        setTouched({ nit: false, nombre: false, correo: false, telefono: false, direccion: false });
    }, [proveedor]);

    // ==========================
    //  VALIDACIONES
    // ==========================
    const validateNit = (value) => {
    const nit = value.trim();

    if (!nit) return "El NIT es obligatorio";
    
    // Permitir formatos: 123456789, 123-456-7, 123456789-7
    // Permite dígitos con guiones opcionales y dígito verificador opcional
    if (!/^[\d-]+$/.test(nit)) {
        return "El NIT solo puede contener números y guiones";
    }
    
    // Remover guiones para validar la longitud de solo dígitos
    const soloDigitos = nit.replace(/-/g, '');
    
    if (soloDigitos.length < 6) {
        return "El NIT debe tener al menos 6 dígitos";
    }
    
    if (soloDigitos.length > 15) {
        return "El NIT no puede tener más de 15 dígitos";
    }
    
    if (/--/.test(nit) || nit.startsWith('-') || nit.endsWith('-')) {
        return "Formato de NIT inválido";
    }

    return "";
};
    const validateNombre = (value) => {
        const nombre = value.trim();

        if (!nombre) return "El nombre es obligatorio";
        if (nombre.length < 2) return "El nombre debe tener al menos 2 caracteres";
        if (nombre.length > 100) return "El nombre no puede exceder 100 caracteres";
        
        // Permitir letras, números, espacios, acentos, ñ (para razones sociales)
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s&\.\-]+$/.test(nombre)) {
            return "Solo se permiten letras, números, espacios y caracteres básicos (&.-)";
        }

        return "";
    };

    const validateCorreo = (value) => {
        const correo = value.trim().toLowerCase();

        if (!correo) return "El correo es obligatorio";
        
        // Regex más estricta para email
        if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(correo)) {
            return "Formato de correo inválido";
        }
        
        if (correo.length < 10) return "El correo debe tener al menos 10 caracteres";
        if (correo.length > 254) return "El correo no puede exceder 254 caracteres";

        return "";
    };

    const validateTelefono = (value) => {
        const telefono = value.trim();

        if (!telefono) return "El teléfono es obligatorio";
        
        // Permitir solo dígitos y opcionalmente + al inicio
        if (!/^\+?\d{7,15}$/.test(telefono)) {
            return "Formato inválido. Use solo números (ej: +573001234567 o 3001234567)";
        }
        
        if (telefono.length < 7) return "El teléfono debe tener al menos 7 dígitos";
        if (telefono.length > 15) return "El teléfono no puede exceder 15 caracteres";

        return "";
    };

    const validateDireccion = (value) => {
        const direccion = value.trim();

        if (!direccion) return "La dirección es obligatoria";
        if (direccion.length < 5) return "La dirección debe tener al menos 5 caracteres";
        if (direccion.length > 200) return "La dirección no puede exceder 200 caracteres";
        
        // Permitir letras, números, espacios y símbolos básicos de dirección
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\.\-#,°]+$/.test(direccion)) {
            return "Caracteres no permitidos en la dirección";
        }

        return "";
    };

    // ==========================
    // MANEJADORES DE EVENTOS
    // ==========================
    const handleChange = (e) => {
        const { name, value } = e.target;
        const newValue = name === "estado" ? value === "true" : value;

        setFormData((prev) => ({ ...prev, [name]: newValue }));

        // Validar en tiempo real si ya fue tocado
        if (touched[name]) {
            let error = "";
            if (name === "nit") error = validateNit(value);
            else if (name === "nombre") error = validateNombre(value);
            else if (name === "correo") error = validateCorreo(value);
            else if (name === "telefono") error = validateTelefono(value);
            else if (name === "direccion") error = validateDireccion(value);
            
            setErrors((prev) => ({ ...prev, [name]: error }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));

        let error = "";
        if (name === "nit") error = validateNit(value);
        else if (name === "nombre") error = validateNombre(value);
        else if (name === "correo") error = validateCorreo(value);
        else if (name === "telefono") error = validateTelefono(value);
        else if (name === "direccion") error = validateDireccion(value);
        
        setErrors((prev) => ({ ...prev, [name]: error }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validar todos los campos antes de enviar
        const nitError = validateNit(formData.nit);
        const nombreError = validateNombre(formData.nombre);
        const correoError = validateCorreo(formData.correo);
        const telefonoError = validateTelefono(formData.telefono);
        const direccionError = validateDireccion(formData.direccion);

        setErrors({ 
            nit: nitError,
            nombre: nombreError, 
            correo: correoError,
            telefono: telefonoError,
            direccion: direccionError
        });
        setTouched({ 
            nit: true,
            nombre: true, 
            correo: true,
            telefono: true,
            direccion: true
        });

        if (nitError || nombreError || correoError || telefonoError || direccionError) return;

        // Preparar datos para guardar (normalizar y limpiar)
        const proveedorData = {
            Nit: formData.nit.trim(),
            Nombre: formData.nombre.trim(),
            Correo: formData.correo.trim().toLowerCase(),
            Telefono: formData.telefono.trim(),
            Direccion: formData.direccion.trim(),
            Estado: formData.estado
        };

        onSave(proveedorData);
    };

    return (
        <div className="container py-4">
            <div className="position-relative mb-4 text-center">
                <p className="fw-bold fs-3 mb-0">
                    {proveedor ? "Editar Proveedor" : "Crear Proveedor"}
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
                    {/* NIT */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold">
                            NIT <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            name="nit"
                            value={formData.nit}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Ej: 900123456 o 900123456-7"
                            maxLength="17"
                            className={`form-control ${
                                touched.nit && errors.nit
                                    ? "is-invalid"
                                    : touched.nit && !errors.nit
                                    ? "is-valid"
                                    : ""
                            }`}
                        />
                        {touched.nit && errors.nit && (
                            <div className="invalid-feedback d-block">
                                {errors.nit}
                            </div>
                        )}
                        {/* ✅ AGREGADO: Advertencia al editar NIT */}
                        {proveedor && (
                            <small className="text-warning d-block mt-1">
                                ⚠️ Tenga cuidado al modificar el NIT. Asegúrese de que sea correcto.
                            </small>
                        )}
                    </div>

                    {/* Nombre */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold">
                            Nombre <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Nombre o razón social del proveedor"
                            maxLength="100"
                            className={`form-control ${
                                touched.nombre && errors.nombre
                                    ? "is-invalid"
                                    : touched.nombre && !errors.nombre
                                    ? "is-valid"
                                    : ""
                            }`}
                        />
                        {touched.nombre && errors.nombre && (
                            <div className="invalid-feedback d-block">
                                {errors.nombre}
                            </div>
                        )}
                    </div>

                    {/* Correo */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold">
                            Correo Electrónico <span className="text-danger">*</span>
                        </label>
                        <input
                            type="email"
                            name="correo"
                            value={formData.correo}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="ejemplo@correo.com"
                            maxLength="254"
                            className={`form-control ${
                                touched.correo && errors.correo
                                    ? "is-invalid"
                                    : touched.correo && !errors.correo
                                    ? "is-valid"
                                    : ""
                            }`}
                        />
                        {touched.correo && errors.correo && (
                            <div className="invalid-feedback d-block">
                                {errors.correo}
                            </div>
                        )}
                    </div>

                    {/* Teléfono */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold">
                            Teléfono <span className="text-danger">*</span>
                        </label>
                        <input
                            type="tel"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Ej: 3001234567 o +573001234567"
                            maxLength="15"
                            className={`form-control ${
                                touched.telefono && errors.telefono
                                    ? "is-invalid"
                                    : touched.telefono && !errors.telefono
                                    ? "is-valid"
                                    : ""
                            }`}
                        />
                        {touched.telefono && errors.telefono && (
                            <div className="invalid-feedback d-block">
                                {errors.telefono}
                            </div>
                        )}
                    </div>

                    {/* Dirección */}
                    <div className="col-md-12">
                        <label className="form-label fw-bold">
                            Dirección <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Dirección completa del proveedor"
                            maxLength="200"
                            className={`form-control ${
                                touched.direccion && errors.direccion
                                    ? "is-invalid"
                                    : touched.direccion && !errors.direccion
                                    ? "is-valid"
                                    : ""
                            }`}
                        />
                        {touched.direccion && errors.direccion && (
                            <div className="invalid-feedback d-block">
                                {errors.direccion}
                            </div>
                        )}
                    </div>

                    {/* Estado */}
                    <div className="col-md-12">
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

                {/* Botones */}
                <div className="d-flex justify-content-center gap-3 mt-4">
                    <button
                        type="submit"
                        className="btn btn-success px-4"
                        disabled={
                            !!errors.nit ||
                            !!errors.nombre ||
                            !!errors.correo ||
                            !!errors.telefono ||
                            !!errors.direccion
                        }
                    >
                        {proveedor ? "Actualizar Proveedor" : "Crear Proveedor"}
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

export default ProveedoresForm;