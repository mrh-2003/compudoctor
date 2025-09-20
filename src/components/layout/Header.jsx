

import { useContext } from 'react'
import { ThemeContext } from '../../context/ThemeContext'
import { FiMenu } from 'react-icons/fi'

function Header({ onToggleSidebar }) {
	const { toggleTheme, theme } = useContext(ThemeContext)

	return (
		<header className="bg-white dark:bg-gray-800 shadow-sm p-4 sticky top-0 z-10 flex items-center justify-between transition-colors duration-300">
			<div className="flex items-center">
				<button
					onClick={onToggleSidebar}
					className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mr-4 focus:outline-none lg:hidden"
				>
					<FiMenu size={24} />
				</button>
				<h1 className="text-xl font-bold text-gray-800 dark:text-white">
					Dashboard
				</h1>
			</div>
			<div className="flex items-center space-x-4">
				<button
					onClick={toggleTheme}
					className="p-2 rounded-full text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
					title="Cambiar modo claro/oscuro"
				>
					{theme === 'light' ? '🌞' : '🌙'}
				</button>
			</div>
		</header>
	)
}

export default Header
 