import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaPlusCircle } from "react-icons/fa";
import Swal from "sweetalert2";
import { getCotizaciones, getCotizacionById } from "../Services/api-cotizaciones/cotizaciones";
import { useSearchParams } from "react-router-dom";
import FormularioCotizacion from './formularios_dash/FormularioCotizacion';
import "../styles/plus.css";
import { C } from "../config/tokens";
import { ESTADOS, CSS, estadoDe } from "./cotizaciones/cotizacionUtils";
import { ImagenModal } from "./cotizaciones/componentes";
import DetalleCotizacion from "./cotizaciones/DetalleCotizacion";
import TablaCotizaciones from "./cotizaciones/TablaCotizaciones";
import useAccionesCotizacion from "./cotizaciones/useAccionesCotizacion";

/* ══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════ */
const Cotizaciones = () => {
  const [totalItems, setTotalItems] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [imagenModal, setImagenModal] = useState(null);
  const [modalKey, setModalKey] = useState(0);
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);
  const reqId = useRef(0);

  const cargarCotizaciones = async (page, limit, search, estado) => {
    const id = ++reqId.current;
    setCargando(true);
    try {
      const response = await getCotizaciones({ page, limit, search, estado });
      if (id !== reqId.current) return; // respuesta vieja: la ignoramos
      setTotalItems(response.total || 0);
      setTotalPaginas(Math.max(1, response.totalPaginas || 1));
      setCotizaciones(response.datos || []);
    } catch {
      if (id === reqId.current) Swal.fire("Error", "No se pudieron cargar las cotizaciones", "error");
    } finally { if (id === reqId.current) setCargando(false); }
  };

  // Recarga respetando la página, búsqueda y filtro actuales
  const recargar = () => cargarCotizaciones(paginaActual, itemsPorPagina, busqueda, filtroEstado);

  // Carga inicial + cambios de búsqueda (con debounce) y de filtro
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPaginaActual(1);
      cargarCotizaciones(1, itemsPorPagina, busqueda, filtroEstado);
    }, busqueda ? 350 : 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, filtroEstado]);

  const handleCerrarFormulario = () => { setMostrarFormulario(false); setModalKey(prev => prev + 1); };
  const handleCotizacionCreada = () => { setPaginaActual(1); return cargarCotizaciones(1, itemsPorPagina, busqueda, filtroEstado); };
  const handleCerrarDetalle = () => { setCotizacionSeleccionada(null); recargar(); };

  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const desde = totalItems === 0 ? 0 : (paginaSegura - 1) * itemsPorPagina + 1;
  const hasta = Math.min(paginaSegura * itemsPorPagina, totalItems);

  const handleCambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      cargarCotizaciones(nuevaPagina, itemsPorPagina, busqueda, filtroEstado);
    }
  };

  const handleCambiarItemsPorPagina = (n) => {
    setItemsPorPagina(n);
    setPaginaActual(1);
    cargarCotizaciones(1, n, busqueda, filtroEstado);
  };

  const recargarDetalle = async (cotizacionID) => {
    const response = await getCotizacionById(cotizacionID);
    setCotizacionSeleccionada(response);
    return response;
  };

  const handleVerDetalle = async (cotizacionID) => {
    try { await recargarDetalle(cotizacionID); }
    catch { Swal.fire("Error", "No se pudo cargar el detalle", "error"); }
  };

  // Enlace desde "Hoy": /dashboard/cotizaciones?abrir=ID abre directamente el detalle
  const [searchParams, setSearchParams] = useSearchParams();
  const abrirParam = searchParams.get("abrir");
  useEffect(() => {
    if (!abrirParam) return;
    const id = parseInt(abrirParam, 10);
    setSearchParams({}, { replace: true });
    if (id > 0) handleVerDetalle(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abrirParam]);

  const { handleCancelarCotizacion, handleAprobar, handleConvertirAVenta } = useAccionesCotizacion({
    cotizacionSeleccionada, setCotizacionSeleccionada, recargar, recargarDetalle,
  });

  const pendientes = cotizaciones.filter(c => estadoDe(c).nombre === "Pendiente").length;

  return (
    <>
      <style>{CSS}</style>

      <div className="cz-page sx-font" style={{ minHeight: "100vh", background: C.bg, padding: "28px 32px" }}>

        {/* HEADER */}
        <div className="cz-head">
          <div>
            <h4 className="cz-title">Gestión de Cotizaciones</h4>
            <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 13 }}>
              {totalItems} cotizaci{totalItems !== 1 ? "ones" : "ón"} ·{" "}
              <span style={{ color: C.warning, fontWeight: 700 }}>{pendientes} pendiente{pendientes !== 1 ? "s" : ""} en esta página</span>
            </p>
          </div>
          <button className="sx-btn sx-btn-dark sx-btn-sm" onClick={() => setMostrarFormulario(true)}>
            <FaPlusCircle size={15} /> Agregar Cotización
          </button>
        </div>

        {/* FILTROS */}
        <div className="cz-filters">
          <select className="cz-input" aria-label="Filtrar por estado" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ cursor: "pointer" }}>
            <option value="Todos">Todos los estados</option>
            {Object.values(ESTADOS).map(e => <option key={e.nombre} value={e.nombre}>{e.nombre}</option>)}
          </select>
          <div className="cz-search">
            <FaSearch />
            <input className="cz-input" type="text" aria-label="Buscar cotización" placeholder="Buscar por #, cliente o documento..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
        </div>

        <TablaCotizaciones
          cargando={cargando} cotizaciones={cotizaciones} itemsPorPagina={itemsPorPagina} busqueda={busqueda} filtroEstado={filtroEstado}
          onVerImagen={setImagenModal} handleVerDetalle={handleVerDetalle} handleAprobar={handleAprobar}
          handleCancelarCotizacion={handleCancelarCotizacion} handleConvertirAVenta={handleConvertirAVenta}
          paginaSegura={paginaSegura} totalPaginas={totalPaginas} totalItems={totalItems}
          handleCambiarPagina={handleCambiarPagina} handleCambiarItemsPorPagina={handleCambiarItemsPorPagina} desde={desde} hasta={hasta}
        />
      </div>

      <ImagenModal src={imagenModal} onClose={() => setImagenModal(null)} />

      {cotizacionSeleccionada && (
        <DetalleCotizacion
          cotizacion={cotizacionSeleccionada}
          onClose={handleCerrarDetalle}
          onRecargar={recargarDetalle}
          onAprobar={handleAprobar}
          onConvertirAVenta={handleConvertirAVenta}
          onCancelar={handleCancelarCotizacion}
        />
      )}

      {mostrarFormulario && (
        <FormularioCotizacion
          key={modalKey}
          onClose={handleCerrarFormulario}
          onActualizar={handleCotizacionCreada}
        />
      )}
    </>
  );
};

export default Cotizaciones;
