import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { ThemeContext } from '../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';
import logo from '../assets/images/compudoctor-logo.png';

function ChangePassword() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { theme, toggleTheme } = useContext(ThemeContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            return setError('Las nuevas contraseñas no coinciden.');
        }
        if (newPassword.length < 6) {
            return setError('La nueva contraseña debe tener al menos 6 caracteres.');
        }
        
        setLoading(true);
        const user = auth.currentUser;

        if (!user) {
            setError('No se encontró un usuario. Por favor, inicia sesión de nuevo.');
            setLoading(false);
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            
            await updatePassword(user, newPassword);
            
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { passwordChanged: true });
            
            navigate('/');

        } catch (err) {
            if (err.code === 'auth/wrong-password') {
                setError('La contraseña actual es incorrecta.');
            } else {
                setError('Ocurrió un error. Inténtalo de nuevo.');
            }
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
            <div className="absolute top-4 right-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                    title="Cambiar tema"
                >
                    {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
                </button>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border dark:border-gray-700">
                <div className="flex flex-col items-center mb-6">
                    <img src={logo} alt="CompuDoctor Logo" className="h-20 w-auto mb-2" />
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Cambiar Contraseña</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Debes establecer una nueva contraseña para continuar.</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300" htmlFor="currentPassword">
                            Contraseña Actual (es tu email)
                        </label>
                        <input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                     <div className="mb-4">
                        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300" htmlFor="newPassword">
                            Nueva Contraseña
                        </label>
                        <input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                             className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300" htmlFor="confirmPassword">
                            Confirmar Nueva Contraseña
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-center text-sm mb-4">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                        {loading ? 'Guardando...' : 'Guardar Contraseña'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ChangePassword;