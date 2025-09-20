import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Login from './components/auth/Login'
import Dashboard from './pages/Dashboard'
import Home from './pages/Home'
import Clientes from './pages/Clientes'
import Diagnostico from './pages/Diagnostico'
import VerEstado from './pages/VerEstado'
import Users from './pages/Users'
import Inventario from './pages/Inventario'
import Reportes from './pages/Reportes'
import Ventas from './pages/Ventas'
import Tecnicos from './pages/Tecnicos'

function App() {
  // Aquí podrías agregar lógica de autenticación si lo deseas
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />}>
          <Route index element={<Home />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="diagnostico" element={<Diagnostico />} />
          <Route path="ver-estado" element={<VerEstado />} />
          <Route path="usuarios" element={<Users />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="reportes/ventas" element={<Ventas />} />
          <Route path="reportes/tecnicos" element={<Tecnicos />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
