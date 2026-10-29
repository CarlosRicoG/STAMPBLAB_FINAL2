import React, { useState, useEffect, useRef } from "react";
import { FaPlusCircle, FaEye, FaEdit, FaSyncAlt, FaTrash, FaBoxOpen, FaSearch, FaTimes } from "react-icons/fa";
import Swal from "sweetalert2";
import NuevaVenta from "./formularios_dash/NuevaVenta";
import { getVentas, getVentaById, updateEstadoVenta, deleteVenta } from "../Services/api-ventas/ventas";
import { getEstadosVenta } from "../Services/api-ventas/estados";
import ModalDetalleVenta, { VT, VT_CSS, EstadoBadge, EstadoVentaModal, Paginacion, SkeletonRows, MetodoPagoMini, fmtCOP, fmtFecha, fmtHora, iniciales } from "./ModalDetalleVenta";
import { ESTADO_VENTA } from "../config/estados";

const C = VT;

const errMsg = (e, fallback) => e?.response?.data?.message || e?.response?.data?.error || fallback;

/* ══════════════════════════════════════════════════════════ */
const Ventas = () => {

    const [showForm, setShowForm] = useState(false);
    const [ventaEdit, setVentaEdit] = useState(null);
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVenta, setSelectedVenta] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [loadingDetalleId, setLoadingDetalleId] = useState(null);
    const [ventaEstado, setVentaEstado] = useState(null);
    const [estadosVenta, setEstadosVenta] = useState([]);
    const [filtro, setFiltro] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    /* ── Paginación ── */
    const [paginaActual, setPaginaActual] = useState(1);
    const [itemsPorPagina, setItemsPorPagina] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(1);

    const reqId = useRef(0);
    const primeraCarga = useRef(true);

    const Toast = Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 3000, timerProgressBar: true });

    useEffect(() => { loadEstadosVenta(); }, []);

    // Carga inicial inmediata y luego búsqueda con debounce
    useEffect(() => {
        const delay = primeraCarga.current ? 0 : 350;
        primeraCarga.current = false;
        const timeout = setTimeout(() => {
            setPaginaActual(1);
            loadVentas(1, itemsPorPagina, filtro);
        }, delay);
        return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se ejecuta solo cuando cambia esta dependencia; usa la versión actual de las funciones
    }, [filtro]);

    const loadVentas = async (page, limit, search) => {
        const id = ++reqId.current;
        try {
            setLoading(true); setError(null);
            const data = await getVentas({ page, limit, search, estado: "procesadas" });
            if (id !== reqId.current) return; // respuesta vieja (el usuario siguió escribiendo)
            const tp = data.totalPaginas || 1;
            // Si la página quedó vacía (p. ej. tras eliminar el último registro), retrocede una
            if ((data.datos || []).length === 0 && page > 1 && (data.total || 0) > 0) {
                setPaginaActual(Math.min(page - 1, tp));
                return loadVentas(Math.min(page - 1, tp), limit, search);
            }
            setVentas(data.datos || []);
            setTotalItems(data.total || 0);
            setTotalPaginas(tp);
        } catch {
            if (id === reqId.current) setError("Error al cargar ventas");
        } finally {
            if (id === reqId.current) setLoading(false);
        }
    };

    const loadEstadosVenta = async () => {
        try { setEstadosVenta((await getEstadosVenta()) || []); }
        catch (e) { console.error(e); }
    };

    const nombreEstado = (venta) =>
        venta.estado?.Nombre || estadosVenta.find(e => e.EstadoID === venta.EstadoID)?.Nombre;

    const handleAgregar = () => { setVentaEdit(null); setShowForm(true); };
    const handleEditar = (v) => { setVentaEdit(v); setShowForm(true); };
    const handleCloseForm = () => { setShowForm(false); setVentaEdit(null); loadVentas(1, itemsPorPagina, filtro); setPaginaActual(1); };

    const handleVer = async (venta) => {
        try {
            setLoadingDetalleId(venta.VentaID);
            const data = await getVentaById(venta.VentaID);
            setSelectedVenta(data); setShowDetailModal(true);
        } catch { Toast.fire({ icon: "error", title: "Error al cargar detalles" }); }
        finally { setLoadingDetalleId(null); }
    };

    const confirmarCambioEstado = async (estadoID, extra) => {
        try {
            const r = await updateEstadoVenta(ventaEstado.VentaID, estadoID, extra);
            const nuevo = estadosVenta.find(e => e.EstadoID === estadoID)?.Nombre || "nuevo estado";
            Toast.fire({
                icon: "success",
                title: estadoID === 8 ? `Venta #${ventaEstado.VentaID} devuelta a pendientes` : `Venta #${ventaEstado.VentaID} → ${nuevo}`,
                text: r?.stockDevuelto ? "El stock fue devuelto al inventario" : undefined,
            });
            setVentaEstado(null);
            loadVentas(paginaActual, itemsPorPagina, filtro);
        } catch (e) { Toast.fire({ icon: "error", title: errMsg(e, "Error al actualizar el estado") }); }
    };

    const handleEliminar = async (venta) => {
        const pendiente = venta.EstadoID === ESTADO_VENTA.PENDIENTE;
        const result = await Swal.fire({
            title: `¿Eliminar venta #${venta.VentaID}?`,
            html: `<p style="margin:0 0 6px">Esta acción no se puede deshacer.</p><p style="margin:0;font-size:13px;color:#64748b">${pendiente ? "El stock de los productos se devolverá al inventario." : "La venta no está pendiente: el stock <b>no</b> se devolverá al inventario."}</p>`,
            icon: "warning", showCancelButton: true,
            confirmButtonColor: C.danger, cancelButtonColor: C.navy,
            confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar",
        });
        if (result.isConfirmed) {
            try {
                setDeletingId(venta.VentaID);
                await deleteVenta(venta.VentaID);
                Toast.fire({ icon: "success", title: `Venta #${venta.VentaID} eliminada` });
                await loadVentas(paginaActual, itemsPorPagina, filtro);
            } catch (e) { Toast.fire({ icon: "error", title: errMsg(e, "Error al eliminar la venta") }); }
            finally { setDeletingId(null); }
        }
    };

    /* ── Paginado (server-side) ── */
    const paginaSegura = Math.min(paginaActual, totalPaginas);
    const desde = ventas.length === 0 ? 0 : (paginaSegura - 1) * itemsPorPagina + 1;
    const hasta = Math.min(paginaSegura * itemsPorPagina, totalItems);

    const handleCambiarPagina = (nuevaPagina) => {
        if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
            setPaginaActual(nuevaPagina);
            loadVentas(nuevaPagina, itemsPorPagina, filtro);
        }
    };
    const handleCambiarItemsPorPagina = (n) => {
        setItemsPorPagina(n); setPaginaActual(1);
        loadVentas(1, n, filtro);
    };

    if (showForm) return <NuevaVenta onClose={handleCloseForm} ventaEdit={ventaEdit} />;

    const COLS = [
        { h: "ID Venta" }, { h: "Cliente" }, { h: "Fecha" },
        { h: "Subtotal", num: true }, { h: "Total", num: true }, { h: "Estado" }, { h: "Acciones", num: true },
    ];

    return (
        <>
            <style>{VT_CSS}</style>

            <div className="vt-page" style={{ minHeight: "100%", background: C.bg, padding: "28px 32px" }}>

                {/* ── HEADER ── */}
                <div className="vt-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 16 }}>
                    <div>
                        <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>Gestión de Pedidos</h4>
                        <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 13 }}>
                            {totalItems} pedido{totalItems !== 1 ? "s" : ""} registrado{totalItems !== 1 ? "s" : ""}
                        </p>
                    </div>
                    <div className="vt-head" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div className="vt-search">
                            <FaSearch className="vt-search-ic" size={13} />
                            <input type="text" placeholder="Filtrar por ID o cliente..." value={filtro} onChange={e => setFiltro(e.target.value)} aria-label="Filtrar pedidos" />
                            {filtro && <button className="vt-search-x" onClick={() => setFiltro("")} aria-label="Limpiar filtro"><FaTimes size={10} /></button>}
                        </div>
                        <button className="vt-btn-primary" onClick={handleAgregar}>
                            <FaPlusCircle size={15} /> Agregar Pedido
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{ background: "#fef2f2", border: `1.5px solid #fecaca`, borderRadius: 12, padding: "12px 18px", marginBottom: 20, color: C.danger, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 12 }}>
                        {error}
                        <button onClick={() => loadVentas(1, itemsPorPagina, filtro)} style={{ background: C.danger, color: "#fff", border: "none", borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Reintentar</button>
                    </div>
                )}

                {/* ── TABLA ── */}
                <div className="vt-card-table">
                    <div style={{ overflowX: "auto" }}>
                        <table className="vt-table">
                            <thead>
                                <tr>{COLS.map(c => <th key={c.h} style={{ textAlign: c.num ? "right" : "left" }}>{c.h}</th>)}</tr>
                            </thead>
                            <tbody>
                                {loading && ventas.length === 0 ? (
                                    <SkeletonRows cols={7} rows={Math.min(itemsPorPagina, 6)} />
                                ) : ventas.length === 0 ? (
                                    <tr><td colSpan={7}>
                                        <div className="vt-empty">
                                            <div className="vt-empty-ic" style={{ background: C.accentSoft, color: C.accent }}>{filtro ? <FaSearch /> : <FaBoxOpen />}</div>
                                            <h5>{filtro ? "Sin resultados" : "Aún no hay pedidos"}</h5>
                                            <p>{filtro ? `No se encontraron ventas para “${filtro}”.` : "No hay ventas registradas."}</p>
                                            {filtro
                                                ? <button className="vt-btn-ghost" onClick={() => setFiltro("")}>Limpiar filtro</button>
                                                : <button className="vt-btn-primary" onClick={handleAgregar}>Crear primera venta</button>}
                                        </div>
                                    </td></tr>
                                ) : (
                                    ventas.map((venta, idx) => {
                                        const cancelada = venta.EstadoID === ESTADO_VENTA.CANCELADA;
                                        const entregada = venta.EstadoID === ESTADO_VENTA.ENTREGADA;
                                        // Solo se pueden eliminar pedidos pendientes o cancelados; el resto es historial (se cancelan)
                                        const puedeEliminar = venta.EstadoID === ESTADO_VENTA.PENDIENTE || cancelada;
                                        return (
                                            <tr key={venta.VentaID} className="vt-row" style={{ animationDelay: `${Math.min(idx, 10) * 25}ms`, opacity: loading ? 0.55 : 1 }}>
                                                <td><span className="vt-id">#{venta.VentaID}</span></td>
                                                <td>
                                                    <div className="vt-client">
                                                        <div className="vt-avatar">{iniciales(venta.usuario?.Nombre)}</div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <div className="vt-client-name">{venta.usuario?.Nombre || `Doc: ${venta.DocumentoID}`}</div>
                                                            <div className="vt-client-sub">{venta.DocumentoID} · <MetodoPagoMini metodo={venta.MetodoPago} /></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><div className="vt-date">{fmtFecha(venta.FechaVenta)}</div><div className="vt-time">{fmtHora(venta.FechaVenta)}</div></td>
                                                <td className="vt-num" style={{ color: C.muted }}>{fmtCOP(venta.Subtotal)}</td>
                                                <td className="vt-num" style={{ fontWeight: 800, color: C.navy, fontSize: 14 }}>{fmtCOP(venta.Total)}</td>
                                                <td><EstadoBadge id={venta.EstadoID} nombre={nombreEstado(venta)} /></td>
                                                <td>
                                                    <div className="vt-actions">
                                                        <button className="vt-ibtn vt-ibtn-view" onClick={() => handleVer(venta)} title="Ver detalles" disabled={loadingDetalleId === venta.VentaID}>
                                                            {loadingDetalleId === venta.VentaID
                                                                ? <span style={{ width: 12, height: 12, border: "2px solid #c7d9ff", borderTopColor: C.accent, borderRadius: "50%", animation: "vtSpin .7s linear infinite" }} />
                                                                : <FaEye size={13} />}
                                                        </button>
                                                        <button className="vt-ibtn vt-ibtn-edit" onClick={() => handleEditar(venta)}
                                                            title={cancelada ? "Una venta cancelada no se puede editar" : entregada ? "Una venta entregada no se puede editar" : "Editar"}
                                                            disabled={cancelada || entregada}>
                                                            <FaEdit size={12} />
                                                        </button>
                                                        <button className="vt-ibtn vt-ibtn-state" onClick={() => setVentaEstado(venta)}
                                                            title={cancelada ? "Una venta cancelada no puede cambiar de estado" : "Cambiar estado"}
                                                            disabled={cancelada}>
                                                            <FaSyncAlt size={12} />
                                                        </button>
                                                        <button className="vt-ibtn vt-ibtn-del" onClick={() => handleEliminar(venta)}
                                                            title={puedeEliminar ? "Eliminar" : "Un pedido pagado, en producción o entregado es historial y no se elimina (puedes cancelarlo)"}
                                                            aria-label="Eliminar pedido"
                                                            disabled={deletingId === venta.VentaID || !puedeEliminar}>
                                                            <FaTrash size={11} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ── PAGINACIÓN ── */}
                    {!error && ventas.length > 0 && (
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
            </div>

            {showDetailModal && selectedVenta && (
                <ModalDetalleVenta venta={selectedVenta} onClose={() => setShowDetailModal(false)} onActualizado={() => loadVentas(paginaActual, itemsPorPagina, filtro)} />
            )}

            <EstadoVentaModal
                show={!!ventaEstado}
                venta={ventaEstado}
                estados={estadosVenta}
                onClose={() => setVentaEstado(null)}
                onConfirm={confirmarCambioEstado}
            />
        </>
    );
};

export default Ventas;
