import React from "react";
import { FaEye, FaCheck, FaExchangeAlt, FaBan, FaBoxOpen, FaMagic, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { C } from "../../config/tokens";
import { formatPrecio } from "../../utils/formato";
import { estadoDe, formatearFecha, obtenerPrimerProducto } from "./cotizacionUtils";
import { Badge, ActionBtn } from "./componentes";

/* ── Paginación ── */
const ITEMS_POR_PAGINA_OPCIONES = [5, 10, 20, 50];

const Paginacion = ({ paginaActual, totalPaginas, totalItems, itemsPorPagina, onCambiarPagina, onCambiarItemsPorPagina, desde, hasta }) => {
  if (totalItems === 0) return null;

  const generarPaginas = () => {
    const paginas = [];
    const delta = 2;
    const rangoIzq = Math.max(2, paginaActual - delta);
    const rangoDer = Math.min(totalPaginas - 1, paginaActual + delta);
    paginas.push(1);
    if (rangoIzq > 2) paginas.push("...");
    for (let i = rangoIzq; i <= rangoDer; i++) paginas.push(i);
    if (rangoDer < totalPaginas - 1) paginas.push("...");
    if (totalPaginas > 1) paginas.push(totalPaginas);
    return paginas;
  };

  const btnBase = {
    minWidth: 34, height: 34, borderRadius: 8, border: `1.5px solid ${C.border}`,
    background: C.white, color: C.muted, fontSize: 13, fontWeight: 600,
    cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.18s", padding: "0 8px",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: `1px solid ${C.border}`, background: C.white, flexWrap: "wrap", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: C.muted }}>
          Mostrando <strong style={{ color: C.navy }}>{desde}–{hasta}</strong> de <strong style={{ color: C.navy }}>{totalItems}</strong> cotizaciones
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: C.muted }}>Por página:</span>
          <select className="cz-input" value={itemsPorPagina} onChange={e => onCambiarItemsPorPagina(Number(e.target.value))}
            style={{ padding: "4px 10px", fontSize: 12, borderRadius: 8, cursor: "pointer" }}>
            {ITEMS_POR_PAGINA_OPCIONES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button aria-label="Página anterior" onClick={() => onCambiarPagina(paginaActual - 1)} disabled={paginaActual === 1}
          style={{ ...btnBase, opacity: paginaActual === 1 ? 0.4 : 1, cursor: paginaActual === 1 ? "not-allowed" : "pointer" }}>
          <FaChevronLeft size={11} />
        </button>
        {generarPaginas().map((p, i) => (
          p === "..." ? (
            <span key={`e-${i}`} style={{ padding: "0 4px", color: C.muted, fontSize: 13 }}>…</span>
          ) : (
            <button key={p} onClick={() => onCambiarPagina(p)}
              style={{
                ...btnBase,
                background: p === paginaActual ? C.navy : C.white,
                color: p === paginaActual ? C.white : C.muted,
                borderColor: p === paginaActual ? C.navy : C.border,
                fontWeight: p === paginaActual ? 700 : 600,
                cursor: p === paginaActual ? "default" : "pointer",
              }}>
              {p}
            </button>
          )
        ))}
        <button aria-label="Página siguiente" onClick={() => onCambiarPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas}
          style={{ ...btnBase, opacity: paginaActual === totalPaginas ? 0.4 : 1, cursor: paginaActual === totalPaginas ? "not-allowed" : "pointer" }}>
          <FaChevronRight size={11} />
        </button>
      </div>
    </div>
  );
};

/* ── Tabla de cotizaciones (filas, estados vacío/cargando y paginación) ── */
const TablaCotizaciones = ({
  cargando, cotizaciones, itemsPorPagina, busqueda, filtroEstado,
  onVerImagen, handleVerDetalle, handleAprobar, handleCancelarCotizacion, handleConvertirAVenta,
  paginaSegura, totalPaginas, totalItems, handleCambiarPagina, handleCambiarItemsPorPagina, desde, hasta,
}) => (
  <div className="cz-tablewrap">
    <div style={{ overflowX: "auto" }}>
      <table className="cz-table">
        <thead>
          <tr>
            {["ID", "Imagen", "Cliente", "Producto", "Fecha", "Estado", "Valor Total", "Acciones"].map((h, i) => (
              <th key={i} style={{ textAlign: i >= 5 ? "center" : "left" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cargando ? (
            Array.from({ length: Math.min(itemsPorPagina, 6) }).map((_, i) => (
              <tr key={`sk${i}`}>
                <td><div className="cz-skel" style={{ width: 38 }} /></td>
                <td><div className="cz-skel" style={{ width: 48, height: 48, borderRadius: 10 }} /></td>
                <td><div className="cz-skel" style={{ width: 130, marginBottom: 6 }} /><div className="cz-skel" style={{ width: 90, height: 10 }} /></td>
                <td><div className="cz-skel" style={{ width: 120 }} /></td>
                <td><div className="cz-skel" style={{ width: 80 }} /></td>
                <td><div className="cz-skel" style={{ width: 80, margin: "0 auto", height: 22, borderRadius: 11 }} /></td>
                <td><div className="cz-skel" style={{ width: 80, margin: "0 auto", height: 22, borderRadius: 11 }} /></td>
                <td><div className="cz-skel" style={{ width: 100, margin: "0 auto", height: 30 }} /></td>
              </tr>
            ))
          ) : cotizaciones.length === 0 ? (
            <tr><td colSpan={8}>
              <div className="cz-empty">
                <div className="cz-empty-ico"><FaBoxOpen /></div>
                <p style={{ margin: 0, fontWeight: 700, color: C.navy, fontSize: 15 }}>
                  {busqueda || filtroEstado !== "Todos" ? "No se encontraron cotizaciones" : "No hay cotizaciones registradas"}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                  {busqueda || filtroEstado !== "Todos" ? "Prueba con otra búsqueda o cambia el filtro de estado." : "Crea la primera con el botón «Agregar Cotización»."}
                </p>
              </div>
            </td></tr>
          ) : (
            cotizaciones.map((cot, idx) => {
              const producto = obtenerPrimerProducto(cot.detalles);
              const { nombre: estadoNombre, type: estadoType } = estadoDe(cot);
              return (
                <tr key={cot.CotizacionID} className="cz-row"
                  style={{ background: idx % 2 === 0 ? C.white : "#fafcff", animationDelay: `${idx * 0.03}s` }}>
                  <td><Badge type="navy">#{cot.CotizacionID}</Badge></td>
                  <td>
                    {producto.Imagen ? (
                      <img loading="lazy" decoding="async" className="cz-thumb" src={producto.Imagen} alt={producto.Nombre} onClick={() => onVerImagen(producto.Imagen)} />
                    ) : (
                      <div className="cz-thumb" style={{ cursor: "default" }}>
                        {producto.tipo === "personalizado" ? <FaMagic style={{ color: C.violet, opacity: .6 }} /> : <FaBoxOpen style={{ color: C.muted, opacity: 0.45, fontSize: 18 }} />}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: C.navy }}>{cot.usuario?.Nombre || "Sin nombre"}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>CC: {cot.usuario?.DocumentoID || "N/A"}</div>
                  </td>
                  <td style={{ fontWeight: 600, color: C.navy, maxWidth: 200 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{producto.Nombre}</div>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>
                      {producto.Cantidad} ud{producto.Cantidad !== 1 ? "s" : ""}{producto.extra > 0 ? ` · +${producto.extra} producto${producto.extra > 1 ? "s" : ""} más` : ""}
                    </div>
                  </td>
                  <td style={{ color: C.muted, fontSize: 12, whiteSpace: "nowrap" }}>{formatearFecha(cot.FechaCotizacion)}</td>
                  <td style={{ textAlign: "center" }}><Badge type={estadoType} dot>{estadoNombre}</Badge></td>
                  <td style={{ textAlign: "center" }}>
                    {parseFloat(cot.ValorTotal) > 0
                      ? <Badge type="money">${formatPrecio(cot.ValorTotal)}</Badge>
                      : <span className="cz-badge money zero" title="Aún sin costear">Por costear</span>}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                      <ActionBtn onClick={() => handleVerDetalle(cot.CotizacionID)} title="Ver detalle" color={C.accent}><FaEye size={12} /></ActionBtn>
                      {estadoNombre === "Pendiente" && (
                        <>
                          <ActionBtn onClick={() => handleAprobar(cot.CotizacionID)} title="Aprobar" color={C.success}><FaCheck size={12} /></ActionBtn>
                          <ActionBtn onClick={() => handleCancelarCotizacion(cot)} title="Cancelar" color={C.danger}><FaBan size={12} /></ActionBtn>
                        </>
                      )}
                      {estadoNombre === "Aprobada" && (
                        <>
                          <ActionBtn onClick={() => handleConvertirAVenta(cot.CotizacionID)} title="Convertir a venta" color={C.violet}><FaExchangeAlt size={12} /></ActionBtn>
                          <ActionBtn onClick={() => handleCancelarCotizacion(cot)} title="Cancelar" color={C.danger}><FaBan size={12} /></ActionBtn>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>

    {!cargando && (
      <Paginacion
        paginaActual={paginaSegura}
        totalPaginas={totalPaginas}
        totalItems={totalItems}
        itemsPorPagina={itemsPorPagina}
        onCambiarPagina={handleCambiarPagina}
        onCambiarItemsPorPagina={handleCambiarItemsPorPagina}
        desde={desde}
        hasta={hasta}
      />
    )}
  </div>
);

export default TablaCotizaciones;
