// src/App.jsx
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

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="/permission-denied" element={<PermissionDenied />} />
                
                <Route path="/" element={<Dashboard />}>
                    <Route index element={<Home />} />
                    
                    <Route path="clientes" element={
                        <ProtectedRoute permissionId="clientes">
                            <Clientes />
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
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;