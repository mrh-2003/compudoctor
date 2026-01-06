import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    FaUserFriends,
    FaLaptopMedical,
    FaCogs,
    FaUsers,
    FaBox,
    FaChartLine,
    FaChevronDown,
    FaSignOutAlt,
    FaAngleLeft,
    FaAngleRight,
    FaInbox
} from 'react-icons/fa';
import logo from '../../assets/images/compudoctor-logo.png';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';

function Sidebar({ isMinimized, isMobileOpen, toggleMinimize, closeMobileMenu }) {
    const [isReportsOpen, setIsReportsOpen] = useState(false);
    const navigate = useNavigate();
    const { currentUser, pendingReportsCount } = useAuth();

    const handleLinkClick = () => {
        if (window.innerWidth < 1024) {
            closeMobileMenu();
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    const allNavItems = [
        { name: 'Clientes', icon: <FaUserFriends />, path: '/clientes', id: 'clientes' },
        { name: 'Informe Técnico', icon: <FaLaptopMedical />, path: '/diagnostico', id: 'diagnostico' },
        { name: 'Bandeja', icon: <FaInbox />, path: '/bandeja-tecnico', id: 'bandeja' },
        { name: 'Ver Estado', icon: <FaCogs />, path: '/ver-estado', id: 'ver-estado' },
        {
            name: 'Inventario',
            icon: <FaBox />,
            id: 'inventario',
            subItems: [
                { name: 'Listado Principal', path: '/inventario' },
                { name: 'Categorías', path: '/inventario/categorias' },
                { name: 'Estados Funcionales', path: '/inventario/estados-funcionales' },
                { name: 'Unidades de Medida', path: '/inventario/unidades-medida' },
            ]
        },
        {
            name: 'Reportes',
            icon: <FaChartLine />,
            id: 'reportes',
            subItems: [
                { name: 'Panel Principal', path: '/reportes' },
                { name: 'Saldos Pendientes', path: '/reportes/saldos-pendientes' },
                { name: 'Productividad', path: '/reportes/productividad-tecnicos' },
                { name: 'Top Servicios', path: '/reportes/top-servicios' },
                { name: 'Ingresos', path: '/reportes/ingresos-costos' },
                { name: 'Tiempos Resolución', path: '/reportes/tiempos-resolucion' },
                { name: 'Inventario', path: '/reportes/inventario-entrada' },
            ],
        },
        { name: 'Usuarios', icon: <FaUsers />, path: '/usuarios', id: 'usuarios' },
    ];

    const filteredNavItems = allNavItems.filter(item => {
        if (!currentUser?.permissions) {
            return false;
        }

        if (item.id === 'usuarios') {
            return currentUser.rol === 'SUPERADMIN' || currentUser.rol === 'ADMIN';
        }

        if (item.id === 'bandeja') {
            return currentUser.rol === 'USER' || currentUser.rol === 'SUPERUSER' || currentUser.rol === 'ADMIN' || currentUser.rol === 'SUPERADMIN';
        }

        return currentUser.permissions.includes(item.id);
    });

    return (
        <aside
            className={`
        bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200
        h-screen flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out
        fixed lg:relative inset-y-0 left-0 z-40
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${isMinimized ? 'w-20' : 'w-64'}
      `}
        >
            <div className="flex flex-col h-full">
                <div
                    className={`flex items-center p-4 h-16 border-b dark:border-gray-700 ${isMinimized ? 'justify-center' : 'justify-between'
                        }`}
                >
                    {!isMinimized && (
                        <img src={logo} alt="CompuDoctor Logo" className="h-8 w-auto" />
                    )}
                    <button
                        onClick={toggleMinimize}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 hidden lg:block"
                        title={isMinimized ? 'Expandir menú' : 'Minimizar menú'}
                    >
                        {isMinimized ? <FaAngleRight /> : <FaAngleLeft />}
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-2 py-4">
                    <ul className="space-y-1">
                        {filteredNavItems.map((item, idx) => (
                            <li key={idx}>
                                {item.subItems ? (
                                    <>
                                        <button
                                            onClick={() => setIsReportsOpen(prev => !prev)}
                                            className={`w-full flex items-center p-3 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 ${isMinimized ? 'justify-center' : ''
                                                }`}
                                        >
                                            <span className="text-xl">{item.icon}</span>
                                            {!isMinimized && (
                                                <span className="ml-4 flex-1 text-left font-semibold">
                                                    {item.name}
                                                </span>
                                            )}
                                            {!isMinimized && (
                                                <FaChevronDown
                                                    className={`ml-2 transition-transform ${isReportsOpen ? 'rotate-180' : ''
                                                        }`}
                                                />
                                            )}
                                        </button>
                                        {isReportsOpen && !isMinimized && (
                                            <ul className="pl-10 mt-1 space-y-1">
                                                {item.subItems.map((sub, subIdx) => (
                                                    <li key={subIdx}>
                                                        <NavLink
                                                            to={sub.path}
                                                            onClick={handleLinkClick}
                                                            className={({ isActive }) =>
                                                                `block px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                                                                    ? 'bg-blue-500 text-white'
                                                                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                                                                }`
                                                            }
                                                        >
                                                            {sub.name}
                                                        </NavLink>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </>
                                ) : (
                                    <NavLink
                                        to={item.path}
                                        onClick={handleLinkClick}
                                        className={({ isActive }) =>
                                            `flex items-center p-3 rounded-lg transition-colors font-semibold ${isActive
                                                ? 'bg-blue-500 text-white'
                                                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                                            } ${isMinimized ? 'justify-center' : ''}`
                                        }
                                        title={isMinimized ? item.name : ''}
                                    >
                                        <span className="text-xl">{item.icon}</span>
                                        {!isMinimized && <span className="ml-4 flex-1">{item.name}</span>}

                                        {item.id === 'bandeja' && pendingReportsCount > 0 && (
                                            <span className={`
                                                ${!isMinimized ? 'ml-auto' : ''} 
                                                inline-flex items-center justify-center 
                                                h-5 w-5 text-xs font-bold rounded-full 
                                                bg-red-500 text-white
                                                ${isMinimized ? 'absolute top-3 right-3' : ''}
                                            `}>
                                                {pendingReportsCount}
                                            </span>
                                        )}
                                    </NavLink>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="p-4 border-t dark:border-gray-700">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center w-full p-2 rounded-lg text-white font-bold transition-colors bg-red-600 hover:bg-red-700 ${isMinimized ? 'justify-center' : 'justify-start'
                            }`}
                        title="Cerrar sesión"
                    >
                        <FaSignOutAlt />
                        {!isMinimized && <span className="ml-3">Cerrar sesión</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;