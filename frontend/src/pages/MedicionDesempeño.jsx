import { useState, useEffect } from "react";
import { Container, Row, Col, Button, Form, Spinner } from "react-bootstrap";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { FaFilePdf } from "react-icons/fa";


const DashboardMedicionDesempeño = () => {
    // Estados
    const [ventasPorTecnicas, setVentasPorTecnicas] = useState([]);
    const [productosMasVendidos, setProductosMasVendidos] = useState([]);
    const [insumosUtilizados, setInsumosUtilizados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exportingPDF, setExportingPDF] = useState(false);

    // Filtros
    const [filtros, setFiltros] = useState({
        mes: "",
        tecnicaId: "",
        productoId: ""
    });

    // Opciones para los select
    const [tecnicas, setTecnicas] = useState([]);
    const [productos, setProductos] = useState([]);

    // Cargar opciones de filtros al montar el componente
    useEffect(() => {
        cargarOpcionesFiltros();
    }, []);

    // Cargar datos del dashboard cuando cambian los filtros
    useEffect(() => {
        cargarDatosDashboard();
    }, [filtros]);

    const cargarOpcionesFiltros = async () => {
        try {
            // Cargar técnicas
            const resTecnicas = await fetch('http://localhost:3000/api/tecnicas');
            const dataTecnicas = await resTecnicas.json();
            setTecnicas(dataTecnicas);

            // Cargar productos
            const resProductos = await fetch('http://localhost:3000/api/productos');
            const dataProductos = await resProductos.json();
            setProductos(dataProductos.datos || dataProductos);
        } catch (error) {
            console.error('Error al cargar opciones de filtros:', error);
        }
    };

    const cargarDatosDashboard = async () => {
        setLoading(true);
        try {
            // Construir query params
            const params = new URLSearchParams();
            if (filtros.mes) params.append('mes', filtros.mes);
            if (filtros.tecnicaId) params.append('tecnicaId', filtros.tecnicaId);
            if (filtros.productoId) params.append('productoId', filtros.productoId);

            const response = await fetch(`http://localhost:3000/api/ventas/dashboard?${params}`);
            const data = await response.json();

            if (data.estado) {
                setVentasPorTecnicas(data.datos.ventasPorTecnicas);
                setProductosMasVendidos(data.datos.productosMasVendidos);
                setInsumosUtilizados(data.datos.insumosUtilizados);
            }
        } catch (error) {
            console.error('Error al cargar datos del dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const limpiarFiltros = () => {
        setFiltros({
            mes: "",
            tecnicaId: "",
            productoId: ""
        });
    };

    const exportarPDF = async () => {
        setExportingPDF(true);
        try {
            const elemento = document.getElementById('dashboard-content');
            const canvas = await html2canvas(elemento, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Medicion_Desempeño_${new Date().toLocaleDateString()}.pdf`);
        } catch (error) {
            console.error('Error al exportar PDF:', error);
            alert('Error al generar el PDF');
        } finally {
            setExportingPDF(false);
        }
    };

    const meses = [
        { valor: "1", nombre: "Enero" },
        { valor: "2", nombre: "Febrero" },
        { valor: "3", nombre: "Marzo" },
        { valor: "4", nombre: "Abril" },
        { valor: "5", nombre: "Mayo" },
        { valor: "6", nombre: "Junio" },
        { valor: "7", nombre: "Julio" },
        { valor: "8", nombre: "Agosto" },
        { valor: "9", nombre: "Septiembre" },
        { valor: "10", nombre: "Octubre" },
        { valor: "11", nombre: "Noviembre" },
        { valor: "12", nombre: "Diciembre" }
    ];

    return (
        <div
            className="d-flex flex-column"
            style={{
                minHeight: "100dvh",
                background: "linear-gradient(135deg, #ffffffff 0%, #fafcff 100%)",
                padding: "20px 30px",
                fontSize: "0.85rem",
            }}
        >
            {/* Filtros y botón PDF */}
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div className="d-flex gap-2 flex-wrap">
                    <Form.Select 
                        size="sm" 
                        value={filtros.mes}
                        onChange={(e) => handleFiltroChange('mes', e.target.value)}
                    >
                        <option value="">Todos los meses</option>
                        {meses.map(mes => (
                            <option key={mes.valor} value={mes.valor}>{mes.nombre}</option>
                        ))}
                    </Form.Select>

                    <Form.Select 
                        size="sm"
                        value={filtros.tecnicaId}
                        onChange={(e) => handleFiltroChange('tecnicaId', e.target.value)}
                    >
                        <option value="">Todas las técnicas</option>
                        {tecnicas.map(tecnica => (
                            <option key={tecnica.TecnicaID} value={tecnica.TecnicaID}>
                                {tecnica.Nombre}
                            </option>
                        ))}
                    </Form.Select>

                    <Form.Select 
                        size="sm"
                        value={filtros.productoId}
                        onChange={(e) => handleFiltroChange('productoId', e.target.value)}
                    >
                        <option value="">Todos los productos</option>
                        {productos.map(producto => (
                            <option key={producto.ProductoID} value={producto.ProductoID}>
                                {producto.Nombre}
                            </option>
                        ))}
                    </Form.Select>

                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={limpiarFiltros}
                    >
                        Limpiar
                    </Button>
                </div>

                <Button
                    variant="danger"
                    size="sm"
                    className="d-flex align-items-center gap-2 shadow-sm"
                    onClick={exportarPDF}
                    disabled={exportingPDF}
                >
                    {exportingPDF ? (
                        <>
                            <Spinner size="sm" animation="border" />
                            Generando...
                        </>
                    ) : (
                        <>
                            <FaFilePdf size={14} />
                            Exportar PDF
                        </>
                    )}
                </Button>
            </div>

            {/* Contenido del dashboard */}
            <div id="dashboard-content">
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-3">Cargando datos...</p>
                    </div>
                ) : (
                    <>
                        {/* Gráficas */}
                        <Row className="g-4">
                            <Col md={6}>
                                <div className="rounded-4 shadow-sm bg-white p-3">
                                    <h6 className="fw-bold text-center mb-2">
                                        Ventas por Técnicas
                                    </h6>
                                    <ResponsiveContainer width="100%" height={230}>
                                        <BarChart data={ventasPorTecnicas}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="mes" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="ventas" fill="#28a745" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Col>

                            <Col md={6}>
                                <div className="rounded-4 shadow-sm bg-white p-3">
                                    <h6 className="fw-bold text-center mb-2">
                                        Productos más vendidos
                                    </h6>
                                    <ResponsiveContainer width="100%" height={230}>
                                        <BarChart data={productosMasVendidos}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="mes" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="cantidad" fill="#6f42c1" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Col>
                        </Row>

                        <Row className="g-4 mt-2">
                            <Col md={6}>
                                <div className="rounded-4 shadow-sm bg-white p-3">
                                    <h6 className="fw-bold text-center mb-2">
                                        Insumos más utilizados
                                    </h6>
                                    <ResponsiveContainer width="100%" height={230}>
                                        <BarChart data={insumosUtilizados}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="mes" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="cantidad" fill="#0d6efd" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Col>
                        </Row>
                    </>
                )}
            </div>
        </div>
    );
};

export default DashboardMedicionDesempeño;