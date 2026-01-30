import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/auth/Login';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Clientes from './pages/Clientes';
import Diagnostico from './pages/Diagnostico';
import VerEstado from './pages/VerEstado';
import Inventario from './pages/Inventario';
import Reportes from './pages/Reportes';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PermissionDenied from './pages/PermissionDenied';
import ChangePassword from './pages/ChangePassword';
import ClientHistory from './pages/ClientHistory';
import BandejaTecnico from './pages/BandejaTecnico';
import DetalleDiagnostico from './pages/DetalleDiagnostico';
import DetalleHistorial from './pages/DetalleHistorial';
import SaldosPendientes from './pages/Reportes/SaldosPendientes';
import ProductividadTecnicos from './pages/Reportes/ProductividadTecnicos';
import TopServicios from './pages/Reportes/TopServicios';
import IngresosCostos from './pages/Reportes/IngresosCostos';
import TiemposResolucion from './pages/Reportes/TiemposResolucion';
import InventarioEntrada from './pages/Reportes/InventarioEntrada';
import Categorias from './pages/Inventario/Categorias';
import EstadosFuncionales from './pages/Inventario/EstadosFuncionales';
import UnidadesMedida from './pages/Inventario/UnidadesMedida';
import Historial from './pages/Historial';
import Ventas from './pages/Ventas';
import DetalleVenta from './pages/DetalleVenta';

import { Toaster } from 'react-hot-toast';

function App() {
    return (
        <BrowserRouter>
            <Toaster position="top-right" reverseOrder={false} />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="/permission-denied" element={<PermissionDenied />} />

                <Route path="/" element={<Dashboard />}>
                    <Route index element={<Clientes />} />

                    <Route path="clientes" element={
                        <ProtectedRoute permissionId="clientes">
                            <Clientes />
                        </ProtectedRoute>
                    } />

                    <Route path="clientes/historial/:clientId" element={
                        <ProtectedRoute permissionId="clientes">
                            <ClientHistory />
                        </ProtectedRoute>
                    } />

                    <Route path="diagnostico" element={
                        <ProtectedRoute permissionId="diagnostico">
                            <Diagnostico />
                        </ProtectedRoute>
                    } />

                    <Route path="diagnostico/:diagnosticoId" element={
                        <ProtectedRoute permissionId="diagnostico">
                            <Diagnostico />
                        </ProtectedRoute>
                    } />

                    <Route path="ver-estado" element={
                        <ProtectedRoute permissionId="ver-estado">
                            <VerEstado />
                        </ProtectedRoute>
                    } />
                    <Route path="ver-estado/historial/:reportId" element={
                        <ProtectedRoute permissionId="ver-estado">
                            <DetalleHistorial />
                        </ProtectedRoute>
                    } />

                    <Route path="inventario" element={
                        <ProtectedRoute permissionId="inventario">
                            <Inventario />
                        </ProtectedRoute>
                    } />
                    <Route path="inventario/categorias" element={
                        <ProtectedRoute permissionId="inventario">
                            <Categorias />
                        </ProtectedRoute>
                    } />
                    <Route path="inventario/estados-funcionales" element={
                        <ProtectedRoute permissionId="inventario">
                            <EstadosFuncionales />
                        </ProtectedRoute>
                    } />
                    <Route path="inventario/unidades-medida" element={
                        <ProtectedRoute permissionId="inventario">
                            <UnidadesMedida />
                        </ProtectedRoute>
                    } />

                    <Route path="reportes" element={
                        <ProtectedRoute permissionId="reportes">
                            <Reportes />
                        </ProtectedRoute>
                    } />

                    <Route path="reportes/saldos-pendientes" element={
                        <ProtectedRoute permissionId="reportes">
                            <SaldosPendientes />
                        </ProtectedRoute>
                    } />
                    <Route path="reportes/productividad-tecnicos" element={
                        <ProtectedRoute permissionId="reportes">
                            <ProductividadTecnicos />
                        </ProtectedRoute>
                    } />
                    <Route path="reportes/top-servicios" element={
                        <ProtectedRoute permissionId="reportes">
                            <TopServicios />
                        </ProtectedRoute>
                    } />
                    <Route path="reportes/ingresos-costos" element={
                        <ProtectedRoute permissionId="reportes">
                            <IngresosCostos />
                        </ProtectedRoute>
                    } />
                    <Route path="reportes/tiempos-resolucion" element={
                        <ProtectedRoute permissionId="reportes">
                            <TiemposResolucion />
                        </ProtectedRoute>
                    } />
                    <Route path="reportes/inventario-entrada" element={
                        <ProtectedRoute permissionId="reportes">
                            <InventarioEntrada />
                        </ProtectedRoute>
                    } />

                    <Route
                        path="historial"
                        element={
                            <ProtectedRoute permissionId="historial">
                                <Historial />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="ventas" element={
                        <ProtectedRoute permissionId="ventas">
                            <Ventas />
                        </ProtectedRoute>
                    } />
                    <Route path="ventas/nueva" element={
                        <ProtectedRoute permissionId="ventas">
                            <DetalleVenta />
                        </ProtectedRoute>
                    } />
                    <Route path="ventas/:id" element={
                        <ProtectedRoute permissionId="ventas">
                            <DetalleVenta />
                        </ProtectedRoute>
                    } />

                    <Route
                        path="usuarios"
                        element={
                            <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
                                <Usuarios />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="bandeja-tecnico" element={
                        <ProtectedRoute permissionId="diagnostico">
                            <BandejaTecnico />
                        </ProtectedRoute>
                    } />
                    <Route path="bandeja-tecnico/:reportId" element={
                        <ProtectedRoute permissionId="diagnostico">
                            <DetalleDiagnostico />
                        </ProtectedRoute>
                    } />
                    <Route path="bandeja-tecnico/historial/:reportId" element={
                        <ProtectedRoute permissionId="diagnostico">
                            <DetalleHistorial />
                        </ProtectedRoute>
                    } />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;