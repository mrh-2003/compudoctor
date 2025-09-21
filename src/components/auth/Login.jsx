
import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/images/compudoctor-logo.png';
import { FiSun, FiMoon } from 'react-icons/fi';

function Login() {
    const { toggleTheme, theme } = useContext(ThemeContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { currentUser, loading } = useAuth();
    const [loginRequested, setLoginRequested] = useState(false);

    useEffect(() => {
        if (loginRequested && !loading && currentUser) {
            // Si el usuario acaba de loguearse y su email es igual a su password, forzar cambio de contraseña
            if (email === password) {
                navigate('/change-password', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }
    }, [loginRequested, loading, currentUser, email, password, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setLoginRequested(true);
        } catch (err) {
            setError('Correo o contraseña incorrectos.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
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
                    <img src={logo} alt="CompuDoctor Logo" className="h-24 w-auto mb-2" />
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Iniciar Sesión</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 mb-2">Correo Electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 dark:text-gray-300 mb-2">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-red-400">
                        {isLoading ? 'Accediendo...' : 'Acceder'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;