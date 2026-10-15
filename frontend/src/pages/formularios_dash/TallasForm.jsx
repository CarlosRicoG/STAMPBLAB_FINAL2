import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import Swal from "sweetalert2";
import { createTalla, updateTalla, getTallas } from "../../Services/api-tallas/tallas";

const TallasForm = ({ onClose, onSave, tallaEdit }) => {

    const [formData, setFormData] = useState({
        Nombre: "",
        Precio: ""
    });

    const [error, setError] = useState("");
    const [tallasExistentes, setTallasExistentes] = useState([]);

    const tallasConPrecio = ["XXL", "XXXL"];

    useEffect(() => {
        const fetchTallas = async () => {
            try {
                const response = await getTallas();
                if (response.estado)
                    setTallasExistentes(response.datos.map(t => t.Nombre.toLowerCase().trim()));
            } catch (err) {
                console.error("Error cargando tallas:", err);
            }
        };
        fetchTallas();
    }, []);

    useEffect(() => {
        if (tallaEdit) {
            setFormData({
                Nombre: tallaEdit.Nombre || "",
                Precio: tallaEdit.Precio ?? ""
            });
        }
    }, [tallaEdit]);

    const validarNombre = (nombre) => {
        const trimmed = nombre.trim();
        if (!trimmed) return "El nombre no puede estar vacío";
        if (trimmed.length < 1) return "El nombre debe tener al menos 1 carácter";
        if (trimmed.length > 4) return "El nombre no puede tener más de 4 caracteres";
        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(trimmed)) return "Solo se permiten letras y espacios";
        if (tallasExistentes.includes(trimmed.toLowerCase()) && (!tallaEdit || trimmed.toLowerCase() !== tallaEdit.Nombre.toLowerCase().trim()))
            return "Ya existe una talla con este nombre";
        return "";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value
        });

        if (name === "Nombre") {
            setError(validarNombre(value));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validarNombre(formData.Nombre);
        if (err) return setError(err);

        // Preparar datos finales
        const dataEnviar = {
            Nombre: formData.Nombre.trim(),
            Precio:
                tallasConPrecio.includes(formData.Nombre.toUpperCase())
                    ? (formData.Precio && !isNaN(formData.Precio) ? Number(formData.Precio) : null)
                    : null
        };

        if (mostrarPrecio && (formData.Precio === "" || isNaN(formData.Precio))) {
            return Swal.fire("Error", "Debes ingresar un precio válido", "error");
        }

        try {
            let result;
            if (tallaEdit) {
                result = await updateTalla(tallaEdit.TallaID, dataEnviar);
            } else {
                result = await createTalla(dataEnviar);
            }

            if (result.estado) {
                Swal.fire({
                    icon: "success",
                    title: tallaEdit ? "Talla actualizada" : "Talla creada",
                    timer: 1500,
                    showConfirmButton: false
                });
                onSave();
            } else {
                throw new Error(result.mensaje);
            }

        } catch (error) {
            Swal.fire("Error", error.message || "No se pudo guardar", "error");
        }
    };

    const mostrarPrecio =
        tallasConPrecio.includes(formData.Nombre.toUpperCase());

    return (
        <div className="card shadow-sm border-0 p-4 mx-4">
            <div className="position-relative mb-4 text-center">
                <p className="fw-bold fs-3 mb-0">
                    {tallaEdit ? "Editar Talla" : "Crear Talla"}
                </p>
                <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-warning btn-sm shadow-sm position-absolute top-0 end-0"
                >
                    <FaTimes />
                </button>
            </div>

            <form className="row g-3" onSubmit={handleSubmit}>

                {/* Nombre */}
                <div className="col-12">
                    <label className="form-label fw-bold">Nombre de la Talla</label>
                    <input
                        type="text"
                        name="Nombre"
                        value={formData.Nombre}
                        onChange={handleChange}
                        className={`form-control ${error ? "is-invalid" : ""}`}
                        placeholder="Ej: S, M, L, XL, XXL"
                    />
                    {error && <div className="invalid-feedback">{error}</div>}
                </div>

                {/* Precio (solo XXL o XXXL) */}
                {mostrarPrecio && (
                    <div className="col-12">
                        <label className="form-label fw-bold">Precio</label>
                        <input
                            type="number"
                            name="Precio"
                            value={formData.Precio}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Ingresa el precio"
                            required={mostrarPrecio}
                        />
                        <small className="text-muted">
                            Este campo solo aparece para tallas XXL y XXXL.
                        </small>
                    </div>
                )}

                <div className="col-12 d-flex justify-content-end gap-2">
                    <button type="button" onClick={onClose} className="btn btn-secondary">
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={!!error}>
                        {tallaEdit ? "Actualizar" : "Guardar"}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default TallasForm;
