import { useState, useContext } from 'react'
import { Outlet } from 'react-router-dom'
import { ThemeContext } from '../context/ThemeContext'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'

function Dashboard() {
	const [isSidebarMinimized, setIsSidebarMinimized] = useState(false)
	// const { theme } = useContext(ThemeContext)

	const toggleSidebar = () => setIsSidebarMinimized((prev) => !prev)

	return (
		<div className="flex min-h-screen w-full transition-colors duration-300 bg-gray-100 dark:bg-gray-900">
			{/* Sidebar: overlay en móvil, fijo en desktop */}
			<Sidebar isMinimized={isSidebarMinimized} onToggleMinimize={toggleSidebar} isMobileOverlay={isSidebarMinimized} />
			{/* Overlay para móvil */}
			{isSidebarMinimized && (
				<div className="fixed inset-0 bg-black bg-opacity-40 z-10 lg:hidden" onClick={toggleSidebar}></div>
			)}
			<div className="flex flex-col flex-1 min-h-screen">
				<Header onToggleSidebar={toggleSidebar} />
				<main className="flex-1 p-2 sm:p-4 md:p-8 overflow-y-auto max-w-full">
					<Outlet />
				</main>
			</div>
		</div>
	)
}

export default Dashboard
