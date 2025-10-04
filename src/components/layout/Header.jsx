import { useContext } from 'react'
import { ThemeContext } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { FiMenu, FiSun, FiMoon } from 'react-icons/fi'

function Header({ openMobileMenu }) {
	const { toggleTheme, theme } = useContext(ThemeContext)
	const { currentUser } = useAuth();

	return (
		<header className="bg-white dark:bg-gray-800 shadow-sm p-4 h-16 flex items-center justify-between sticky top-0 z-20 transition-colors duration-300">
			<button
				onClick={openMobileMenu}
				className="p-2 rounded-full text-gray-600 dark:text-gray-300 lg:hidden"
				aria-label="Abrir menú"
			>
				<FiMenu size={24} />
			</button>

			<div className="flex-1 flex items-center justify-end space-x-4">
				{currentUser && (
					<span className="text-gray-800 dark:text-gray-200 text-sm font-medium">
						Hola, {currentUser.nombre}
					</span>
				)}
				<button
					onClick={toggleTheme}
					className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
					title="Cambiar tema"
				>
					{theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
				</button>
			</div>
		</header>
	)
}

export default Header