import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
    const { currentUser, loading } = useAuth();
    const [isDesktopMinimized, setIsDesktopMinimized] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Verificando sesión...</div>;
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }
    
    if (currentUser.passwordChanged === false) {
        return <Navigate to="/change-password" replace />;
    }

    const toggleDesktopMinimize = () => setIsDesktopMinimized(prev => !prev);
    const toggleMobileOpen = () => setIsMobileOpen(prev => !prev);

    return (
        <div className="flex min-h-screen w-full bg-gray-100 dark:bg-gray-900">
            <Sidebar
                isDesktopMinimized={isDesktopMinimized}
                isMobileOpen={isMobileOpen}
                onToggleDesktop={toggleDesktopMinimize}
                onToggleMobile={toggleMobileOpen}
            />
            {isMobileOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={toggleMobileOpen}></div>
            )}
            <div className="flex flex-col flex-1 min-w-0">
                <Header onToggleMobile={toggleMobileOpen} />
                <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default Dashboard;