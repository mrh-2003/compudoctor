import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaUserFriends,
  FaLaptopMedical,
  FaCogs,
  FaUsers,
  FaBox,
  FaChartLine,
  FaChevronDown,
  FaBars,
  FaSignOutAlt,
} from "react-icons/fa";
import logo from "../../assets/images/compudoctor-logo.png";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";

function Sidebar({ isMinimized, onToggleMinimize, isMobileOverlay }) {
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { name: "Clientes", icon: <FaUserFriends />, path: "/clientes" },
    { name: "Diagnóstico", icon: <FaLaptopMedical />, path: "/diagnostico" },
    { name: "Ver Estado", icon: <FaCogs />, path: "/ver-estado" },
    { name: "Usuarios", icon: <FaUsers />, path: "/usuarios" },
    { name: "Inventario", icon: <FaBox />, path: "/inventario" },
    {
      name: "Reportes",
      icon: <FaChartLine />,
      path: "#",
      subItems: [
        { name: "Ventas", path: "/reportes/ventas" },
        { name: "Técnicos", path: "/reportes/tecnicos" },
      ],
    },
  ];

  const toggleReports = () => setIsReportsOpen((prev) => !prev);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // Clases responsivas para el sidebar
  let sidebarClasses =
    "fixed top-0 left-0 h-screen shadow-xl z-20 transition-all duration-300 ease-in-out bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200 flex flex-col max-w-full lg:static";
  if (isMobileOverlay) {
    sidebarClasses += " translate-x-0 block";
  } else {
    sidebarClasses += " -translate-x-full hidden";
  }
  sidebarClasses += " lg:translate-x-0 lg:block";
  sidebarClasses += isMinimized ? " w-20" : " w-64";
  sidebarClasses += " lg:w-64 w-4/5 sm:w-64";

  return (
    <aside className={sidebarClasses} style={{ transition: "transform 0.3s" }}>
      <div className="flex flex-col h-full min-h-screen">
        {/* Logo y botones de menú */}
        <div className="flex items-center justify-between p-4 mb-4">
          <img
            src={logo}
            alt="CompuDoctor Logo"
            className={`transition-all duration-300 ${
              isMinimized ? "h-10 w-10" : "h-14 w-auto"
            }`}
          />
          {/* Botón hamburguesa solo en móvil */}
          <button
            onClick={onToggleMinimize}
            className="ml-2 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors block lg:hidden"
            title={isMinimized ? "Expandir menú" : "Minimizar menú"}
          >
            <FaBars />
          </button>
          {/* Botón minimizar solo en desktop */}
          <button
            onClick={onToggleMinimize}
            className="ml-2 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors hidden lg:block"
            title={isMinimized ? "Expandir menú" : "Minimizar menú"}
          >
            <FaBars />
          </button>
        </div>
        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item, idx) => (
              <li key={idx}>
                {item.subItems ? (
                  <>
                    <button
                      onClick={toggleReports}
                      className="w-full flex items-center p-3 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="ml-4 flex-1 text-left">{item.name}</span>
                      <FaChevronDown
                        className={`ml-2 transition-transform ${
                          isReportsOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isReportsOpen && (
                      <ul className="pl-10 mt-1 space-y-1">
                        {item.subItems.map((sub, subIdx) => (
                          <li key={subIdx}>
                            <NavLink
                              to={sub.path}
                              className={({ isActive }) =>
                                `flex items-center p-3 rounded-lg text-sm transition-colors ${
                                  isActive
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-gray-200 dark:hover:bg-gray-700"
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
                    className={({ isActive }) =>
                      `flex items-center p-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`
                    }
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="ml-4">{item.name}</span>
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>
        {/* Botones inferiores */}
        <div className="p-4 mt-auto flex flex-col gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors"
            title="Cerrar sesión"
          >
            <FaSignOutAlt className="mr-2" />
            {!isMinimized && "Cerrar sesión"}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
