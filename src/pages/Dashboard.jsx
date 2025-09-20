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
			<Sidebar isMinimized={isSidebarMinimized} onToggleMinimize={toggleSidebar} />
			<div className="flex flex-col flex-1 min-h-screen">
				<Header onToggleSidebar={toggleSidebar} />
				<main className="flex-1 p-4 md:p-8 overflow-y-auto">
					<Outlet />
				</main>
			</div>
		</div>
	)
}

export default Dashboard
