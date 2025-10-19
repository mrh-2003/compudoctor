import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/auth/Login';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Usuarios from './pages/Usuarios';
import Clientes from './pages/Clientes';
import Diagnostico from './pages/Diagnostico';
import VerEstado from './pages/VerEstado';
import Inventario from './pages/Inventario';
import Reportes from './pages/Reportes';
import Ventas from './pages/Ventas';
import Tecnicos from './pages/Tecnicos';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PermissionDenied from './pages/PermissionDenied';
import ChangePassword from './pages/ChangePassword';
import ClientHistory from './pages/ClientHistory';
import BandejaTecnico from './pages/BandejaTecnico';
import DetalleDiagnostico from './pages/DetalleDiagnostico';
import DetalleHistorial from './pages/DetalleHistorial';

function App() {
    return (
        <BrowserRouter>
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

                    <Route path="reportes" element={
                        <ProtectedRoute permissionId="reportes">
                            <Reportes />
                        </ProtectedRoute>
                    } />

                    <Route path="reportes/ventas" element={
                        <ProtectedRoute permissionId="reportes">
                            <Ventas />
                        </ProtectedRoute>
                    } />

                    <Route path="reportes/tecnicos" element={
                        <ProtectedRoute permissionId="reportes">
                            <Tecnicos />
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
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;