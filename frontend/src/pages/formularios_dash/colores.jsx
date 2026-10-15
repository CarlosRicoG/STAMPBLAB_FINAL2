import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import Swal from "sweetalert2";
import { createColor, updateColor, getColores } from "../../Services/api-colores/colores.js";

const ColoresForm = ({ onClose, onSave, colorEdit }) => {
    const [formData, setFormData] = useState({ Nombre: "" });
    const [error, setError] = useState("");
    const [coloresExistentes, setColoresExistentes] = useState([]);

    useEffect(() => {
        const fetchColores = async () => {
            try {
                const response = await getColores();
                if (response.estado) setColoresExistentes(response.datos.map(c => c.Nombre.toLowerCase().trim()));
            } catch (err) {
                console.error(err);
            }
        };
        fetchColores();
    }, []);

    useEffect(() => {
        if (colorEdit) setFormData({ Nombre: colorEdit.Nombre || "" });
    }, [colorEdit]);

    const validarNombre = (nombre) => {
        const trimmed = nombre.trim();
        if (!trimmed) return "El nombre no puede estar vacío";
        if (trimmed.length < 3) return "El nombre debe tener al menos 3 caracteres";
        if (trimmed.length > 15) return "El nombre no puede tener más de 15 caracteres";
        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(trimmed)) return "Solo se permiten letras y espacios";
        if (coloresExistentes.includes(trimmed.toLowerCase()) && (!colorEdit || trimmed.toLowerCase() !== colorEdit.Nombre.toLowerCase().trim()))
            return "Ya existe un color con este nombre";
        return "";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setError(validarNombre(value));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const mensajeError = validarNombre(formData.Nombre);
        if (mensajeError) return setError(mensajeError);

        try {
            let result;
            if (colorEdit) {
                result = await updateColor({ ColorID: colorEdit.ColorID, ...formData });
            } else {
                result = await createColor(formData);
            }

            if (result.estado) {
                Swal.fire({
                    icon: 'success',
                    title: colorEdit ? 'Color actualizado correctamente' : 'Color creado correctamente',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000
                });
                onSave();
            } else {
                throw new Error(result.mensaje);
            }
        } catch (error) {
            Swal.fire("Error", error.message || "Error al guardar el color", "error");
        }
    };

    return (
        <div className="card shadow-sm border-0 p-4 mx-4">
            <div className="position-relative mb-4 text-center">
                <p className="fw-bold fs-3 mb-0">{colorEdit ? "Editar Color" : "Crear Color"}</p>
                <button type="button" onClick={onClose} className="btn btn-warning btn-sm position-absolute top-0 end-0"><FaTimes /></button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label fw-bold">Nombre del Color</label>
                    <input type="text" name="Nombre" value={formData.Nombre} onChange={handleChange} className={`form-control ${error ? "is-invalid" : ""}`} placeholder="Ej: Azul Cielo" required />
                    {error && <div className="invalid-feedback">{error}</div>}
                </div>

                <div className="d-flex justify-content-end gap-2">
                    <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                    <button type="submit" className="btn btn-success" disabled={!!error}>Confirmar</button>
                </div>
            </form>
        </div>
    );
};

export default ColoresForm;
