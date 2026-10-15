import { useState, useEffect, useCallback, useRef } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, LabelList
} from "recharts";
import { FaFilePdf, FaChartBar, FaSyncAlt, FaBoxOpen, FaCubes } from "react-icons/fa";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;


const MESES = [
    { valor: "1",  nombre: "Enero" },
    { valor: "2",  nombre: "Febrero" },
    { valor: "3",  nombre: "Marzo" },
    { valor: "4",  nombre: "Abril" },
    { valor: "5",  nombre: "Mayo" },
    { valor: "6",  nombre: "Junio" },
    { valor: "7",  nombre: "Julio" },
    { valor: "8",  nombre: "Agosto" },
    { valor: "9",  nombre: "Septiembre" },
    { valor: "10", nombre: "Octubre" },
    { valor: "11", nombre: "Noviembre" },
    { valor: "12", nombre: "Diciembre" },
];

/* ── Tooltip oscuro personalizado ── */
const CustomTooltip = ({ active, payload, label, unit = "unidades" }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10,
            padding: "10px 16px", color: "#f1f5f9", fontSize: 13,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)", minWidth: 120,
        }}>
            <p style={{ margin: 0, fontWeight: 700, color: "#94a3b8", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5 }}>
                {label}
            </p>
            <p style={{ margin: "6px 0 0", fontWeight: 800, fontSize: 20, color: "#fff", lineHeight: 1 }}>
                {payload[0].value}
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginLeft: 4 }}>{unit}</span>
            </p>
        </div>
    );
};

/* ── Tarjeta KPI ── */
const KpiCard = ({ label, value, icon: Icon, color, bg, border }) => (
    <div style={{
        background: bg, borderRadius: 16, padding: "20px 24px",
        border: `1.5px solid ${border}`, display: "flex", alignItems: "center", gap: 16,
    }}>
        <div style={{
            width: 48, height: 48, borderRadius: 12, background: color,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, boxShadow: `0 4px 12px ${color}55`
        }}>
            <Icon size={20} color="#fff" />
        </div>
        <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 1 }}>
                {label}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 30, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                {value}
            </p>
        </div>
    </div>
);

/* ── Tarjeta de gráfica ── */
const ChartCard = ({ title, subtitle, children, isEmpty, accentColor }) => (
    <div style={{
        background: "#fff", borderRadius: 20, padding: "24px 24px 16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px #f1f5f9",
        display: "flex", flexDirection: "column", height: "100%",
    }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 4, height: 36, borderRadius: 4, background: accentColor, flexShrink: 0, marginTop: 2 }} />
            <div>
                <h6 style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#0f172a", fontFamily: "'Outfit',sans-serif" }}>
                    {title}
                </h6>
                {subtitle && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{subtitle}</p>}
            </div>
        </div>
        {isEmpty ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#cbd5e1", gap: 10, minHeight: 220 }}>
                <FaChartBar size={40} style={{ opacity: 0.25 }} />
                <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Sin datos para este período</p>
            </div>
        ) : (
            <div style={{ flex: 1 }}>{children}</div>
        )}
    </div>
);

/* ════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════════════════════════ */
const DashboardMedicionDesempeño = () => {
    const [ventasPorMes, setVentasPorMes]       = useState([]);
    const [productosMasVendidos, setProductos]   = useState([]);
    const [insumosUtilizados, setInsumos]        = useState([]);
    const [loading, setLoading]                  = useState(true);
    const [exportingPDF, setExportingPDF]        = useState(false);
    const [error, setError]                      = useState(null);
    const [tecnicas, setTecnicas]                = useState([]);
    const [productos, setProductosList]          = useState([]);
    const [filtros, setFiltros]                  = useState({ mes: "", tecnicaId: "", productoId: "" });
    const dashRef                                = useRef(null);

    /* ── Opciones filtros ── */
    useEffect(() => {
        Promise.all([
            fetch(`${API_BASE}/tecnicas`).then(r => r.json()),
            fetch(`${API_BASE}/productos`).then(r => r.json()),
        ]).then(([t, p]) => {
            setTecnicas(Array.isArray(t) ? t : []);
            setProductosList(p.datos || (Array.isArray(p) ? p : []));
        }).catch(console.error);
    }, []);

    /* ── Datos dashboard ── */
    const cargarDatos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (filtros.mes)        params.append("mes", filtros.mes);
            if (filtros.tecnicaId)  params.append("tecnicaId", filtros.tecnicaId);
            if (filtros.productoId) params.append("productoId", filtros.productoId);

            const res  = await fetch(`${API_BASE}/ventas/dashboard?${params}`);
            const data = await res.json();

            if (data.estado) {
                setVentasPorMes(data.datos.ventasPorTecnicas    || []);
                setProductos(data.datos.productosMasVendidos    || []);
                setInsumos(data.datos.insumosUtilizados         || []);
            } else {
                setError("No se pudieron cargar los datos.");
            }
        } catch {
            setError("Error de conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    }, [filtros]);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    const handleFiltro   = (campo, valor) => setFiltros(prev => ({ ...prev, [campo]: valor }));
    const limpiarFiltros = () => setFiltros({ mes: "", tecnicaId: "", productoId: "" });

    /* ── Exportar PDF ── */
    const exportarPDF = async () => {
        if (!dashRef.current) return;
        setExportingPDF(true);
        try {
            await new Promise(r => setTimeout(r, 400));
            const canvas = await html2canvas(dashRef.current, {
                scale: 2, useCORS: true, logging: false, backgroundColor: "#f8fafc",
            });
            const imgData = canvas.toDataURL("image/png");
            const pdf     = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pageW   = pdf.internal.pageSize.getWidth();
            const pageH   = pdf.internal.pageSize.getHeight();
            const imgH    = (canvas.height * pageW) / canvas.width;

            if (imgH <= pageH) {
                pdf.addImage(imgData, "PNG", 0, 0, pageW, imgH);
            } else {
                let yOffset = 0;
                while (yOffset < imgH) {
                    if (yOffset > 0) pdf.addPage();
                    pdf.addImage(imgData, "PNG", 0, -yOffset, pageW, imgH);
                    yOffset += pageH;
                }
            }
            pdf.save(`Medicion_Desempeño_${new Date().toLocaleDateString("es-CO")}.pdf`);
        } catch (err) {
            alert("Error al generar el PDF: " + err.message);
        } finally {
            setExportingPDF(false);
        }
    };

    /* ── KPIs ── */
    const totalVentas    = ventasPorMes.reduce((a, d) => a + (d.ventas    || 0), 0);
    const totalProductos = productosMasVendidos.reduce((a, d) => a + (d.cantidad || 0), 0);
    const totalInsumos   = insumosUtilizados.reduce((a, d) => a + (d.cantidad  || 0), 0);
    const mesLabel       = filtros.mes ? MESES.find(m => m.valor === filtros.mes)?.nombre : "Todo el año";

    /* ── Destaca la barra más alta con color fuerte, el resto más suave ── */
    const colorBars = (data, key, strong, soft) => {
        const max = Math.max(...data.map(d => d[key] || 0));
        return data.map(d => (d[key] || 0) === max ? strong : soft);
    };

    const ventasColors  = colorBars(ventasPorMes,         "ventas",   "#16a34a", "#bbf7d0");
    const productColors = colorBars(productosMasVendidos,  "cantidad", "#7c3aed", "#ddd6fe");
    const insumosColors = colorBars(insumosUtilizados,     "cantidad", "#2563eb", "#bfdbfe");

    /* ══════════════════════════════════════════════ RENDER ══ */
    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }
                .fsel:focus { outline: none; border-color: #2563eb !important; }
                .btn-limpiar:hover { background: #f1f5f9 !important; }
                .btn-pdf:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(220,38,38,0.38) !important; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <div style={{ minHeight: "100dvh", background: "#f8fafc", padding: "28px 32px", fontFamily: "'Outfit',sans-serif" }}>

                {/* HEADER */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <h4 style={{ margin: 0, fontWeight: 800, fontSize: 24, color: "#0f172a", letterSpacing: "-0.03em" }}>
                            Medición y Desempeño
                        </h4>
                        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13, fontWeight: 500 }}>
                            {mesLabel} · Análisis de ventas, productos e insumos
                        </p>
                    </div>
                    <button className="btn-pdf" onClick={exportarPDF} disabled={exportingPDF || loading}
                        style={{
                            display: "flex", alignItems: "center", gap: 8,
                            background: exportingPDF ? "#9ca3af" : "#dc2626",
                            color: "#fff", border: "none", borderRadius: 10,
                            padding: "10px 20px", fontSize: 13, fontWeight: 700,
                            cursor: exportingPDF ? "not-allowed" : "pointer",
                            fontFamily: "'Outfit',sans-serif",
                            boxShadow: "0 2px 8px rgba(220,38,38,0.25)", transition: "all 0.2s",
                        }}>
                        {exportingPDF
                            ? <><div style={{ width: 14, height: 14, border: "2px solid #fff4", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Generando...</>
                            : <><FaFilePdf size={14} /> Exportar PDF</>}
                    </button>
                </div>

                {/* FILTROS */}
                <div style={{
                    display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28,
                    background: "#fff", borderRadius: 16, padding: "14px 20px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", alignItems: "center"
                }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: 1.5, marginRight: 4 }}>
                        Filtrar por
                    </span>
                    {[
                        { value: filtros.mes,        onChange: v => handleFiltro("mes", v),        placeholder: "Todos los meses",    options: MESES.map(m => ({ value: m.valor, label: m.nombre })) },
                        { value: filtros.tecnicaId,  onChange: v => handleFiltro("tecnicaId", v),  placeholder: "Todas las técnicas", options: tecnicas.map(t => ({ value: t.TecnicaID, label: t.Nombre })) },
                        { value: filtros.productoId, onChange: v => handleFiltro("productoId", v), placeholder: "Todos los productos", options: productos.map(p => ({ value: p.ProductoID, label: p.Nombre })) },
                    ].map((sel, i) => (
                        <select key={i} className="fsel" value={sel.value} onChange={e => sel.onChange(e.target.value)}
                            style={{
                                border: `1.5px solid ${sel.value ? "#2563eb" : "#e2e8f0"}`,
                                borderRadius: 8, padding: "7px 12px", fontSize: 13,
                                color: sel.value ? "#1e293b" : "#94a3b8",
                                fontFamily: "'Outfit',sans-serif", fontWeight: sel.value ? 600 : 400,
                                background: sel.value ? "#eff6ff" : "#fff",
                                cursor: "pointer", minWidth: 170, transition: "all 0.2s",
                            }}>
                            <option value="">{sel.placeholder}</option>
                            {sel.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    ))}
                    <button className="btn-limpiar" onClick={limpiarFiltros}
                        style={{
                            display: "flex", alignItems: "center", gap: 6,
                            border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 14px",
                            fontSize: 13, color: "#64748b", fontFamily: "'Outfit',sans-serif",
                            fontWeight: 600, background: "#fff", cursor: "pointer", transition: "all 0.2s",
                        }}>
                        <FaSyncAlt size={11} /> Limpiar
                    </button>
                </div>

                {/* ERROR */}
                {error && (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", color: "#dc2626", fontSize: 13, fontWeight: 500, marginBottom: 24 }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* LOADING */}
                {loading ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 }}>
                        <div style={{ width: 44, height: 44, border: "3px solid #e2e8f0", borderTop: "3px solid #2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        <p style={{ color: "#64748b", fontSize: 14, margin: 0, fontWeight: 500 }}>Cargando indicadores...</p>
                    </div>
                ) : (
                    /* CONTENIDO CAPTURADO EN PDF */
                    <div ref={dashRef}>

                        {/* KPIs */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
                            <KpiCard label="Ventas registradas"  value={totalVentas}    icon={FaChartBar} color="#16a34a" bg="#f0fdf4" border="#bbf7d0" />
                            <KpiCard label="Productos vendidos"  value={totalProductos} icon={FaBoxOpen}  color="#7c3aed" bg="#f5f3ff" border="#ddd6fe" />
                            <KpiCard label="Insumos utilizados"  value={totalInsumos}   icon={FaCubes}    color="#2563eb" bg="#eff6ff" border="#bfdbfe" />
                        </div>

                        {/* FILA 1 */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                            <ChartCard title="Ventas por mes" subtitle="Número de transacciones registradas" isEmpty={ventasPorMes.length === 0} accentColor="#16a34a">
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={ventasPorMes} barSize={32} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#94a3b8", fontFamily: "Outfit" }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "Outfit" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip content={<CustomTooltip unit="ventas" />} cursor={{ fill: "rgba(22,163,74,0.06)", radius: 8 }} />
                                        <Bar dataKey="ventas" radius={[8, 8, 0, 0]}>
                                            {ventasPorMes.map((_, i) => <Cell key={i} fill={ventasColors[i]} />)}
                                            <LabelList dataKey="ventas" position="top" style={{ fontSize: 11, fill: "#64748b", fontWeight: 700, fontFamily: "Outfit" }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title="Productos más vendidos" subtitle="Unidades vendidas por producto" isEmpty={productosMasVendidos.length === 0} accentColor="#7c3aed">
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={productosMasVendidos} barSize={32} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "Outfit" }} axisLine={false} tickLine={false} interval={0} />
                                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "Outfit" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip content={<CustomTooltip unit="unidades" />} cursor={{ fill: "rgba(124,58,237,0.06)", radius: 8 }} />
                                        <Bar dataKey="cantidad" radius={[8, 8, 0, 0]}>
                                            {productosMasVendidos.map((_, i) => <Cell key={i} fill={productColors[i]} />)}
                                            <LabelList dataKey="cantidad" position="top" style={{ fontSize: 11, fill: "#64748b", fontWeight: 700, fontFamily: "Outfit" }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </div>

                        {/* FILA 2 */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                            <ChartCard title="Insumos más utilizados" subtitle="Cantidad comprada por mes" isEmpty={insumosUtilizados.length === 0} accentColor="#2563eb">
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={insumosUtilizados} barSize={32} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#94a3b8", fontFamily: "Outfit" }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "Outfit" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip content={<CustomTooltip unit="unidades" />} cursor={{ fill: "rgba(37,99,235,0.06)", radius: 8 }} />
                                        <Bar dataKey="cantidad" radius={[8, 8, 0, 0]}>
                                            {insumosUtilizados.map((_, i) => <Cell key={i} fill={insumosColors[i]} />)}
                                            <LabelList dataKey="cantidad" position="top" style={{ fontSize: 11, fill: "#64748b", fontWeight: 700, fontFamily: "Outfit" }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title="Resumen comparativo" subtitle="Totales del período seleccionado" isEmpty={totalVentas === 0 && totalProductos === 0 && totalInsumos === 0} accentColor="#f59e0b">
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart
                                        data={[
                                            { nombre: "Ventas",    total: totalVentas },
                                            { nombre: "Productos", total: totalProductos },
                                            { nombre: "Insumos",   total: totalInsumos },
                                        ]}
                                        barSize={52} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="nombre" tick={{ fontSize: 13, fill: "#475569", fontFamily: "Outfit", fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "Outfit" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip content={<CustomTooltip unit="" />} cursor={{ fill: "rgba(0,0,0,0.03)", radius: 8 }} />
                                        <Bar dataKey="total" radius={[10, 10, 0, 0]}>
                                            {["#16a34a", "#7c3aed", "#2563eb"].map((fill, i) => <Cell key={i} fill={fill} />)}
                                            <LabelList dataKey="total" position="top" style={{ fontSize: 14, fill: "#0f172a", fontWeight: 800, fontFamily: "Outfit" }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </div>

                    </div>
                )}
            </div>
        </>
    );
};

export default DashboardMedicionDesempeño;