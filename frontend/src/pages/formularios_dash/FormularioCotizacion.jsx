// ============================================
// ACTUALIZAR FormularioCotizacion.jsx
// ============================================

import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import {
    createCotizacionCompleta,
    getColores,
    getTallas,
    getTelas,
    getTecnicas,
    getPartes
} from "../../Services/api-cotizacion-landing/cotizacion-landing";
import { getUsuarios } from "../../Services/api-usuarios/usuarios";
import { getProductos } from "../../Services/api-productos/productos";
import { getVariantesByProducto } from "../../Services/api-productos/variantes"; // 🆕 IMPORTAR

const FormularioCotizacion = ({ onClose, onActualizar }) => {
    // Estados de catálogos
    const [usuarios, setUsuarios] = useState([]);
    const [productos, setProductos] = useState([]);
    const [colores, setColores] = useState([]);
    const [tallas, setTallas] = useState([]);
    const [telas, setTelas] = useState([]);
    const [tecnicas, setTecnicas] = useState([]);
    const [partes, setPartes] = useState([]);

    // 🆕 Estados para VARIANTES FILTRADAS
    const [variantesDisponibles, setVariantesDisponibles] = useState([]);
    const [coloresFiltrados, setColoresFiltrados] = useState([]);
    const [tallasFiltradas, setTallasFiltradas] = useState([]);
    const [telasFiltradas, setTelasFiltradas] = useState([]);

    // Estados del formulario
    const [documentoID, setDocumentoID] = useState("");
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [cantidad, setCantidad] = useState(1);
    const [colorID, setColorID] = useState("");
    const [tallaID, setTallaID] = useState("");
    const [telaID, setTelaID] = useState("");
    const [traePrenda, setTraePrenda] = useState(false);
    const [prendaDescripcion, setPrendaDescripcion] = useState("");

    // Estados de diseños
    const [disenos, setDisenos] = useState([]);
    const [tecnicaID, setTecnicaID] = useState("");
    const [parteID, setParteID] = useState("");
    const [subparteDescripcion, setSubparteDescripcion] = useState("");
    const [archivoDiseno, setArchivoDiseno] = useState(null);
    const [observacionDiseno, setObservacionDiseno] = useState("");

    const [cargando, setCargando] = useState(false);

    // ============================================
    // CARGAR CATÁLOGOS AL MONTAR
    // ============================================
    useEffect(() => {
        cargarCatalogos();
    }, []);

    const cargarCatalogos = async () => {
        try {
            const [usuariosRes, productosRes, coloresRes, tallasRes, telasRes, tecnicasRes, partesRes] = await Promise.all([
                getUsuarios(),
                getProductos(),
                getColores(),
                getTallas(),
                getTelas(),
                getTecnicas(),
                getPartes()
            ]);

            setUsuarios(usuariosRes?.datos || usuariosRes || []);
            setProductos(productosRes?.datos || productosRes || []);
            setColores(coloresRes?.datos || coloresRes || []);
            setTallas(tallasRes?.datos || tallasRes || []);
            setTelas(telasRes || []);
            setTecnicas(tecnicasRes || []);
            setPartes(partesRes || []);
        } catch (error) {
            console.error("Error al cargar catálogos:", error);
            Swal.fire("Error", "No se pudieron cargar los catálogos", "error");
        }
    };

    // ============================================
    // 🆕 FUNCIÓN: FILTRAR OPCIONES POR VARIANTES
    // ============================================
    const filtrarOpcionesPorVariantes = (variantes) => {
        if (!variantes || variantes.length === 0) {
            setColoresFiltrados([]);
            setTallasFiltradas([]);
            setTelasFiltradas([]);
            return;
        }

        // Extraer IDs únicos de las variantes disponibles
        const coloresUnicos = [...new Set(variantes.map(v => v.ColorID))];
        const tallasUnicas = [...new Set(variantes.map(v => v.TallaID))];
        const telasUnicas = [...new Set(variantes.map(v => v.TelaID).filter(Boolean))];

        // Filtrar catálogos completos
        const coloresFilt = colores.filter(c => coloresUnicos.includes(c.ColorID));
        const tallasFilt = tallas.filter(t => tallasUnicas.includes(t.TallaID));
        const telasFilt = telas.filter(t => telasUnicas.includes(t.InsumoID));

        setColoresFiltrados(coloresFilt);
        setTallasFiltradas(tallasFilt);
        setTelasFiltradas(telasFilt);

        console.log('🔍 Variantes filtradas:');
        console.log('   Colores disponibles:', coloresFilt.map(c => c.Nombre));
        console.log('   Tallas disponibles:', tallasFilt.map(t => t.Nombre));
        console.log('   Telas disponibles:', telasFilt.map(t => t.Nombre));
    };

    // ============================================
    // 🆕 FUNCIÓN ACTUALIZADA: Seleccionar producto
    // ============================================
    const handleSeleccionarProducto = async (productoID) => {
        const producto = productos.find(p => p.ProductoID === parseInt(productoID));
        setProductoSeleccionado(producto);

        // Resetear campos
        setCantidad(1);
        setColorID("");
        setTallaID("");
        setTelaID("");
        setTraePrenda(false);
        setPrendaDescripcion("");
        setDisenos([]);

        // 🆕 Cargar variantes del producto
        if (producto) {
            setCargando(true);
            try {
                const response = await getVariantesByProducto(producto.ProductoID);
                const variantes = response.datos || response || [];
                
                setVariantesDisponibles(variantes);
                filtrarOpcionesPorVariantes(variantes);

                if (variantes.length === 0) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Sin variantes',
                        text: 'Este producto no tiene variantes registradas en inventario. Crea variantes antes de cotizar.',
                        confirmButtonText: 'Entendido'
                    });
                }
            } catch (error) {
                console.error("Error al cargar variantes:", error);
                Swal.fire("Error", "No se pudieron cargar las variantes del producto", "error");
                setVariantesDisponibles([]);
                setColoresFiltrados([]);
                setTallasFiltradas([]);
                setTelasFiltradas([]);
            } finally {
                setCargando(false);
            }
        }
    };

    // ============================================
    // CALCULAR PRECIOS (sin cambios)
    // ============================================
    const calcularPrecios = () => {
        if (!productoSeleccionado) {
            return {
                precioBase: 0,
                precioTalla: 0,
                precioTela: 0,
                precioUnitario: 0,
                subtotal: 0,
                cantidad: 1
            };
        }

        const cantidadNum = parseInt(cantidad) || 1;

        if (traePrenda) {
            const precioBase = parseFloat(productoSeleccionado.PrecioBase) || 0;
            return {
                precioBase,
                precioTalla: 0,
                precioTela: 0,
                precioUnitario: precioBase,
                subtotal: precioBase * cantidadNum,
                cantidad: cantidadNum
            };
        }

        const precioBase = parseFloat(productoSeleccionado.PrecioBase) || 0;
        const talla = tallas.find(t => t.TallaID === parseInt(tallaID));
        const tela = telas.find(t => t.InsumoID === parseInt(telaID));

        const precioTalla = talla ? (parseFloat(talla.Precio) || 0) : 0;
        const precioTela = tela ? (parseFloat(tela.PrecioTela) || 0) : 0;

        const precioUnitario = precioBase + precioTalla + precioTela;
        const subtotal = precioUnitario * cantidadNum;

        return {
            precioBase,
            precioTalla,
            precioTela,
            precioUnitario,
            subtotal,
            cantidad: cantidadNum
        };
    };

    const precios = calcularPrecios();

    // ============================================
    // RESTO DE FUNCIONES (sin cambios)
    // ============================================
    const handleAgregarDiseno = () => {
        if (!tecnicaID || !parteID) {
            Swal.fire("Atención", "Selecciona técnica y parte", "warning");
            return;
        }

        const tecnica = tecnicas.find(t => t.TecnicaID === parseInt(tecnicaID));
        const parte = partes.find(p => p.ParteID === parseInt(parteID));

        setDisenos([...disenos, {
            id: Date.now(),
            TecnicaID: parseInt(tecnicaID),
            TecnicaNombre: tecnica?.Nombre,
            ParteID: parseInt(parteID),
            ParteNombre: parte?.Nombre,
            SubparteDescripcion: subparteDescripcion,
            Archivo: archivoDiseno,
            ImagenNombre: archivoDiseno?.name || "Sin archivo",
            Observaciones: observacionDiseno
        }]);

        setTecnicaID("");
        setParteID("");
        setSubparteDescripcion("");
        setArchivoDiseno(null);
        setObservacionDiseno("");
    };

    const handleEliminarDiseno = (id) => {
        setDisenos(disenos.filter(d => d.id !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!documentoID) {
            Swal.fire("Atención", "Selecciona un cliente", "warning");
            return;
        }

        if (!productoSeleccionado) {
            Swal.fire("Atención", "Selecciona un producto", "warning");
            return;
        }

        // 🆕 Validar que el producto tenga variantes
        if (variantesDisponibles.length === 0 && !traePrenda) {
            Swal.fire("Atención", "Este producto no tiene variantes disponibles", "warning");
            return;
        }

        if (!traePrenda) {
            if (!colorID) {
                Swal.fire("Atención", "Debes seleccionar un color", "warning");
                return;
            }
            if (!tallaID) {
                Swal.fire("Atención", "Debes seleccionar una talla", "warning");
                return;
            }
            if (!telaID) {
                Swal.fire("Atención", "Debes seleccionar un tipo de tela", "warning");
                return;
            }
        }

        if (traePrenda && !prendaDescripcion.trim()) {
            Swal.fire("Atención", "Describe la prenda que traerá el cliente", "warning");
            return;
        }

        console.log('📋 DATOS ANTES DE ENVIAR:');
        console.log('ProductoID:', productoSeleccionado.ProductoID);
        console.log('ColorID:', colorID);
        console.log('TallaID:', tallaID);
        console.log('TelaID:', telaID);
        console.log('Trae prenda:', traePrenda);

        setCargando(true);
        try {
            const detalles = [{
                ProductoID: productoSeleccionado.ProductoID,
                Cantidad: parseInt(cantidad),
                TraePrenda: traePrenda,
                PrendaDescripcion: traePrenda ? prendaDescripcion : "",

                tallas: !traePrenda ? [{
                    TallaID: parseInt(tallaID),
                    Cantidad: parseInt(cantidad),
                    PrecioTalla: tallas.find(t => t.TallaID === parseInt(tallaID))?.Precio || 0
                }] : [],

                colores: !traePrenda ? [{
                    ColorID: parseInt(colorID),
                    Cantidad: parseInt(cantidad)
                }] : [],

                insumos: !traePrenda ? [{
                    InsumoID: parseInt(telaID),
                    CantidadRequerida: parseInt(cantidad)
                }] : [],

                tecnicas: disenos.map(dis => ({
                    TecnicaID: dis.TecnicaID,
                    ParteID: dis.ParteID,
                    ImagenDiseño: dis.ImagenNombre,
                    Observaciones: `${dis.SubparteDescripcion ? 'Subparte: ' + dis.SubparteDescripcion + ' - ' : ''}${dis.Observaciones}`,
                    CostoTecnica: 0
                }))
            }];

            console.log('📤 PAYLOAD FINAL:', JSON.stringify(detalles, null, 2));

            const cotizacionData = {
                DocumentoID: parseInt(documentoID),
                FechaCotizacion: new Date().toISOString(),
                ValorTotal: precios.subtotal,
                EstadoID: 1,
                detalles
            };

            await createCotizacionCompleta(cotizacionData);

            Swal.fire({
                icon: "success",
                title: "¡Cotización creada!",
                text: "La cotización se ha creado correctamente",
                timer: 2000,
                showConfirmButton: false
            });

            onActualizar();
            onClose();

        } catch (error) {
            console.error("ERROR AL CREAR COTIZACIÓN:", error);
            console.error("Respuesta del servidor:", error.response?.data);

            Swal.fire({
                icon: "error",
                title: "Error al crear cotización",
                text: error.response?.data?.message || error.message || "Error desconocido",
                footer: error.response?.data?.error || ""
            });
        } finally {
            setCargando(false);
        }
    };

    // ============================================
    // RENDER (ACTUALIZADO - usar arrays filtrados)
    // ============================================
    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            overflow: "auto",
            padding: "20px"
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                maxWidth: '1200px',
                margin: '0 auto',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
                <div style={{
                    background: 'linear-gradient(90deg, #28a745 60%, #5cb85c 100%)',
                    color: 'white',
                    padding: '20px 30px',
                    borderRadius: '12px 12px 0 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Nueva Cotización</h2>
                    <button onClick={onClose} style={{
                        backgroundColor: 'transparent',
                        border: '2px solid white',
                        color: 'white',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        fontWeight: 'bold'
                    }}>×</button>
                </div>

                <div style={{ padding: '30px' }}>
                    <div className="row">
                        {/* COLUMNA IZQUIERDA - Resumen */}
                        <div className="col-lg-4">
                            <div className="sticky-top" style={{ top: '20px' }}>
                                {productoSeleccionado && (
                                    <div className="text-center mb-3 p-3 rounded shadow-sm" style={{ backgroundColor: '#fff' }}>
                                        <img
                                            src={productoSeleccionado.ImagenProducto || "https://via.placeholder.com/250"}
                                            alt={productoSeleccionado.Nombre}
                                            style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: '8px', objectFit: 'contain' }}
                                        />
                                        <h6 className="mt-2 mb-0">{productoSeleccionado.Nombre}</h6>
                                    </div>
                                )}

                                <div className="card shadow-sm">
                                    <div className="card-header bg-primary text-white">
                                        <h6 className="mb-0">Resumen de Cotización</h6>
                                    </div>
                                    <div className="card-body">
                                        {productoSeleccionado ? (
                                            <>
                                                <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                                                    <span className="fw-medium">Precio base producto:</span>
                                                    <strong className="text-info">${precios.precioBase.toLocaleString()}</strong>
                                                </div>

                                                {!traePrenda && (
                                                    <>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>+ Precio talla:</span>
                                                            <strong>${precios.precioTalla.toLocaleString()}</strong>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>+ Precio tela:</span>
                                                            <strong>${precios.precioTela.toLocaleString()}</strong>
                                                        </div>
                                                        <hr />
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span className="fw-medium">Precio unitario:</span>
                                                            <strong className="text-primary">${precios.precioUnitario.toLocaleString()}</strong>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Cantidad:</span>
                                                            <strong>x {precios.cantidad}</strong>
                                                        </div>
                                                    </>
                                                )}

                                                {traePrenda && (
                                                    <div className="alert alert-info mt-2 mb-2 py-2">
                                                        <small>Cliente trae su prenda. Cantidad: {precios.cantidad}</small>
                                                    </div>
                                                )}

                                                <hr />
                                                <div className="d-flex justify-content-between">
                                                    <span className="fw-bold">Subtotal estimado:</span>
                                                    <strong className="text-success" style={{ fontSize: '1.2rem' }}>
                                                        ${precios.subtotal.toLocaleString()}
                                                    </strong>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="alert alert-info mb-0">
                                                <small>Selecciona un producto para ver el resumen</small>
                                            </div>
                                        )}

                                        {disenos.length > 0 && (
                                            <div className="alert alert-warning mt-3 mb-0">
                                                <small><strong>+ {disenos.length} diseño(s)</strong><br />El costo se calculará al asignar técnicas</small>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA - Formulario */}
                        <div className="col-lg-8">
                            <div className="card shadow-sm mb-3">
                                <div className="card-header bg-light">
                                    <h6 className="mb-0">Información Principal</h6>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-medium">Cliente <span className="text-danger">*</span></label>
                                            <select
                                                className="form-select"
                                                value={documentoID}
                                                onChange={(e) => setDocumentoID(e.target.value)}
                                                required
                                            >
                                                <option value="">Seleccionar...</option>
                                                {usuarios.map(u => (
                                                    <option key={u.DocumentoID} value={u.DocumentoID}>
                                                        {u.Nombre} - CC: {u.DocumentoID}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-medium">Producto <span className="text-danger">*</span></label>
                                            <select
                                                className="form-select"
                                                value={productoSeleccionado?.ProductoID || ""}
                                                onChange={(e) => handleSeleccionarProducto(e.target.value)}
                                                required
                                            >
                                                <option value="">Seleccionar...</option>
                                                {productos.map(p => (
                                                    <option key={p.ProductoID} value={p.ProductoID}>
                                                        {p.Nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {productoSeleccionado && (
                                <>
                                    <div className="card shadow-sm mb-3">
                                        <div className="card-header bg-light">
                                            <h6 className="mb-0">Tipo de Prenda</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="form-check form-switch mb-3">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id="traePrenda"
                                                    checked={traePrenda}
                                                    onChange={(e) => {
                                                        setTraePrenda(e.target.checked);
                                                        if (e.target.checked) {
                                                            setColorID("");
                                                            setTallaID("");
                                                            setTelaID("");
                                                        } else {
                                                            setPrendaDescripcion("");
                                                        }
                                                    }}
                                                />
                                                <label className="form-check-label" htmlFor="traePrenda">
                                                    El cliente trae su propia prenda
                                                </label>
                                            </div>

                                            {traePrenda && (
                                                <textarea
                                                    className="form-control"
                                                    rows="3"
                                                    value={prendaDescripcion}
                                                    onChange={(e) => setPrendaDescripcion(e.target.value)}
                                                    placeholder="Describe la prenda..."
                                                    required={traePrenda}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* 🆕 USAR ARRAYS FILTRADOS */}
                                    {!traePrenda && (
                                        <div className="card shadow-sm mb-3">
                                            <div className="card-header bg-light">
                                                <h6 className="mb-0">Características</h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="row g-3">
                                                    <div className="col-md-4">
                                                        <label>Color *</label>
                                                        <select className="form-select" value={colorID} onChange={(e) => setColorID(e.target.value)} required>
                                                            <option value="">Seleccionar...</option>
                                                            {coloresFiltrados.map(c => <option key={c.ColorID} value={c.ColorID}>{c.Nombre}</option>)}
                                                        </select>
                                                        {coloresFiltrados.length === 0 && (
                                                            <small className="text-danger">Sin colores disponibles</small>
                                                        )}
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label>Talla *</label>
                                                        <select className="form-select" value={tallaID} onChange={(e) => setTallaID(e.target.value)} required>
                                                            <option value="">Seleccionar...</option>
                                                            {tallasFiltradas.map(t => <option key={t.TallaID} value={t.TallaID}>{t.Nombre} - ${t.Precio?.toLocaleString()}</option>)}
                                                        </select>
                                                        {tallasFiltradas.length === 0 && (
                                                            <small className="text-danger">Sin tallas disponibles</small>
                                                        )}
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label>Cantidad *</label>
                                                        <input type="number" className="form-control" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} required />
                                                    </div>
                                                    <div className="col-md-12">
                                                        <label>Tipo de Tela *</label>
                                                        <select className="form-select" value={telaID} onChange={(e) => setTelaID(e.target.value)} required>
                                                            <option value="">Seleccionar...</option>
                                                            {telasFiltradas.map(t => <option key={t.InsumoID} value={t.InsumoID}>{t.Nombre} - +${t.PrecioTela?.toLocaleString()}</option>)}
                                                        </select>
                                                        {telasFiltradas.length === 0 && (
                                                            <small className="text-danger">Sin telas disponibles</small>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Sección de diseños */}
                                    <div className="card shadow-sm mb-3">
                                        <div className="card-header bg-light">
                                            <h6 className="mb-0">Diseños Personalizados</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="p-3 rounded mb-3" style={{ backgroundColor: '#f8f9fa', border: '2px dashed #dee2e6' }}>
                                                <h6 className="mb-3">Nuevo Diseño</h6>
                                                <div className="row g-3 mb-3">
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-medium">Técnica</label>
                                                        <select className="form-select" value={tecnicaID} onChange={(e) => setTecnicaID(e.target.value)}>
                                                            <option value="">Seleccionar...</option>
                                                            {tecnicas.map(t => (
                                                                <option key={t.TecnicaID} value={t.TecnicaID}>{t.Nombre}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-medium">Parte de la prenda</label>
                                                        <select className="form-select" value={parteID} onChange={(e) => setParteID(e.target.value)}>
                                                            <option value="">Seleccionar...</option>
                                                            {partes.map(p => (
                                                                <option key={p.ParteID} value={p.ParteID}>{p.Nombre}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-medium">Subparte (opcional)</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={subparteDescripcion}
                                                            onChange={(e) => setSubparteDescripcion(e.target.value)}
                                                            placeholder="Ej: Superior izquierdo"
                                                        />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-medium">Archivo del diseño</label>
                                                        <input
                                                            type="file"
                                                            className="form-control"
                                                            accept="image/*"
                                                            onChange={(e) => setArchivoDiseno(e.target.files[0])}
                                                        />
                                                        {archivoDiseno && (
                                                            <small className="text-success d-block mt-1">✓ {archivoDiseno.name}</small>
                                                        )}
                                                    </div>
                                                    <div className="col-md-12">
                                                        <label className="form-label fw-medium">Observaciones</label>
                                                        <textarea
                                                            className="form-control"
                                                            rows="2"
                                                            value={observacionDiseno}
                                                            onChange={(e) => setObservacionDiseno(e.target.value)}
                                                            placeholder="Ej: Logo azul marino, tamaño 10cm x 10cm"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-success btn-sm"
                                                    onClick={handleAgregarDiseno}
                                                >
                                                    <FaPlus className="me-1" />
                                                    Agregar diseño
                                                </button>
                                            </div>

                                            {disenos.length > 0 ? (
                                                <table className="table table-sm table-striped table-bordered">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Técnica</th>
                                                            <th>Parte</th>
                                                            <th>Subparte</th>
                                                            <th>Diseño</th>
                                                            <th>Acción</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {disenos.map((d) => (
                                                            <tr key={d.id}>
                                                                <td>{d.TecnicaNombre}</td>
                                                                <td>{d.ParteNombre}</td>
                                                                <td>{d.SubparteDescripcion || "—"}</td>
                                                                <td>
                                                                    {d.Archivo ? (
                                                                        <span className="text-success">✓ {d.Archivo.name}</span>
                                                                    ) : (
                                                                        <span className="text-muted">Sin archivo</span>
                                                                    )}
                                                                </td>
                                                                <td className="text-center">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-danger btn-sm"
                                                                        onClick={() => handleEliminarDiseno(d.id)}
                                                                    >
                                                                        <FaTrash />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="alert alert-info mb-0">
                                                    <small>No hay diseños agregados. Puedes continuar sin diseño personalizado.</small>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="d-flex gap-3 justify-content-end mt-4">
                                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={cargando}>Cancelar</button>
                                <button type="button" onClick={handleSubmit} className="btn btn-success" disabled={cargando}>
                                    {cargando ? "Enviando..." : "Crear Cotización"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormularioCotizacion;