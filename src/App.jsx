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
                    <Route path="clientes" element={<Clientes />} />
                    <Route path="diagnostico" element={<Diagnostico />} />
                    <Route path="ver-estado" element={<VerEstado />} />
                    <Route path="inventario" element={<Inventario />} />
                    <Route path="reportes" element={<Reportes />} />
                    <Route path="reportes/ventas" element={<Ventas />} />
                    <Route path="reportes/tecnicos" element={<Tecnicos />} />
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