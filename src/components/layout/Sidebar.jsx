import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    FaUserFriends, FaLaptopMedical, FaCogs, FaUsers, FaBox, FaChartLine,
    FaSignOutAlt, FaBars, FaChevronDown
} from 'react-icons/fa';
import logo from '../../assets/images/compudoctor-logo.png';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';

const allNavItems = [
    { id: 'clientes', name: 'Clientes', icon: <FaUserFriends />, path: '/clientes' },
    { id: 'diagnostico', name: 'Diagnóstico', icon: <FaLaptopMedical />, path: '/diagnostico' },
    { id: 'ver-estado', name: 'Ver Estado', icon: <FaCogs />, path: '/ver-estado' },
    { id: 'usuarios', name: 'Usuarios', icon: <FaUsers />, path: '/usuarios', adminOnly: true },
    { id: 'inventario', name: 'Inventario', icon: <FaBox />, path: '/inventario' },
    {
        id: 'reportes', name: 'Reportes', icon: <FaChartLine />, path: '#', subItems: [
            { id: 'reportes-ventas', name: 'Ventas', path: '/reportes/ventas' },
            { id: 'reportes-tecnicos', name: 'Técnicos', path: '/reportes/tecnicos' }
        ]
    }
];

function Sidebar({ isDesktopMinimized, isMobileOpen, onToggleDesktop, onToggleMobile }) {
    const [isReportsOpen, setIsReportsOpen] = useState(false);
    const navigate = useNavigate();
    const { currentUser, loading } = useAuth();

    if (loading) {
        return null;
    }

    const visibleNavItems = allNavItems.filter(item => {
        if (!currentUser) return false;
        if (item.adminOnly) {
            return currentUser.rol === 'SUPERADMIN' || currentUser.rol === 'ADMIN';
        }
        if (currentUser.rol === 'SUPERADMIN') {
            return true;
        }
        return currentUser.permissions?.includes(item.id);
    });

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/login');
    };

    const handleLinkClick = () => {
        if (isMobileOpen) {
            onToggleMobile();
        }
    };

    return (
        <aside className={`fixed top-0 left-0 h-full shadow-xl z-40 transition-transform duration-300 ease-in-out bg-white dark:bg-gray-800 flex flex-col lg:static lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} ${isDesktopMinimized ? 'lg:w-20' : 'lg:w-64'}`}>
            <div className="flex flex-col h-full">
                <div className={`flex items-center p-4 border-b dark:border-gray-700 ${isDesktopMinimized ? 'justify-center' : 'justify-between'}`}>
                    {!isDesktopMinimized && <img src={logo} alt="CompuDoctor Logo" className="h-12 w-auto" />}
                    <button onClick={onToggleDesktop} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 hidden lg:block" title={isDesktopMinimized ? 'Expandir' : 'Minimizar'}>
                        <FaBars />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-2 py-4">
                    <ul className="space-y-1">
                        {visibleNavItems.map((item) => (
                            <li key={item.id}>
                                {item.subItems ? (
                                    <>
                                        <button onClick={() => setIsReportsOpen(prev => !prev)} className={`w-full flex items-center p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${isDesktopMinimized ? 'justify-center' : ''}`}>
                                            <span className="text-xl">{item.icon}</span>
                                            {!isDesktopMinimized && <span className="ml-4 flex-1 text-left">{item.name}</span>}
                                            {!isDesktopMinimized && <FaChevronDown className={`transition-transform ${isReportsOpen ? 'rotate-180' : ''}`} />}
                                        </button>
                                        {isReportsOpen && !isDesktopMinimized && (
                                            <ul className="pl-10 mt-1 space-y-1">
                                                {item.subItems.map((sub) => (
                                                    <li key={sub.id}>
                                                        <NavLink to={sub.path} onClick={handleLinkClick} className={({ isActive }) => `block px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                                            {sub.name}
                                                        </NavLink>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </>
                                ) : (
                                    <NavLink to={item.path} onClick={handleLinkClick} className={({ isActive }) => `flex items-center p-3 rounded-lg ${isActive ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'} ${isDesktopMinimized ? 'justify-center' : ''}`} title={isDesktopMinimized ? item.name : ''}>
                                        <span className="text-xl">{item.icon}</span>
                                        {!isDesktopMinimized && <span className="ml-4">{item.name}</span>}
                                    </NavLink>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="p-4 mt-auto border-t dark:border-gray-700">
                    <button onClick={handleLogout} className={`flex items-center w-full p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold ${isDesktopMinimized ? 'justify-center' : 'justify-start'}`} title="Cerrar sesión">
                        <FaSignOutAlt />
                        {!isDesktopMinimized && <span className="ml-3">Cerrar sesión</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;