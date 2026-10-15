import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FaArrowLeft, FaCheck, FaPlus, FaTrash, FaImage, FaEdit } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";

// Importar servicios
import {
    createProducto,
    getProductoById,
    updateProducto
} from "../../Services/api-productos/productos";
import {
    createVariante,
    getVariantesByProducto,
    updateVariante,
    deleteVariante
} from "../../Services/api-productos/variantes";
import { getColores, getTallas, getTelas } from "../../Services/api-productos/atributos";

const AgregarProducto = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const modoEdicion = Boolean(id);

    // Estados del producto
    const [producto, setProducto] = useState({
        Nombre: "",
        Descripcion: "",
        PrecioBase: "",
        ImagenProducto: ""
    });

    const [productoOriginal, setProductoOriginal] = useState(null);


    const [colores, setColores] = useState([]);
    const [tallas, setTallas] = useState([]);
    const [telas, setTelas] = useState([]);
    const [variantes, setVariantes] = useState([]);
    const [variantesOriginales, setVariantesOriginales] = useState([]);

    // Estado del paso actual
    const [paso, setPaso] = useState(1);
    const [productoCreado, setProductoCreado] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [cargandoDatos, setCargandoDatos] = useState(false);
    const [editandoDatosProducto, setEditandoDatosProducto] = useState(false);


    const [nuevaVariante, setNuevaVariante] = useState({
        ColorID: "",
        TallaID: "",
        TelaID: "",
        Stock: 0,
        Estado: true
    });

    // 🆕 FUNCIONES AUXILIARES CORREGIDAS
    const obtenerPrecioTalla = (tallaId) => {
        const talla = tallas.find(t => t.TallaID === parseInt(tallaId));
        return talla?.Precio ? parseFloat(talla.Precio) : 0;
    };

    const obtenerPrecioTela = (telaId) => {
        if (!telaId) return 0;
        const tela = telas.find(t => t.InsumoID === parseInt(telaId));
        return tela?.PrecioTela ? parseFloat(tela.PrecioTela) : 0;
    };
    

    // Usa productoCreado directamente
    const calcularPrecioTotal = (tallaId, telaId = null) => {
        const precioBase = parseFloat(productoCreado?.PrecioBase) || 0;
        const precioTalla = parseFloat(obtenerPrecioTalla(tallaId)) || 0;
        const precioTela = parseFloat(obtenerPrecioTela(telaId)) || 0;

        return precioBase + precioTalla + precioTela; // 10000 + 2500 + 5000 = 17500
    };


    // Cargar datos al montar
    useEffect(() => {
        cargarAtributos();

        if (modoEdicion) {
            cargarProductoExistente();
        }
    }, [id]);


    const cargarAtributos = async () => {
        try {
            const [coloresRes, tallasRes, telasRes] = await Promise.all([
                getColores(),
                getTallas(),
                getTelas() // 🆕
            ]);

            setColores(coloresRes.datos || coloresRes);
            setTallas(tallasRes.datos || tallasRes);
            setTelas(telasRes || []);
        } catch (error) {
            console.error("Error al cargar atributos:", error);
            Swal.fire("Error", "No se pudieron cargar colores, tallas y telas", "error");
        }
    };

    const cargarProductoExistente = async () => {
        setCargandoDatos(true);
        try {
            const [productoRes, variantesRes] = await Promise.all([
                getProductoById(id),
                getVariantesByProducto(id)
            ]);

            const productoData = productoRes.datos || productoRes;
            const variantesData = variantesRes.datos || variantesRes;

            const productoInfo = {
                Nombre: productoData.Nombre,
                Descripcion: productoData.Descripcion || "",
                PrecioBase: productoData.PrecioBase || "",
                ImagenProducto: productoData.ImagenProducto || ""
            };

            setProducto(productoInfo);
            setProductoOriginal(JSON.parse(JSON.stringify(productoInfo)));
            setProductoCreado(productoData);


            const variantesFormateadas = variantesData.map(v => ({
                InventarioID: v.InventarioID,
                ColorID: v.ColorID,
                TallaID: v.TallaID,
                TelaID: v.TelaID || null, // 🆕
                Stock: v.Stock,
                Estado: v.Estado,
                nombreColor: v.color?.Nombre,
                nombreTalla: v.talla?.Nombre,
                nombreTela: v.tela?.Nombre || 'Sin tela', // 🆕
                precioTalla: v.talla?.Precio || 0,
                precioTela: v.tela?.PrecioTela || 0, // 🆕
                esExistente: true
            }));

            setVariantes(variantesFormateadas);
            setVariantesOriginales(JSON.parse(JSON.stringify(variantesFormateadas)));
            setPaso(2);

        } catch (error) {
            console.error("Error al cargar producto:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo cargar el producto",
            }).then(() => {
                navigate("/dashboard/productos");
            });
        } finally {
            setCargandoDatos(false);
        }
    };

    const handleProductoChange = (e) => {
        const { name, value } = e.target;
        setProducto(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleGuardarProducto = async (e) => {
        e.preventDefault();

        if (!producto.Nombre.trim()) {
            Swal.fire("Error", "El nombre del producto es obligatorio", "error");
            return;
        }

        if (!producto.PrecioBase || producto.PrecioBase === "") {
            Swal.fire("Error", "El precio base es obligatorio", "error");
            return;
        }

        const precioBaseNum = parseFloat(producto.PrecioBase);
        if (isNaN(precioBaseNum) || precioBaseNum < 0) {
            Swal.fire("Error", "El precio base debe ser un número mayor o igual a 0", "error");
            return;
        }

        setCargando(true);
        try {
            let nuevoProducto;

            if (modoEdicion) {
                const response = await updateProducto(id, producto);
                nuevoProducto = response.datos || response.producto;

                Swal.fire({
                    title: "¡Actualizado!",
                    text: "Producto actualizado correctamente",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                });

                setProductoOriginal(JSON.parse(JSON.stringify(producto)));
                setEditandoDatosProducto(false);
            } else {
                const response = await createProducto(producto);
                nuevoProducto = response.datos || response.producto;

                Swal.fire({
                    title: "¡Producto creado!",
                    text: "Ahora puedes agregar variantes (colores, tallas y telas)",
                    icon: "success",
                    timer: 2000,
                    showConfirmButton: false
                });
            }

            setProductoCreado(nuevoProducto);
            setPaso(2);

        } catch (error) {
            console.error("Error al guardar producto:", error);
            Swal.fire(
                "Error",
                error.response?.data?.mensaje || "No se pudo guardar el producto",
                "error"
            );
        } finally {
            setCargando(false);
        }
    };


    const handleAgregarVariante = () => {
        const { ColorID, TallaID, TelaID, Stock } = nuevaVariante;

        if (!ColorID || !TallaID) {
            Swal.fire("Error", "Selecciona color y talla", "warning");
            return;
        }


        const existe = variantes.some(
            v => v.ColorID === parseInt(ColorID) &&
                v.TallaID === parseInt(TallaID) &&
                v.TelaID === (TelaID ? parseInt(TelaID) : null)
        );

        if (existe) {
            Swal.fire("Error", "Ya existe una variante con esa combinación", "warning");
            return;
        }

        const talla = tallas.find(t => t.TallaID === parseInt(TallaID));
        const tela = TelaID ? telas.find(t => t.InsumoID === parseInt(TelaID)) : null; // 🆕

        const varianteTemporal = {
            ColorID: parseInt(ColorID),
            TallaID: parseInt(TallaID),
            TelaID: TelaID ? parseInt(TelaID) : null, // 🆕
            Stock: parseInt(Stock) || 0,
            Estado: nuevaVariante.Estado,
            nombreColor: colores.find(c => c.ColorID === parseInt(ColorID))?.Nombre,
            nombreTalla: talla?.Nombre,
            nombreTela: tela?.Nombre || 'Sin tela',
            precioTalla: talla?.Precio || 0,
            precioTela: tela?.PrecioTela || 0,
            esExistente: false
        };

        setVariantes(prev => [...prev, varianteTemporal]);

        setNuevaVariante({
            ColorID: "",
            TallaID: "",
            TelaID: "",
            Stock: 0,
            Estado: true
        });
    };


    const handleEditarVariante = (index) => {
        const variante = variantes[index];

        Swal.fire({
            title: `Editar Variante`,
            html: `
                <div class="text-start">
                    <p class="mb-3"><strong>${variante.nombreColor} - ${variante.nombreTalla}</strong></p>
                    
                    <label class="form-label fw-medium">Tela</label>
                    <select id="tela" class="form-select mb-3">
                        <option value="">Sin tela</option>
                        ${telas.map(t => `
                            <option value="${t.InsumoID}" ${variante.TelaID === t.InsumoID ? 'selected' : ''}>
                                ${t.Nombre} ($${parseFloat(t.PrecioTela || 0).toLocaleString()})
                            </option>
                        `).join('')}
                    </select>
                    
                    <label class="form-label fw-medium">Stock</label>
                    <input type="number" id="stock" class="form-control mb-3" value="${variante.Stock}" min="0">
                    
                    <label class="form-label fw-medium">Estado</label>
                    <select id="estado" class="form-select">
                        <option value="true" ${variante.Estado ? 'selected' : ''}>Disponible</option>
                        <option value="false" ${!variante.Estado ? 'selected' : ''}>No disponible</option>
                    </select>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: "Guardar",
            cancelButtonText: "Cancelar",
            preConfirm: () => {
                const telaId = document.getElementById('tela').value;
                const stock = parseInt(document.getElementById('stock').value);
                const estado = document.getElementById('estado').value === 'true';

                if (isNaN(stock) || stock < 0) {
                    Swal.showValidationMessage('El stock debe ser un número válido');
                    return false;
                }

                return { telaId: telaId || null, stock, estado };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const { telaId, stock, estado } = result.value;
                const telaSeleccionada = telaId ? telas.find(t => t.InsumoID === parseInt(telaId)) : null;

                setVariantes(prev => prev.map((v, i) =>
                    i === index
                        ? {
                            ...v,
                            TelaID: telaId ? parseInt(telaId) : null,
                            nombreTela: telaSeleccionada?.Nombre || 'Sin tela',
                            precioTela: telaSeleccionada?.PrecioTela || 0,
                            Stock: stock,
                            Estado: estado
                        }
                        : v
                ));

                Swal.fire({
                    icon: 'success',
                    title: 'Variante actualizada',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    };

    const handleEliminarVariante = async (index) => {
        const variante = variantes[index];

        const result = await Swal.fire({
            title: "¿Eliminar variante?",
            text: `${variante.nombreColor} - ${variante.nombreTalla} - ${variante.nombreTela}`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (!result.isConfirmed) return;

        if (variante.esExistente && variante.InventarioID) {
            setCargando(true);
            try {
                await deleteVariante(variante.InventarioID);

                Swal.fire({
                    icon: 'success',
                    title: 'Variante eliminada',
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error("Error al eliminar variante:", error);
                Swal.fire("Error", "No se pudo eliminar la variante", "error");
                setCargando(false);
                return;
            } finally {
                setCargando(false);
            }
        }

        setVariantes(prev => prev.filter((_, i) => i !== index));
    };

    // 🆕 Guardar variantes CON TELA
    const handleGuardarVariantes = async () => {
        if (variantes.length === 0 && !modoEdicion) {
            const result = await Swal.fire({
                title: "Sin variantes",
                text: "¿Deseas guardar el producto sin variantes?",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Sí, guardar",
                cancelButtonText: "Cancelar"
            });

            if (!result.isConfirmed) return;
        }

        setCargando(true);
        try {
            const promesas = [];

            for (const variante of variantes) {
                if (variante.esExistente) {
                    const original = variantesOriginales.find(v => v.InventarioID === variante.InventarioID);
                    if (!original ||
                        original.Stock !== variante.Stock ||
                        original.Estado !== variante.Estado ||
                        original.TelaID !== variante.TelaID) { // 🆕 Comparar tela también
                        promesas.push(
                            updateVariante(variante.InventarioID, {
                                Stock: variante.Stock,
                                Estado: variante.Estado,
                                TelaID: variante.TelaID // 🆕
                            })
                        );
                    }
                } else {
                    promesas.push(
                        createVariante({
                            ProductoID: productoCreado.ProductoID,
                            ColorID: variante.ColorID,
                            TallaID: variante.TallaID,
                            TelaID: variante.TelaID, // 🆕
                            Stock: variante.Stock,
                            Estado: variante.Estado
                        })
                    );
                }
            }

            await Promise.all(promesas);

            Swal.fire({
                title: modoEdicion ? "¡Actualizado!" : "¡Éxito!",
                text: modoEdicion
                    ? "Producto y variantes actualizados correctamente"
                    : `Producto creado con ${variantes.length} variante(s)`,
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            });

            setTimeout(() => {
                navigate("/dashboard/productos");
            }, 2000);

        } catch (error) {
            console.error("Error al guardar variantes:", error);
            Swal.fire(
                "Error",
                "Hubo un problema al guardar las variantes",
                "error"
            );
        } finally {
            setCargando(false);
        }
    };

    const handleVolver = () => {
        if (paso === 2) {
            if (modoEdicion) {
                Swal.fire({
                    title: "¿Descartar cambios?",
                    text: "Los cambios no guardados se perderán",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Sí, descartar",
                    cancelButtonText: "Cancelar"
                }).then((result) => {
                    if (result.isConfirmed) {
                        navigate("/dashboard/productos");
                    }
                });
            } else {
                Swal.fire({
                    title: "¿Volver al paso anterior?",
                    text: "Se perderán las variantes agregadas",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Sí, volver",
                    cancelButtonText: "Cancelar"
                }).then((result) => {
                    if (result.isConfirmed) {
                        setPaso(1);
                        setVariantes([]);
                    }
                });
            }
        } else {
            navigate("/dashboard/productos");
        }
    };

    const handleEditarDatosProducto = () => {
        setEditandoDatosProducto(true);
    };

    const handleCancelarEdicionProducto = () => {
        setProducto(JSON.parse(JSON.stringify(productoOriginal)));
        setEditandoDatosProducto(false);
    };


    if (cargandoDatos) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-3">Cargando producto...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #ffffff 0%, #fafcff 100%)",
                padding: "20px 30px"
            }}
        >
            {/* Header */}
            <div className="d-flex align-items-center mb-4">
                <button
                    className="btn btn-outline-secondary me-3"
                    onClick={handleVolver}
                    disabled={cargando}
                >
                    <FaArrowLeft />
                </button>
                <h1 className="fs-4 fw-bold mb-0 text-primary">
                    {modoEdicion
                        ? (paso === 1 ? "Editar Producto" : "Gestionar Producto y Variantes")
                        : (paso === 1 ? "Crear Nuevo Producto" : "Agregar Variantes")
                    }
                </h1>
            </div>

            {/* Indicador de pasos (solo en modo creación) */}
            {!modoEdicion && (
                <div className="d-flex justify-content-center mb-4">
                    <div className="d-flex align-items-center">
                        <div
                            className={`rounded-circle d-flex align-items-center justify-content-center ${paso >= 1 ? "bg-primary text-white" : "bg-secondary text-white"
                                }`}
                            style={{ width: 40, height: 40 }}
                        >
                            {paso > 1 ? <FaCheck /> : "1"}
                        </div>
                        <div
                            className={`mx-3 ${paso >= 2 ? "bg-primary" : "bg-secondary"}`}
                            style={{ width: 80, height: 3 }}
                        ></div>
                        <div
                            className={`rounded-circle d-flex align-items-center justify-content-center ${paso >= 2 ? "bg-primary text-white" : "bg-secondary text-white"
                                }`}
                            style={{ width: 40, height: 40 }}
                        >
                            2
                        </div>
                    </div>
                </div>
            )}

            {/* PASO 1: Datos del Producto */}
            {paso === 1 && (
                <div className="card shadow-sm mx-auto" style={{ maxWidth: 700 }}>
                    <div className="card-body p-4">
                        <h5 className="fw-bold mb-3">Información del Producto</h5>

                        <form onSubmit={handleGuardarProducto}>
                            <div className="mb-3">
                                <label className="form-label fw-medium">
                                    Nombre del Producto <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="Nombre"
                                    value={producto.Nombre}
                                    onChange={handleProductoChange}
                                    placeholder="Ej: Camiseta Básica"
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-medium">Descripción</label>
                                <textarea
                                    className="form-control"
                                    name="Descripcion"
                                    value={producto.Descripcion}
                                    onChange={handleProductoChange}
                                    rows="3"
                                    placeholder="Describe el producto..."
                                ></textarea>
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-medium">
                                    Precio Base <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="number"
                                    className="form-control"
                                    name="PrecioBase"
                                    value={producto.PrecioBase || ""}
                                    onChange={handleProductoChange}
                                    placeholder="Ej: 15000"
                                    min="0"
                                    step="100"
                                    required
                                />
                                <small className="text-muted">
                                    Precio base del producto sin adicionales de talla o tela
                                </small>
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-medium">
                                    <FaImage className="me-2" />
                                    URL de la Imagen
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="ImagenProducto"
                                    value={producto.ImagenProducto}
                                    onChange={handleProductoChange}
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                />
                                {producto.ImagenProducto && (
                                    <div className="mt-2">
                                        <img
                                            src={producto.ImagenProducto}
                                            alt="Vista previa"
                                            className="img-thumbnail"
                                            style={{ maxWidth: 200, maxHeight: 200 }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="d-flex justify-content-end gap-2">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => navigate("/dashboard/productos")}
                                    disabled={cargando}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={cargando}
                                >
                                    {cargando ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            {modoEdicion ? "Actualizando..." : "Creando..."}
                                        </>
                                    ) : (
                                        modoEdicion ? "Actualizar y Continuar" : "Crear y Continuar"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PASO 2: Variantes CON TELA */}
            {paso === 2 && productoCreado && (
                <div className="card shadow-sm mx-auto" style={{ maxWidth: 1100 }}>
                    <div className="card-body p-4">
                        {/* Tarjeta de información del producto */}
                        <div className="card mb-4" style={{ backgroundColor: '#f8f9fa' }}>
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="fw-bold mb-0">Información del Producto</h5>
                                    {modoEdicion && !editandoDatosProducto && (
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={handleEditarDatosProducto}
                                        >
                                            <FaEdit className="me-1" /> Editar datos
                                        </button>
                                    )}
                                </div>

                                {editandoDatosProducto ? (
                                    <form onSubmit={handleGuardarProducto}>
                                        <div className="mb-3">
                                            <label className="form-label fw-medium">Nombre</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="Nombre"
                                                value={producto.Nombre}
                                                onChange={handleProductoChange}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-medium">Descripción</label>
                                            <textarea
                                                className="form-control"
                                                name="Descripcion"
                                                value={producto.Descripcion}
                                                onChange={handleProductoChange}
                                                rows="2"
                                            ></textarea>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-medium">Precio Base</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="PrecioBase"
                                                value={producto.PrecioBase}
                                                onChange={handleProductoChange}
                                                min="0"
                                                step="100"
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-medium">URL de la Imagen</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="ImagenProducto"
                                                value={producto.ImagenProducto}
                                                onChange={handleProductoChange}
                                            />
                                            {producto.ImagenProducto && (
                                                <div className="mt-2">
                                                    <img
                                                        src={producto.ImagenProducto}
                                                        alt="Vista previa"
                                                        className="img-thumbnail"
                                                        style={{ maxWidth: 150, maxHeight: 150 }}
                                                        onError={(e) => e.target.style.display = 'none'}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-secondary"
                                                onClick={handleCancelarEdicionProducto}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-sm btn-primary"
                                                disabled={cargando}
                                            >
                                                {cargando ? "Guardando..." : "Guardar cambios"}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="row">
                                        <div className="col-md-3">
                                            {producto.ImagenProducto ? (
                                                <img
                                                    src={producto.ImagenProducto}
                                                    alt={producto.Nombre}
                                                    className="img-fluid rounded"
                                                    style={{ maxHeight: 150, objectFit: "cover" }}
                                                />
                                            ) : (
                                                <div
                                                    className="bg-secondary bg-opacity-10 rounded d-flex align-items-center justify-content-center"
                                                    style={{ height: 150 }}
                                                >
                                                    <span className="text-muted">Sin imagen</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-md-9">
                                            <h6 className="fw-bold">{producto.Nombre}</h6>
                                            <p className="text-muted mb-2">{producto.Descripcion || "Sin descripción"}</p>
                                            <div className="alert alert-success mb-2">
                                                <strong>Precio Base:</strong> ${(productoCreado.PrecioBase || 0).toLocaleString()}
                                            </div>
                                            <small className="text-muted">ID: {productoCreado.ProductoID}</small>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <h5 className="fw-bold mb-3">
                            {modoEdicion ? "Gestionar Variantes" : "Agregar Variantes"}
                        </h5>

                        {/* Formulario para agregar variante CON TELA */}
                        <div className="card bg-light mb-4">
                            <div className="card-body">
                                <h6 className="fw-bold mb-3">Nueva Variante</h6>
                                <div className="row g-3">
                                    <div className="col-md-2">
                                        <label className="form-label fw-medium">Color</label>
                                        <select
                                            className="form-select"
                                            value={nuevaVariante.ColorID}
                                            onChange={(e) =>
                                                setNuevaVariante(prev => ({
                                                    ...prev,
                                                    ColorID: e.target.value
                                                }))
                                            }
                                        >
                                            <option value="">Seleccionar...</option>
                                            {colores.map(color => (
                                                <option key={color.ColorID} value={color.ColorID}>
                                                    {color.Nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-md-2">
                                        <label className="form-label fw-medium">Talla</label>
                                        <select
                                            className="form-select"
                                            value={nuevaVariante.TallaID}
                                            onChange={(e) =>
                                                setNuevaVariante(prev => ({
                                                    ...prev,
                                                    TallaID: e.target.value
                                                }))
                                            }
                                        >
                                            <option value="">Seleccionar...</option>
                                            {tallas.map(talla => (
                                                <option key={talla.TallaID} value={talla.TallaID}>
                                                    {talla.Nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 🆕 Selector de Tela */}
                                    <div className="col-md-3">
                                        <label className="form-label fw-medium">Tela</label>
                                        <select
                                            className="form-select"
                                            value={nuevaVariante.TelaID}
                                            onChange={(e) =>
                                                setNuevaVariante(prev => ({
                                                    ...prev,
                                                    TelaID: e.target.value
                                                }))
                                            }
                                        >
                                            <option value="">Sin tela</option>
                                            {telas.map(tela => (
                                                <option key={tela.InsumoID} value={tela.InsumoID}>
                                                    {tela.Nombre} (${parseFloat(tela.PrecioTela || 0).toLocaleString()})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-md-2">
                                        <label className="form-label fw-medium">Stock</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            min="0"
                                            value={nuevaVariante.Stock}
                                            onChange={(e) =>
                                                setNuevaVariante(prev => ({
                                                    ...prev,
                                                    Stock: e.target.value
                                                }))
                                            }
                                        />
                                    </div>

                                    <div className="col-md-2">
                                        <label className="form-label fw-medium">Estado</label>
                                        <select
                                            className="form-select"
                                            value={nuevaVariante.Estado}
                                            onChange={(e) =>
                                                setNuevaVariante(prev => ({
                                                    ...prev,
                                                    Estado: e.target.value === "true"
                                                }))
                                            }
                                        >
                                            <option value="true">Disponible</option>
                                            <option value="false">No disponible</option>
                                        </select>
                                    </div>

                                    <div className="col-md-1 d-flex align-items-end">
                                        <button
                                            type="button"
                                            className="btn btn-success w-100"
                                            onClick={handleAgregarVariante}
                                        >
                                            <FaPlus />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 🆕 Tabla de variantes CON TELA */}
                        <h6 className="fw-bold mb-2">
                            Variantes ({variantes.length})
                        </h6>

                        {variantes.length === 0 ? (
                            <div className="alert alert-info">
                                No hay variantes. Agrega al menos una combinación de color, talla y tela.
                            </div>
                        ) : (
                            <div className="table-responsive mb-4">
                                <table className="table table-sm table-bordered">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Color</th>
                                            <th>Talla</th>
                                            <th>Tela</th>
                                            <th>Precio Total</th>
                                            <th className="text-center">Stock</th>
                                            <th className="text-center">Estado</th>
                                            <th className="text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {variantes.map((variante, index) => (
                                            <tr key={index}>
                                                <td>{variante.nombreColor}</td>
                                                <td>{variante.nombreTalla}</td>
                                                <td>
                                                    <span className={`badge ${variante.TelaID ? 'bg-info' : 'bg-secondary'}`}>
                                                        {variante.nombreTela}
                                                    </span>
                                                </td>


                                                <td className="text-success fw-medium">
                                                    ${calcularPrecioTotal(variante.TallaID, variante.TelaID).toLocaleString()}
                                                    <br />
                                                    <small className="text-muted">
                                                        (Base: ${parseFloat(productoCreado.PrecioBase || 0).toLocaleString()} +
                                                        Talla: ${parseFloat(variante.precioTalla || obtenerPrecioTalla(variante.TallaID)).toLocaleString()} +
                                                        Tela: ${parseFloat(variante.precioTela || obtenerPrecioTela(variante.TelaID)).toLocaleString()})
                                                    </small>
                                                </td>


                                                <td className="text-center">
                                                    <span className={`badge ${variante.Stock > 10 ? 'bg-success' :
                                                        variante.Stock > 0 ? 'bg-warning text-dark' :
                                                            'bg-danger'
                                                        }`}>
                                                        {variante.Stock}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span className={`badge ${variante.Estado ? 'bg-success' : 'bg-secondary'
                                                        }`}>
                                                        {variante.Estado ? 'Disponible' : 'No disponible'}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-flex justify-content-center gap-1">
                                                        <button
                                                            className="btn btn-outline-warning btn-sm"
                                                            onClick={() => handleEditarVariante(index)}
                                                            title="Editar"
                                                        >
                                                            <FaEdit size={12} />
                                                        </button>
                                                        <button
                                                            className="btn btn-outline-danger btn-sm"
                                                            onClick={() => handleEliminarVariante(index)}
                                                            title="Eliminar"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Botones finales */}
                        <div className="d-flex justify-content-end gap-2">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleVolver}
                                disabled={cargando}
                            >
                                {modoEdicion ? "Cancelar" : "Volver"}
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleGuardarVariantes}
                                disabled={cargando}
                            >
                                {cargando ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <FaCheck className="me-2" />
                                        {modoEdicion ? "Guardar Cambios" : "Finalizar"}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgregarProducto;