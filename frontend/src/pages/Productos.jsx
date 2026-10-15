import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { FaPlusCircle, FaSearch, FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getProductos, updateProducto, deleteProducto } from "../Services/api-productos/productos";
import { getVariantesByProducto, updateVariante, deleteVariante } from "../Services/api-productos/variantes";
import { getTallas, getColores, getTelas } from "../Services/api-productos/atributos";


const Productos = () => {
  const navigate = useNavigate();

  // Estados principales
  const [productos, setProductos] = useState([]);
  const [colores, setColores] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [telas, setTelas] = useState([]); // 🆕 Estado para telas

  // Estados de búsqueda y UI
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);

  // Modal de detalle/variantes
  const [showModal, setShowModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [variantes, setVariantes] = useState([]);
  const [imagenModal, setImagenModal] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [productosRes, coloresRes, tallasRes, telasRes] = await Promise.all([
        getProductos(),
        getColores(),
        getTallas(),
        getTelas() // 🆕 Importar getTelas desde atributos
      ]);

      setProductos(productosRes.datos || productosRes);
      setColores(coloresRes.datos || coloresRes);
      setTallas(tallasRes.datos || tallasRes);
      setTelas(telasRes || []); // 🆕
    } catch (error) {
      console.error("Error al cargar datos:", error);
      Swal.fire("Error", "No se pudieron cargar los datos", "error");
    } finally {
      setCargando(false);
    }
  };

  // Filtrar productos por búsqueda
  const productosFiltrados = useMemo(() => {
    if (!busqueda) return productos;

    return productos.filter(p =>
      p.Nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.Descripcion && p.Descripcion.toLowerCase().includes(busqueda.toLowerCase()))
    );
  }, [productos, busqueda]);

  // Navegar a formulario de agregar producto
  const handleAgregarProducto = () => {
    navigate("/dashboard/agregar-producto");
  };

  // Navegar a formulario de editar producto
  const handleEditarProducto = (producto) => {
    navigate(`/dashboard/editar-producto/${producto.ProductoID}`);
  };

  // Eliminar producto
  const handleEliminarProducto = async (producto) => {
    const result = await Swal.fire({
      title: "¿Eliminar producto?",
      text: `Se eliminará "${producto.Nombre}" y todas sus variantes`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    setCargando(true);
    try {
      await deleteProducto(producto.ProductoID);

      Swal.fire({
        title: "¡Eliminado!",
        text: "Producto eliminado correctamente",
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      });

      cargarDatos();
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      Swal.fire(
        "Error",
        error.response?.data?.mensaje || "No se pudo eliminar el producto",
        "error"
      );
    } finally {
      setCargando(false);
    }
  };

  // Ver detalle y variantes del producto
  const handleVerDetalle = async (producto) => {
    setProductoSeleccionado(producto);
    setCargando(true);

    try {
      const response = await getVariantesByProducto(producto.ProductoID);
      setVariantes(response.datos || response);
      setShowModal(true);
    } catch (error) {
      console.error("Error al cargar variantes:", error);
      setVariantes([]);
      setShowModal(true);
    } finally {
      setCargando(false);
    }
  };

  const handleCerrarModal = () => {
    setShowModal(false);
    setProductoSeleccionado(null);
    setVariantes([]);
  };

  const handleVerImagenModal = (producto) => {
    setImagenModal(producto.ImagenProducto);
  };

  const cerrarImagenModal = () => {
    setImagenModal(null);
  };


  // 🔧 FUNCIONES AUXILIARES CORREGIDAS
  const obtenerNombreColor = (colorId) => {
    return colores.find(c => c.ColorID === colorId)?.Nombre || "—";
  };

  const obtenerNombreTalla = (tallaId) => {
    return tallas.find(t => t.TallaID === tallaId)?.Nombre || "—";
  };

  const obtenerPrecioTalla = (tallaId) => {
    const talla = tallas.find(t => t.TallaID === parseInt(tallaId));
    return parseFloat(talla?.Precio) || 0; 
  };

  const obtenerPrecioTela = (telaId) => {
    if (!telaId) return 0;
    const tela = telas.find(t => t.InsumoID === parseInt(telaId));
    return parseFloat(tela?.PrecioTela) || 0; 
  };

  const calcularPrecioTotal = (productoId, tallaId, telaId = null) => {
    const producto = productos.find(p => p.ProductoID === productoId);
    const precioBase = parseFloat(producto?.PrecioBase) || 0; // ✅ parseFloat aquí
    const precioTalla = obtenerPrecioTalla(tallaId);
    const precioTela = obtenerPrecioTela(telaId);

    return precioBase + precioTalla + precioTela; // Ahora sí suma correctamente
  };


  return (
    <div className="d-flex flex-column" style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #ffffff 0%, #fafcff 100%)",
      padding: "20px 30px",
      fontSize: "0.9rem",
    }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="fs-5 fw-bold mb-0 text-primary" style={{ letterSpacing: 1 }}>
          Gestión de Productos
        </h1>
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={handleAgregarProducto}
          disabled={cargando}
        >
          <FaPlusCircle size={18} />
          Agregar Producto
        </button>
      </div>

      {/* Buscador */}
      <div className="d-flex justify-content-end mb-3">
        <div className="input-group input-group-sm" style={{ maxWidth: 300 }}>
          <span className="input-group-text bg-white border-end-0">
            <FaSearch />
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="card shadow-sm mb-4">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead style={{
              background: "linear-gradient(90deg, #1976d2 60%, #64b5f6 100%)",
              color: "#fff"
            }}>
              <tr>
                <th>ID</th>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th className="text-center">Precio Base</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <span className="ms-2">Cargando productos...</span>
                  </td>
                </tr>
              ) : productosFiltrados.length > 0 ? (
                productosFiltrados.map((producto) => (
                  <tr key={producto.ProductoID}>
                    <td>{producto.ProductoID}</td>
                    <td>
                      {producto.ImagenProducto ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleVerImagenModal(producto)}
                        >
                          <FaEye className="me-1" />
                          Ver Imagen
                        </button>
                      ) : (
                        <span className="text-muted">Sin imagen</span>
                      )}
                    </td>
                    <td className="fw-medium">{producto.Nombre}</td>
                    <td className="text-muted">{producto.Descripcion || "—"}</td>
                    <td className="text-center">
                      <span className="badge bg-success">
                        ${(producto.PrecioBase || 0).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex justify-content-center gap-1">
                        <button
                          className="btn btn-outline-primary btn-sm rounded-circle"
                          title="Ver detalle"
                          onClick={() => handleVerDetalle(producto)}
                        >
                          <FaEye size={14} />
                        </button>
                        <button
                          className="btn btn-outline-warning btn-sm rounded-circle"
                          title="Editar"
                          onClick={() => handleEditarProducto(producto)}
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm rounded-circle"
                          title="Eliminar"
                          onClick={() => handleEliminarProducto(producto)}
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    {busqueda
                      ? "No se encontraron productos con ese criterio"
                      : "No hay productos registrados. Haz clic en 'Agregar Producto' para comenzar"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle */}
      {showModal && productoSeleccionado && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header" style={{
                background: "linear-gradient(120deg, #1976d2 60%, #64b5f6 100%)",
                color: "white"
              }}>
                <h5 className="modal-title">Detalle del Producto</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={handleCerrarModal}
                ></button>
              </div>

              <div className="modal-body">
                {/* Información del Producto */}
                <div className="card mb-3">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        {productoSeleccionado.ImagenProducto ? (
                          <img
                            src={productoSeleccionado.ImagenProducto}
                            alt={productoSeleccionado.Nombre}
                            className="img-fluid rounded"
                            style={{ maxHeight: 200, objectFit: "cover", width: "100%" }}
                          />
                        ) : (
                          <div
                            className="bg-secondary bg-opacity-10 rounded d-flex align-items-center justify-content-center"
                            style={{ height: 200 }}
                          >
                            <span className="text-muted">Sin imagen</span>
                          </div>
                        )}
                      </div>
                      <div className="col-md-8">
                        <h5 className="fw-bold">{productoSeleccionado.Nombre}</h5>
                        <p className="text-muted">{productoSeleccionado.Descripcion || "Sin descripción"}</p>

                        {/* 🆕 Mostrar Precio Base */}
                        <div className="alert alert-info mb-3">
                          <strong>Precio Base:</strong> ${(productoSeleccionado.PrecioBase || 0).toLocaleString()}
                          <br />
                          <small className="text-muted">El precio final varía según la talla y la tela seleccionada</small>
                        </div>

                        <div className="mt-2">
                          <small className="text-muted">ID: {productoSeleccionado.ProductoID}</small>
                        </div>
                        <div className="mt-2">
                          <span className="badge bg-primary">
                            {variantes.length} variante{variantes.length !== 1 ? 's' : ''}
                          </span>
                          <span className="badge bg-success ms-2">
                            Stock total: {variantes.reduce((acc, v) => acc + (v.Stock || 0), 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabla de Variantes */}
                <div className="card">
                  <div className="card-body">
                    <h6 className="fw-bold mb-3">Variantes del Producto</h6>

                    {variantes.length === 0 ? (
                      <div className="alert alert-info mb-0">
                        No hay variantes registradas para este producto
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-sm table-bordered">
                          <thead className="table-light">
                            <tr>
                              <th>Color</th>
                              <th>Talla</th>
                              <th>Tela</th>
                              <th>Precio Talla</th>
                              <th>Precio Tela</th>
                              <th>Precio Final</th>
                              <th className="text-center">Stock</th>
                              <th className="text-center">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {variantes.map((variante) => (
                              <tr key={variante.InventarioID}>
                                <td>{obtenerNombreColor(variante.ColorID)}</td>
                                <td>{obtenerNombreTalla(variante.TallaID)}</td>
                                <td>
                                  <span className={`badge ${variante.TelaID ? 'bg-info' : 'bg-secondary'}`}>
                                    {variante.tela?.Nombre || 'Sin tela'}
                                  </span>
                                </td>
                                <td className="text-info">
                                  +${obtenerPrecioTalla(variante.TallaID).toLocaleString()}
                                </td>
                                <td className="text-warning">
                                  +${obtenerPrecioTela(variante.TelaID).toLocaleString()}
                                </td>
                                <td className="text-success fw-bold">
                                  ${calcularPrecioTotal(
                                    productoSeleccionado.ProductoID,
                                    variante.TallaID,
                                    variante.TelaID
                                  ).toLocaleString()}
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
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={handleCerrarModal}
                >
                  Cerrar
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => {
                    handleCerrarModal();
                    handleEditarProducto(productoSeleccionado);
                  }}
                >
                  <FaEdit className="me-1" /> Editar Producto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Imagen modal producto */}
      {imagenModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          onClick={cerrarImagenModal}
          style={{
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-content bg-transparent border-0"
              style={{ animation: 'scaleIn 0.3s ease' }}
            >
              <div className="modal-body p-0 text-center">
                <img
                  src={imagenModal}
                  alt="Vista ampliada"
                  className="img-fluid rounded shadow-lg"
                  style={{
                    maxHeight: '80vh',
                    borderRadius: '15px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.4)'
                  }}
                />

                <div className="d-flex justify-content-center mt-4">
                  <button
                    className="btn px-4 py-2"
                    style={{
                      backgroundColor: '#d9534f',
                      color: 'white',
                      borderRadius: '25px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      transition: '0.2s'
                    }}
                    onClick={cerrarImagenModal}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#c9302c')}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = '#d9534f')}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Productos;