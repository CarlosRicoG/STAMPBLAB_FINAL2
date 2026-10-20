import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../components/layouts/DashboardLayout";
const NoEncontrada = lazy(() => import("../pages/NoEncontrada"));
const Cotizaciones = lazy(() => import("../pages/Cotizaciones"));
const Roles = lazy(() => import("../pages/Roles"));
const Insumos = lazy(() => import("../pages/Insumos"));
const Productos = lazy(() => import("../pages/Productos"));
const Colores = lazy(() => import("../pages/Colores"));
const Tallas = lazy(() => import("../pages/Tallas"));
const Usuarios = lazy(() => import("../pages/Usuarios"));
const Proveedores = lazy(() => import("../pages/Proveedores"));
const Tecnicas = lazy(() => import("../pages/Tecnicas"));
import Home from "../components/landing/landingPage";
const Servicios = lazy(() => import("../components/landing/Servicios"));
const ProductosLanding = lazy(() => import("../components/landing/Productos"));
const CotizacionesLanding = lazy(() => import("../components/landing/CotizacionesL"));
const RegistroLanding = lazy(() => import("../components/auth/Registro"));
const LoginLanding = lazy(() => import("../components/auth/Login"));
const RestablecerContraseña = lazy(() => import("../components/auth/Restablecercontraseña"));
const RecuperarContraseña = lazy(() => import("../components/auth/Recuperarcontraseña"));
const DashboardMedicionesempeño = lazy(() => import("../pages/MedicionDesempeño"));
const EditarPerfil = lazy(() => import("../components/landing/EditarPerfil"));
const MisCotizaciones = lazy(() => import("../components/landing/Miscotizaciones"));
const FormularioCompra = lazy(() => import("../components/landing/FormularioCompra"));
const AgregarProducto = lazy(() => import("../pages/formularios_dash/AgregarProducto"));
const Ventas = lazy(() => import("../pages/Ventas"));
import { ProtectedRoute } from "./ProtectedRoute";
const VentasPendientes = lazy(() => import("../pages/VentasPendientes"));
const Compras = lazy(() => import("../pages/Compras"));
const Clientes = lazy(() => import("../pages/Clientes"));
const MisCompras = lazy(() => import("../components/landing/MisCompras"));

// Carga diferida: cada página se descarga al visitarla (bundle inicial mucho más liviano)
const Cargando = () => (
    <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "4px solid #e2e8f0", borderTopColor: "#4f8ef7", animation: "sx-spin .8s linear infinite" }} />
    </div>
);

// Al volver con el botón "atrás" tras cerrar sesión el navegador puede mostrar la página guardada en memoria:
// si ya no hay sesión, se recarga para que cada pantalla aplique su control de acceso.
const useRecargarSinSesion = () => {
    useEffect(() => {
        const alVolver = (e) => {
            let hayToken = true;
            try { hayToken = !!localStorage.getItem("token"); } catch { /* sin acceso al almacenamiento */ }
            if (e.persisted && !hayToken) window.location.reload();
        };
        window.addEventListener("pageshow", alVolver);
        return () => window.removeEventListener("pageshow", alVolver);
    }, []);
};

const AppRoutes = () => {
    useRecargarSinSesion();


    return (

        <Suspense fallback={<Cargando />}>

        <Routes>
            {/* Ruta raíz redirige al registro */}
            <Route path="/" element={<Home />} />


            {/* Rutas del Landing */}
            <Route path="/landing" element={<Home />} />
            <Route path="/cotizacionesLanding" element={<CotizacionesLanding />} />
            <Route path="/servicios" element={<Servicios />} />
            <Route path="/productosLanding" element={<ProductosLanding />} />
            <Route path="/signup" element={<RegistroLanding />} />
            <Route path="/login" element={<LoginLanding />} />
            <Route path="/recuperarcontraseña" element={<RecuperarContraseña />} />
            <Route path="/restablecercontraseña" element={<RestablecerContraseña />} />
            <Route path="/editarperfil" element={<ProtectedRoute><EditarPerfil /></ProtectedRoute>} />
            <Route path="/miscompras" element={<ProtectedRoute><MisCompras /></ProtectedRoute>} />
            <Route path="/miscotizaciones" element={<ProtectedRoute><MisCotizaciones /></ProtectedRoute>} />
            <Route path="/formularioCompra" element={<FormularioCompra />} />


            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute adminOnly>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >

                {/* Rutas del Dashboard */}
                <Route index element={<DashboardMedicionesempeño />} />
                <Route path="ventas" element={<Ventas></Ventas>} />
                <Route path="/dashboard/ventas-pendientes" element={<VentasPendientes />} />
                <Route path="cotizaciones" element={<Cotizaciones />} />
                <Route path="cotizaciones/nueva" element={<Navigate to="/dashboard/cotizaciones" replace />} />
                <Route path="roles" element={<Roles />} />
                <Route path="insumos" element={<Insumos />} />
                <Route path="pedidos" element={<Compras />} />
                <Route path="productos" element={<Productos />} />
                <Route path="agregar-producto" element={<AgregarProducto />} />
                <Route path="/dashboard/editar-producto/:id" element={<AgregarProducto />} />
                <Route path="colores" element={<Colores />} />
                <Route path="tallas" element={<Tallas />} />
                <Route path="usuarios" element={<Usuarios />} />
                <Route path="clientes" element={<Clientes />} />
                <Route path="proveedores" element={<Proveedores />} />
                <Route path="tecnicas" element={<Tecnicas />} />
                <Route path="mediciondesempeño" element={<DashboardMedicionesempeño />} />

            </Route>

            <Route path="*" element={<NoEncontrada />} />

        </Routes>

        </Suspense>

    );
};

export default AppRoutes;
