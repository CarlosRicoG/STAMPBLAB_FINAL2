import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

// APIs
const API_BASE_URL = 'http://localhost:3000/api';

const api = {
    getProductos: async () => {
        const res = await fetch(`${API_BASE_URL}/productos`);
        const data = await res.json();
        return data.datos || data;
    },
    getTecnicas: async () => {
        const res = await fetch(`${API_BASE_URL}/tecnicas`);
        const data = await res.json();
        return data.datos || data;
    },
    getPartes: async () => {
        const res = await fetch(`${API_BASE_URL}/partes`);
        const data = await res.json();
        return data.datos || data;
    },
    getColores: async () => {
        const res = await fetch(`${API_BASE_URL}/colores`);
        const data = await res.json();
        return data.datos || data;
    },
    getTallas: async () => {
        const res = await fetch(`${API_BASE_URL}/tallas`);
        const data = await res.json();
        return data.datos || data;
    },
    getTelas: async () => {
        const res = await fetch(`${API_BASE_URL}/insumos`);
        const data = await res.json();
        const insumos = data.datos || data;
        return insumos.filter(i => i.Tipo?.toLowerCase() === "tela");
    },
    getVariantesByProducto: async (productoID) => {
        const res = await fetch(`${API_BASE_URL}/inventarioproducto/producto/${productoID}`);
        if (!res.ok) {
            throw new Error(`Error ${res.status}: No se pudieron cargar las variantes`);
        }
        const data = await res.json();
        return data.datos || data;
    },
    createCotizacionInteligente: async (cotizacionData) => {
        const response = await fetch(`${API_BASE_URL}/cotizaciones/inteligente`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cotizacionData)
        });
        const data = await response.json();
        if (!response.ok) {
            throw { response: { data } };
        }
        return data;
    }
};

const CotizacionLanding = () => {
    // Usuario
    const [usuario, setUsuario] = useState(null);
    const [mostrarLoginModal, setMostrarLoginModal] = useState(false);

    // Estados principales
    const [traePrenda, setTraePrenda] = useState(false);

    // Catálogos completos
    const [productos, setProductos] = useState([]);
    const [tecnicas, setTecnicas] = useState([]);
    const [partes, setPartes] = useState([]);
    const [colores, setColores] = useState([]);
    const [tallas, setTallas] = useState([]);
    const [telas, setTelas] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Producto seleccionado y sus variantes
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [variantesProducto, setVariantesProducto] = useState([]);

    // Modal de selección de productos
    const [mostrarModalProductos, setMostrarModalProductos] = useState(false);

    // Formulario del producto actual
    const [formProducto, setFormProducto] = useState({
        ColorID: "",
        TallaID: "",
        TipoTela: "",
        Cantidad: 1,
        PrendaDescripcion: ""
    });

    // Diseño actual (formulario temporal)
    const [disenoActual, setDisenoActual] = useState({
        TecnicaID: "",
        ParteID: "",
        Subparte: "",
        ImagenDiseno: null,
        Observacion: ""
    });

    // Estado para editar diseño
    const [disenoEditando, setDisenoEditando] = useState(null);

    // Modal de visualización de diseño
    const [mostrarModalVisualizacion, setMostrarModalVisualizacion] = useState(false);
    const [disenoVisualizando, setDisenoVisualizando] = useState(null);

    // Tablas separadas
    const [disenosAgregados, setDisenosAgregados] = useState([]);
    const [productosEnCotizacion, setProductosEnCotizacion] = useState([]);

    // Mensajes de éxito
    const [mostrarExito, setMostrarExito] = useState(false);
    const [numeroCotizacion, setNumeroCotizacion] = useState(null);
    const [tipoCotizacion, setTipoCotizacion] = useState("");
    const [mensajeExito, setMensajeExito] = useState("");

    // ==================== EFECTOS ====================
    useEffect(() => {
        verificarAutenticacion();
        cargarDatos();
    }, []);

    useEffect(() => {
        if (productoSeleccionado && !traePrenda) {
            cargarVariantesProducto(productoSeleccionado.ProductoID);
        } else {
            setVariantesProducto([]);
            // Limpiar selecciones cuando no hay producto
            if (!productoSeleccionado || traePrenda) {
                setFormProducto(prev => ({
                    ...prev,
                    ColorID: "",
                    TallaID: "",
                    TipoTela: ""
                }));
            }
        }
    }, [productoSeleccionado, traePrenda]);

    // ==================== FUNCIONES ====================
    const verificarAutenticacion = () => {
        const usuarioStorage = localStorage.getItem("usuario");
        if (!usuarioStorage) {
            setMostrarLoginModal(true);
            return;
        }
        setUsuario(JSON.parse(usuarioStorage));
    };

    const handleIniciarSesion = () => {
        sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
        window.location.href = "/login";
    };

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const [prodData, tecData, partData, colData, tallData, telData] = await Promise.all([
                api.getProductos(),
                api.getTecnicas(),
                api.getPartes(),
                api.getColores(),
                api.getTallas(),
                api.getTelas()
            ]);

            setProductos(prodData || []);
            setTecnicas(tecData || []);
            setPartes(partData || []);
            setColores(colData || []);
            setTallas(tallData || []);
            setTelas(telData || []);
        } catch (error) {
            Swal.fire("Error", error?.message || "Error cargando catálogos", "error");
        } finally {
            setCargando(false);
        }
    };

    const cargarVariantesProducto = async (productoID) => {
        try {
            const variantesRes = await api.getVariantesByProducto(productoID);
            
            // Validar que sea un array
            if (!Array.isArray(variantesRes)) {
                console.error("Las variantes no son un array:", variantesRes);
                setVariantesProducto([]);
                return;
            }

            const variantes = variantesRes.filter(v => v.Estado && v.Stock > 0);
            setVariantesProducto(variantes);

            // Si no hay variantes disponibles, mostrar advertencia
            if (variantes.length === 0) {
                Swal.fire({
                    icon: "warning",
                    title: "Sin variantes disponibles",
                    text: "Este producto no tiene variantes en stock. Puedes continuar sin seleccionar producto específico.",
                    confirmButtonText: "Entendido"
                });
            }
        } catch (error) {
            console.error("Error cargando variantes:", error);
            setVariantesProducto([]);
            Swal.fire({
                icon: "error",
                title: "Error al cargar variantes",
                text: "No se pudieron cargar las opciones disponibles para este producto. Puedes continuar sin seleccionar producto específico.",
                confirmButtonText: "Entendido"
            });
        }
    };

    // Opciones disponibles según variantes
    const coloresDisponibles = productoSeleccionado && !traePrenda && variantesProducto.length > 0
        ? colores.filter(c => variantesProducto.some(v => v.ColorID === c.ColorID))
        : colores;

    const tallasDisponibles = productoSeleccionado && !traePrenda && variantesProducto.length > 0
        ? tallas.filter(t => variantesProducto.some(v => v.TallaID === t.TallaID))
        : tallas;

    const telasDisponibles = productoSeleccionado && !traePrenda && variantesProducto.length > 0
        ? telas.filter(t => variantesProducto.some(v => v.TelaID === t.InsumoID))
        : telas;

    // Validar stock
    const validarStockDisponible = () => {
        if (traePrenda || !productoSeleccionado || variantesProducto.length === 0) {
            return { valido: true };
        }

        const cantidadSolicitada = parseInt(formProducto.Cantidad) || 0;

        const varianteSeleccionada = variantesProducto.find(v => {
            const coincideColor = !formProducto.ColorID || v.ColorID === parseInt(formProducto.ColorID);
            const coincideTalla = !formProducto.TallaID || v.TallaID === parseInt(formProducto.TallaID);
            const coincideTela = !formProducto.TipoTela || v.TelaID === parseInt(formProducto.TipoTela);
            return coincideColor && coincideTalla && coincideTela && v.Estado;
        });

        if (!varianteSeleccionada) {
            return {
                valido: false,
                mensaje: "No existe esta combinación de producto. Por favor verifica tu selección."
            };
        }

        const stockDisponible = varianteSeleccionada.Stock || 0;

        if (stockDisponible < cantidadSolicitada) {
            return {
                valido: false,
                mensaje: `Stock insuficiente. Solo hay ${stockDisponible} unidad(es) disponible(s).`,
                stockDisponible
            };
        }

        return { valido: true, stockDisponible };
    };

    // ==================== FUNCIONES DE DISEÑO ====================
    const handleAgregarDiseno = () => {
        if (!disenoActual.TecnicaID || !disenoActual.ParteID) {
            Swal.fire("Atención", "Selecciona técnica y parte", "warning");
            return;
        }

        const tecnica = tecnicas.find(t => t.TecnicaID === parseInt(disenoActual.TecnicaID));
        const parte = partes.find(p => p.ParteID === parseInt(disenoActual.ParteID));

        const disenoCompleto = {
            id: Date.now(),
            TecnicaID: parseInt(disenoActual.TecnicaID),
            ParteID: parseInt(disenoActual.ParteID),
            tecnica,
            parte,
            Subparte: disenoActual.Subparte,
            ImagenDiseno: disenoActual.ImagenDiseno,
            ImagenNombre: disenoActual.ImagenDiseno?.name || "Sin archivo",
            Observacion: disenoActual.Observacion
        };

        setDisenosAgregados(prev => [...prev, disenoCompleto]);
        
        // Limpiar formulario de diseño
        setDisenoActual({
            TecnicaID: "",
            ParteID: "",
            Subparte: "",
            ImagenDiseno: null,
            Observacion: ""
        });

        Swal.fire({
            icon: "success",
            title: "Diseño agregado",
            text: "Puedes seguir agregando más diseños",
            timer: 1500,
            showConfirmButton: false
        });
    };

    const handleEditarDiseno = (diseno) => {
        setDisenoEditando(diseno);
        setDisenoActual({
            TecnicaID: diseno.TecnicaID.toString(),
            ParteID: diseno.ParteID.toString(),
            Subparte: diseno.Subparte,
            ImagenDiseno: null, // No podemos recuperar el archivo
            Observacion: diseno.Observacion
        });
    };

    const handleGuardarEdicion = () => {
        if (!disenoActual.TecnicaID || !disenoActual.ParteID) {
            Swal.fire("Atención", "Selecciona técnica y parte", "warning");
            return;
        }

        const tecnica = tecnicas.find(t => t.TecnicaID === parseInt(disenoActual.TecnicaID));
        const parte = partes.find(p => p.ParteID === parseInt(disenoActual.ParteID));

        setDisenosAgregados(prev => prev.map(d => {
            if (d.id === disenoEditando.id) {
                return {
                    ...d,
                    TecnicaID: parseInt(disenoActual.TecnicaID),
                    ParteID: parseInt(disenoActual.ParteID),
                    tecnica,
                    parte,
                    Subparte: disenoActual.Subparte,
                    ImagenDiseno: disenoActual.ImagenDiseno || d.ImagenDiseno,
                    ImagenNombre: disenoActual.ImagenDiseno?.name || d.ImagenNombre,
                    Observacion: disenoActual.Observacion
                };
            }
            return d;
        }));

        setDisenoEditando(null);
        setDisenoActual({
            TecnicaID: "",
            ParteID: "",
            Subparte: "",
            ImagenDiseno: null,
            Observacion: ""
        });

        Swal.fire({
            icon: "success",
            title: "Diseño actualizado",
            timer: 1500,
            showConfirmButton: false
        });
    };

    const handleCancelarEdicion = () => {
        setDisenoEditando(null);
        setDisenoActual({
            TecnicaID: "",
            ParteID: "",
            Subparte: "",
            ImagenDiseno: null,
            Observacion: ""
        });
    };

    const handleVisualizarDiseno = (diseno) => {
        setDisenoVisualizando(diseno);
        setMostrarModalVisualizacion(true);
    };

    const handleEliminarDiseno = (id) => {
        Swal.fire({
            title: "¿Eliminar diseño?",
            text: "Esta acción no se puede deshacer",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#d33"
        }).then((result) => {
            if (result.isConfirmed) {
                setDisenosAgregados(prev => prev.filter(d => d.id !== id));
                Swal.fire({
                    icon: "success",
                    title: "Diseño eliminado",
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    };

    // ==================== AGREGAR PRODUCTO A COTIZACIÓN ====================
    const handleAgregarACotizacion = () => {
        if (traePrenda) {
            if (!formProducto.PrendaDescripcion.trim()) {
                Swal.fire("Atención", "Describe la prenda que traes", "warning");
                return;
            }
        } else {
            // Cuando NO trae prenda, validar campos básicos
            if (coloresDisponibles.length > 0 && !formProducto.ColorID) {
                Swal.fire("Atención", "Selecciona un color", "warning");
                return;
            }
            if (tallasDisponibles.length > 0 && !formProducto.TallaID) {
                Swal.fire("Atención", "Selecciona una talla", "warning");
                return;
            }
            if (telasDisponibles.length > 0 && !formProducto.TipoTela) {
                Swal.fire("Atención", "Selecciona un tipo de tela", "warning");
                return;
            }

            // Validar stock solo si hay producto seleccionado
            if (productoSeleccionado && variantesProducto.length > 0) {
                const validacionStock = validarStockDisponible();
                if (!validacionStock.valido) {
                    Swal.fire({
                        icon: "error",
                        title: "Stock insuficiente",
                        html: `
                            <p>${validacionStock.mensaje}</p>
                            ${validacionStock.stockDisponible !== undefined ?
                                `<p class="mt-2"><strong>Stock disponible:</strong> ${validacionStock.stockDisponible} unidades</p>` :
                                ''
                            }
                        `,
                        confirmButtonColor: "#d33"
                    });
                    return;
                }
            }
        }

        const productoCompleto = {
            id: Date.now(),
            ProductoID: productoSeleccionado?.ProductoID || null,
            producto: productoSeleccionado,
            Cantidad: parseInt(formProducto.Cantidad),
            TraePrenda: traePrenda,
            PrendaDescripcion: traePrenda ? formProducto.PrendaDescripcion : "",
            
            ColorID: !traePrenda && formProducto.ColorID ? parseInt(formProducto.ColorID) : null,
            TallaID: !traePrenda && formProducto.TallaID ? parseInt(formProducto.TallaID) : null,
            TipoTela: !traePrenda && formProducto.TipoTela ? parseInt(formProducto.TipoTela) : null,
            
            color: !traePrenda && formProducto.ColorID ? colores.find(c => c.ColorID == formProducto.ColorID) : null,
            talla: !traePrenda && formProducto.TallaID ? tallas.find(t => t.TallaID == formProducto.TallaID) : null,
            tela: !traePrenda && formProducto.TipoTela ? telas.find(t => t.InsumoID == formProducto.TipoTela) : null,
            
            disenos: [...disenosAgregados]
        };

        setProductosEnCotizacion(prev => [...prev, productoCompleto]);

        // Limpiar todo
        setProductoSeleccionado(null);
        setFormProducto({
            ColorID: "",
            TallaID: "",
            TipoTela: "",
            Cantidad: 1,
            PrendaDescripcion: ""
        });
        setDisenosAgregados([]);
        setDisenoEditando(null);

        Swal.fire({
            icon: "success",
            title: "¡Agregado a la cotización!",
            text: `Producto agregado con ${productoCompleto.disenos.length} diseño(s)`,
            timer: 2000,
            showConfirmButton: false
        });
    };

    const handleEliminarProductoDeCotizacion = (id) => {
        Swal.fire({
            title: "¿Eliminar producto?",
            text: "Se eliminarán todos los diseños asociados",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#d33"
        }).then((result) => {
            if (result.isConfirmed) {
                setProductosEnCotizacion(prev => prev.filter(p => p.id !== id));
            }
        });
    };

    // ==================== GENERAR COTIZACIÓN ====================
    const handleGenerarCotizacion = async () => {
        if (!usuario) {
            setMostrarLoginModal(true);
            return;
        }

        if (productosEnCotizacion.length === 0) {
            Swal.fire("Atención", "Debes agregar al menos un producto a la cotización", "warning");
            return;
        }

        try {
            const detalles = productosEnCotizacion.map(prod => ({
                // FIX CRÍTICO: Siempre enviar ProductoID, incluso si es null
                ProductoID: prod.ProductoID || null,
                Cantidad: prod.Cantidad,
                TraePrenda: prod.TraePrenda,
                PrendaDescripcion: prod.PrendaDescripcion || "",

                tallas: !prod.TraePrenda && prod.TallaID ? [{
                    TallaID: prod.TallaID,
                    Cantidad: prod.Cantidad,
                    PrecioTalla: prod.talla?.Precio || 0
                }] : [],

                colores: !prod.TraePrenda && prod.ColorID ? [{
                    ColorID: prod.ColorID,
                    Cantidad: prod.Cantidad
                }] : [],

                insumos: !prod.TraePrenda && prod.TipoTela ? [{
                    InsumoID: prod.TipoTela,
                    CantidadRequerida: prod.Cantidad
                }] : [],

                tecnicas: prod.disenos.map(dis => ({
                    TecnicaID: dis.TecnicaID,
                    ParteID: dis.ParteID,
                    ImagenDiseño: dis.ImagenNombre,
                    Observaciones: `${dis.Subparte ? 'Subparte: ' + dis.Subparte + ' - ' : ''}${dis.Observacion}`,
                    CostoTecnica: 0
                }))
            }));

            const cotizacionData = {
                DocumentoID: usuario.DocumentoID,
                FechaCotizacion: new Date().toISOString(),
                detalles
            };

            console.log("Enviando cotización:", JSON.stringify(cotizacionData, null, 2));

            const response = await api.createCotizacionInteligente(cotizacionData);

            const esCotizacion = response.tipo === 'cotizacion';

            setTipoCotizacion(esCotizacion ? 'cotización' : 'venta');
            setNumeroCotizacion(
                esCotizacion
                    ? response?.cotizacion?.CotizacionID
                    : response?.venta?.VentaID
            );
            setMensajeExito(response.mensaje || "");
            setMostrarExito(true);

            // Limpiar todo
            setProductosEnCotizacion([]);
            setDisenosAgregados([]);
            setProductoSeleccionado(null);
            setTraePrenda(false);
            setDisenoEditando(null);
            setFormProducto({
                ColorID: "",
                TallaID: "",
                TipoTela: "",
                Cantidad: 1,
                PrendaDescripcion: ""
            });

        } catch (error) {
            console.error("Error generando cotización:", error);

            const errorMsg = error?.response?.data?.message || error?.message || "Error al procesar tu solicitud";

            if (errorMsg.includes('Stock insuficiente') || errorMsg.includes('stock')) {
                Swal.fire({
                    icon: "error",
                    title: "Stock insuficiente",
                    text: errorMsg,
                    confirmButtonColor: "#d33"
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: errorMsg,
                    confirmButtonColor: "#d33"
                });
            }
        }
    };

    // ==================== RENDER ====================
    if (cargando) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
                <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }}>
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    const validacionStock = validarStockDisponible();

    return (
        <div className="container py-4">
            {/* Modal de Login */}
            {mostrarLoginModal && (
                <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Autenticación Requerida</h5>
                            </div>
                            <div className="modal-body text-center">
                                <p className="mb-4">Debes iniciar sesión para cotizar productos</p>
                                <button className="btn btn-primary" onClick={handleIniciarSesion}>
                                    Iniciar Sesión
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Éxito */}
            {mostrarExito && (
                <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-success text-white">
                                <h5 className="modal-title">
                                    {tipoCotizacion === 'cotización' ? '¡Cotización Generada!' : '¡Venta Registrada!'}
                                </h5>
                            </div>
                            <div className="modal-body text-center">
                                <h3 className="text-success mb-3">¡Éxito!</h3>
                                <p className="fs-5 mb-2">
                                    <strong>
                                        {tipoCotizacion === 'cotización'
                                            ? 'Ya estamos cotizando tu producto'
                                            : 'Tu pedido ha sido registrado'}
                                    </strong>
                                </p>
                                <p className="mb-3">
                                    Número de {tipoCotizacion}: <strong className="text-primary">#{numeroCotizacion}</strong>
                                </p>
                                <p className="text-muted small">{mensajeExito}</p>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-primary" onClick={() => setMostrarExito(false)}>
                                    Entendido
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Visualización de Diseño */}
            {mostrarModalVisualizacion && disenoVisualizando && (
                <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-info text-white">
                                <h5 className="modal-title">Detalle del Diseño</h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setMostrarModalVisualizacion(false)}
                                />
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <strong>Técnica:</strong>
                                        <p className="mb-0">{disenoVisualizando.tecnica?.Nombre || "N/A"}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <strong>Parte de la prenda:</strong>
                                        <p className="mb-0">{disenoVisualizando.parte?.Nombre || "N/A"}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <strong>Subparte:</strong>
                                        <p className="mb-0">{disenoVisualizando.Subparte || "No especificada"}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <strong>Archivo:</strong>
                                        <p className="mb-0 text-success">{disenoVisualizando.ImagenNombre}</p>
                                    </div>
                                    <div className="col-12">
                                        <strong>Observaciones:</strong>
                                        <p className="mb-0">{disenoVisualizando.Observacion || "Sin observaciones"}</p>
                                    </div>
                                    {disenoVisualizando.ImagenDiseno && (
                                        <div className="col-12">
                                            <strong>Vista previa:</strong>
                                            <div className="border rounded p-2 mt-2 text-center">
                                                <img
                                                    src={URL.createObjectURL(disenoVisualizando.ImagenDiseno)}
                                                    alt="Diseño"
                                                    style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain" }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setMostrarModalVisualizacion(false)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Selección de Productos */}
            {mostrarModalProductos && (
                <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Selecciona un Producto</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setMostrarModalProductos(false)}
                                />
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    {productos.map(producto => (
                                        <div key={producto.ProductoID} className="col-md-6">
                                            <div
                                                className="card h-100 shadow-sm"
                                                style={{ cursor: "pointer", transition: "transform 0.2s" }}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                                onClick={() => {
                                                    setProductoSeleccionado(producto);
                                                    setMostrarModalProductos(false);
                                                    Swal.fire({
                                                        icon: "success",
                                                        title: "Producto seleccionado",
                                                        text: producto.Nombre,
                                                        timer: 1500,
                                                        showConfirmButton: false
                                                    });
                                                }}
                                            >
                                                <img
                                                    src={producto.ImagenProducto || "https://via.placeholder.com/150"}
                                                    className="card-img-top"
                                                    alt={producto.Nombre}
                                                    style={{ height: "200px", objectFit: "cover" }}
                                                />
                                                <div className="card-body">
                                                    <h6 className="card-title fw-bold">{producto.Nombre}</h6>
                                                    <p className="card-text text-muted small">{producto.Descripcion}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Título */}
            <div className="text-center mb-4">
                <h2 className="fw-bold" style={{ color: "#1976d2" }}>Formulario de Cotización</h2>
                {usuario && <p className="text-muted">👤 Usuario: {usuario.Nombre}</p>}
            </div>

            {/* Formulario Principal */}
            <div className="row g-4">
                {/* COLUMNA IZQUIERDA: Formulario */}
                <div className="col-lg-8">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">Configuración del Producto</h5>
                        </div>
                        <div className="card-body">
                            {/* ¿Traes la prenda? */}
                            <div className="mb-4">
                                <div className="form-check form-switch">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="traePrenda"
                                        checked={traePrenda}
                                        onChange={(e) => {
                                            setTraePrenda(e.target.checked);
                                            setProductoSeleccionado(null);
                                            setFormProducto({
                                                ColorID: "",
                                                TallaID: "",
                                                TipoTela: "",
                                                Cantidad: 1,
                                                PrendaDescripcion: ""
                                            });
                                        }}
                                    />
                                    <label className="form-check-label fw-bold" htmlFor="traePrenda">
                                        ¿Traes tu propia prenda?
                                    </label>
                                </div>
                            </div>

                            {/* Campos según trae prenda */}
                            {traePrenda ? (
                                <>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Descripción de la prenda <span className="text-danger">*</span></label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            placeholder="Describe la prenda que traes (tipo, material, color, etc.)..."
                                            value={formProducto.PrendaDescripcion}
                                            onChange={(e) => setFormProducto({
                                                ...formProducto,
                                                PrendaDescripcion: e.target.value
                                            })}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Cantidad de prendas <span className="text-danger">*</span></label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            min="1"
                                            value={formProducto.Cantidad}
                                            onChange={(e) => setFormProducto({
                                                ...formProducto,
                                                Cantidad: parseInt(e.target.value) || 1
                                            })}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="mb-3">
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary w-100 py-3"
                                            onClick={() => setMostrarModalProductos(true)}
                                        >
                                            {productoSeleccionado 
                                                ? `✓ ${productoSeleccionado.Nombre} (Click para cambiar)` 
                                                : "Seleccionar Producto del Catálogo (Opcional)"}
                                        </button>
                                        <small className="text-muted d-block mt-2">
                                            * Opcional: Puedes cotizar solo con las características básicas
                                        </small>
                                    </div>

                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">
                                                Color <span className="text-danger">*</span>
                                                {productoSeleccionado && variantesProducto.length === 0 && (
                                                    <small className="text-warning ms-2">(Sin variantes)</small>
                                                )}
                                            </label>
                                            <select
                                                className="form-select"
                                                value={formProducto.ColorID}
                                                onChange={(e) => setFormProducto({
                                                    ...formProducto,
                                                    ColorID: e.target.value
                                                })}
                                            >
                                                <option value="">Seleccione...</option>
                                                {coloresDisponibles.map(c => (
                                                    <option key={c.ColorID} value={c.ColorID}>
                                                        {c.Nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">
                                                Talla <span className="text-danger">*</span>
                                                {productoSeleccionado && variantesProducto.length === 0 && (
                                                    <small className="text-warning ms-2">(Sin variantes)</small>
                                                )}
                                            </label>
                                            <select
                                                className="form-select"
                                                value={formProducto.TallaID}
                                                onChange={(e) => setFormProducto({
                                                    ...formProducto,
                                                    TallaID: e.target.value
                                                })}
                                            >
                                                <option value="">Seleccione...</option>
                                                {tallasDisponibles.map(t => (
                                                    <option key={t.TallaID} value={t.TallaID}>
                                                        {t.Nombre} {t.Precio ? `(+${t.Precio})` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">
                                                Tipo de Tela <span className="text-danger">*</span>
                                                {productoSeleccionado && variantesProducto.length === 0 && (
                                                    <small className="text-warning ms-2">(Sin variantes)</small>
                                                )}
                                            </label>
                                            <select
                                                className="form-select"
                                                value={formProducto.TipoTela}
                                                onChange={(e) => setFormProducto({
                                                    ...formProducto,
                                                    TipoTela: e.target.value
                                                })}
                                            >
                                                <option value="">Seleccione...</option>
                                                {telasDisponibles.map(t => (
                                                    <option key={t.InsumoID} value={t.InsumoID}>
                                                        {t.Nombre} {t.PrecioTela ? `(+${t.PrecioTela})` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Cantidad <span className="text-danger">*</span></label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                min="1"
                                                value={formProducto.Cantidad}
                                                onChange={(e) => setFormProducto({
                                                    ...formProducto,
                                                    Cantidad: parseInt(e.target.value) || 1
                                                })}
                                            />
                                            {validacionStock.stockDisponible !== undefined && (
                                                <small className="text-muted">
                                                    Stock disponible: {validacionStock.stockDisponible} unidades
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* SECCIÓN DE DISEÑOS */}
                    <div className="card shadow mt-3">
                        <div className="card-header bg-info text-white">
                            <h5 className="mb-0">
                                Diseños Personalizados
                                {disenoEditando && <span className="badge bg-warning text-dark ms-2">Editando</span>}
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3 mb-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Técnica</label>
                                    <select
                                        className="form-select"
                                        value={disenoActual.TecnicaID}
                                        onChange={(e) => setDisenoActual({
                                            ...disenoActual,
                                            TecnicaID: e.target.value
                                        })}
                                    >
                                        <option value="">Seleccione...</option>
                                        {tecnicas.map(t => (
                                            <option key={t.TecnicaID} value={t.TecnicaID}>
                                                {t.Nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Parte de la prenda</label>
                                    <select
                                        className="form-select"
                                        value={disenoActual.ParteID}
                                        onChange={(e) => setDisenoActual({
                                            ...disenoActual,
                                            ParteID: e.target.value
                                        })}
                                    >
                                        <option value="">Seleccione...</option>
                                        {partes.map(p => (
                                            <option key={p.ParteID} value={p.ParteID}>
                                                {p.Nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Subparte (opcional)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Ej: Superior izquierdo, centro, etc."
                                        value={disenoActual.Subparte}
                                        onChange={(e) => setDisenoActual({
                                            ...disenoActual,
                                            Subparte: e.target.value
                                        })}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Subir diseño (imagen)</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept="image/*"
                                        onChange={(e) => setDisenoActual({
                                            ...disenoActual,
                                            ImagenDiseno: e.target.files[0]
                                        })}
                                    />
                                    {disenoActual.ImagenDiseno && (
                                        <small className="text-success d-block mt-1">
                                            ✓ {disenoActual.ImagenDiseno.name}
                                        </small>
                                    )}
                                    {disenoEditando && !disenoActual.ImagenDiseno && (
                                        <small className="text-info d-block mt-1">
                                            Mantiene archivo: {disenoEditando.ImagenNombre}
                                        </small>
                                    )}
                                </div>

                                <div className="col-12">
                                    <label className="form-label fw-bold">Observaciones</label>
                                    <textarea
                                        className="form-control"
                                        rows="2"
                                        placeholder="Detalles adicionales del diseño (colores, tamaño, posición exacta, etc.)"
                                        value={disenoActual.Observacion}
                                        onChange={(e) => setDisenoActual({
                                            ...disenoActual,
                                            Observacion: e.target.value
                                        })}
                                    />
                                </div>
                            </div>

                            {disenoEditando ? (
                                <div className="d-flex gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-success flex-grow-1"
                                        onClick={handleGuardarEdicion}
                                    >
                                        Guardar Cambios
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleCancelarEdicion}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="btn btn-success w-100"
                                    onClick={handleAgregarDiseno}
                                >
                                    Agregar Diseño
                                </button>
                            )}

                            {/* TABLA DE DISEÑOS AGREGADOS */}
                            {disenosAgregados.length > 0 && (
                                <div className="mt-3">
                                    <div className="alert alert-info">
                                        <strong>Diseños agregados:</strong> {disenosAgregados.length}
                                    </div>
                                    <div className="table-responsive">
                                        <table className="table table-sm table-bordered">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Técnica</th>
                                                    <th>Parte</th>
                                                    <th>Subparte</th>
                                                    <th>Archivo</th>
                                                    <th style={{ width: "150px" }}>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {disenosAgregados.map((dis, idx) => (
                                                    <tr key={dis.id}>
                                                        <td>{idx + 1}</td>
                                                        <td>{dis.tecnica?.Nombre}</td>
                                                        <td>{dis.parte?.Nombre}</td>
                                                        <td>{dis.Subparte || "—"}</td>
                                                        <td>
                                                            <small className="text-success">{dis.ImagenNombre}</small>
                                                        </td>
                                                        <td>
                                                            <div className="btn-group btn-group-sm" role="group">
                                                                <button
                                                                    className="btn btn-info"
                                                                    title="Ver detalle"
                                                                    onClick={() => handleVisualizarDiseno(dis)}
                                                                >
                                                                    👁️
                                                                </button>
                                                                <button
                                                                    className="btn btn-warning"
                                                                    title="Editar"
                                                                    onClick={() => handleEditarDiseno(dis)}
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    className="btn btn-danger"
                                                                    title="Eliminar"
                                                                    onClick={() => handleEliminarDiseno(dis.id)}
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BOTÓN AGREGAR A COTIZACIÓN */}
                    <div className="mt-3 d-grid">
                        <button
                            type="button"
                            className="btn btn-primary btn-lg"
                            onClick={handleAgregarACotizacion}
                        >
                            Agregar a la Cotización
                        </button>
                        <small className="text-muted text-center mt-2">
                            Este producto se agregará con todos los diseños configurados
                        </small>
                    </div>
                </div>

                {/* COLUMNA DERECHA: Resumen */}
                <div className="col-lg-4">
                    <div className="card shadow mb-3">
                        <div className="card-header bg-success text-white">
                            <h6 className="mb-0">Detalle de Productos</h6>
                        </div>
                        <div className="card-body">
                            {productosEnCotizacion.length === 0 ? (
                                <p className="text-muted text-center mb-0">
                                    No hay productos agregados aún
                                </p>
                            ) : (
                                <div className="list-group">
                                    {productosEnCotizacion.map((prod, idx) => (
                                        <div key={prod.id} className="list-group-item">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <strong className="text-primary">Producto #{idx + 1}</strong>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleEliminarProductoDeCotizacion(prod.id)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                            
                                            {prod.TraePrenda ? (
                                                <>
                                                    <p className="mb-1 small">
                                                        <strong>Prenda propia:</strong> {prod.PrendaDescripcion}
                                                    </p>
                                                    <p className="mb-1 small">
                                                        <strong>Cantidad:</strong> {prod.Cantidad}
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    {prod.producto && (
                                                        <p className="mb-1 small">
                                                            <strong>Producto:</strong> {prod.producto.Nombre}
                                                        </p>
                                                    )}
                                                    {prod.color && (
                                                        <p className="mb-1 small">
                                                            <strong>Color:</strong> {prod.color.Nombre}
                                                        </p>
                                                    )}
                                                    {prod.talla && (
                                                        <p className="mb-1 small">
                                                            <strong>Talla:</strong> {prod.talla.Nombre}
                                                        </p>
                                                    )}
                                                    {prod.tela && (
                                                        <p className="mb-1 small">
                                                            <strong>Tela:</strong> {prod.tela.Nombre}
                                                        </p>
                                                    )}
                                                    <p className="mb-1 small">
                                                        <strong>Cantidad:</strong> {prod.Cantidad}
                                                    </p>
                                                </>
                                            )}
                                            
                                            <p className="mb-0 small">
                                                <span className="badge bg-info">
                                                    {prod.disenos.length} diseño(s)
                                                </span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {disenosAgregados.length > 0 && (
                        <div className="card shadow mb-3">
                            <div className="card-header bg-warning">
                                <h6 className="mb-0">Diseños del Producto Actual</h6>
                            </div>
                            <div className="card-body">
                                <p className="small text-muted mb-2">
                                    Estos diseños se agregarán al producto cuando presiones "Agregar a la Cotización"
                                </p>
                                <ul className="list-unstyled mb-0">
                                    {disenosAgregados.map((dis, idx) => (
                                        <li key={dis.id} className="mb-2 pb-2 border-bottom">
                                            <small>
                                                <strong>#{idx + 1}</strong> {dis.tecnica?.Nombre} en {dis.parte?.Nombre}
                                                {dis.Subparte && ` (${dis.Subparte})`}
                                            </small>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {productosEnCotizacion.length > 0 && (
                        <div className="d-grid gap-2">
                            <button
                                type="button"
                                className="btn btn-success btn-lg"
                                onClick={handleGenerarCotizacion}
                            >
                                Generar Cotización
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => {
                                    Swal.fire({
                                        title: "¿Limpiar toda la cotización?",
                                        text: "Se eliminarán todos los productos agregados",
                                        icon: "warning",
                                        showCancelButton: true,
                                        confirmButtonText: "Sí, limpiar",
                                        cancelButtonText: "Cancelar"
                                    }).then((result) => {
                                        if (result.isConfirmed) {
                                            setProductosEnCotizacion([]);
                                            setDisenosAgregados([]);
                                            setProductoSeleccionado(null);
                                            setTraePrenda(false);
                                            setDisenoEditando(null);
                                            setFormProducto({
                                                ColorID: "",
                                                TallaID: "",
                                                TipoTela: "",
                                                Cantidad: 1,
                                                PrendaDescripcion: ""
                                            });
                                        }
                                    });
                                }}
                            >
                                Limpiar Todo
                            </button>
                        </div>
                    )}

                    <div className="card shadow mt-3">
                        <div className="card-body text-center">
                            <h5 className="mb-3">Resumen</h5>
                            <div className="d-flex justify-content-around">
                                <div>
                                    <div className="display-6 text-primary">{productosEnCotizacion.length}</div>
                                    <small className="text-muted">Productos</small>
                                </div>
                                <div>
                                    <div className="display-6 text-info">
                                        {productosEnCotizacion.reduce((sum, p) => sum + p.disenos.length, 0)}
                                    </div>
                                    <small className="text-muted">Diseños</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CotizacionLanding;