import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import { useAuth } from '../context/AuthContext'

function Dashboard() {
	const { currentUser, loading } = useAuth()
	const [isMinimized, setIsMinimized] = useState(false)
	const [isMobileOpen, setIsMobileOpen] = useState(false)

	if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Verificando sesión...</div>;
    }
	console.log(currentUser);
	
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }
    
    if (currentUser.passwordChanged === false) {
        return <Navigate to="/change-password" replace />;
    }

	const toggleMinimize = () => {
		setIsMinimized(prev => !prev)
	}

	const toggleMobileMenu = () => {
		setIsMobileOpen(prev => !prev)
	}

	return (
		<div className="relative min-h-screen lg:flex bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300">
			<Sidebar
				isMinimized={isMinimized}
				isMobileOpen={isMobileOpen}
				toggleMinimize={toggleMinimize}
				closeMobileMenu={() => setIsMobileOpen(false)}
			/>

			{isMobileOpen && (
				<div
					onClick={() => setIsMobileOpen(false)}
					className="fixed inset-0 bg-black/50 z-30 lg:hidden"
					aria-hidden="true"
				></div>
			)}

			<div className="flex-1 flex flex-col">
				<Header openMobileMenu={toggleMobileMenu} />
				<main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
					<Outlet />
				</main>
			</div>
		</div>
	)
}

export default Dashboard