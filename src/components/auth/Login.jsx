import { useState, useEffect, useContext } from 'react'
import { ThemeContext } from '../../context/ThemeContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../services/firebase'
import logo from '../../assets/images/compudoctor-logo.png'

function Login() {
  const { toggleTheme, theme } = useContext(ThemeContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [firebaseError, setFirebaseError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Solo redirigir si estamos en /login para evitar bucles
      if (user && location.pathname === '/login') {
        const from = location.state?.from?.pathname || '/'
        navigate(from, { replace: true })
      }
    })
    return () => unsubscribe()
  }, [navigate, location])

  const validateForm = () => {
    let formErrors = {}
    let isValid = true

    if (!email) {
      isValid = false
      formErrors.email = 'El correo electrónico es obligatorio'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      isValid = false
      formErrors.email = 'El correo electrónico no es válido'
    }

    if (!password) {
      isValid = false
      formErrors.password = 'La contraseña es obligatoria'
    } else if (password.length < 6) {
      isValid = false
      formErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    setErrors(formErrors)
    setFirebaseError('')
    return isValid
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (validateForm()) {
      setIsLoading(true)
      try {
        await signInWithEmailAndPassword(auth, email, password)
      } catch (error) {
        let errorMessage = 'Error al iniciar sesión. Por favor, revise sus credenciales.'
        if (error.code === 'auth/invalid-email' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = 'Correo electrónico o contraseña incorrectos.'
        }
        setFirebaseError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center transition-colors bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700 transition-colors">
        <div className="flex flex-col items-center mb-6">
          <img
            src={logo}
            alt="CompuDoctor Logo"
            className="h-24 w-auto mb-2"
          />
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
            Iniciar Sesión
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Confianza a su Servicio
          </p>
          <button
            onClick={toggleTheme}
            className="absolute top-4 right-4 p-2 rounded-full text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Cambiar modo claro/oscuro"
          >
            {theme === 'light' ? '🌞' : '🌙'}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2" htmlFor="email">
              Correo Electrónico
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2" htmlFor="password">
              Contraseña
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              id="password"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-between">
            <button
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-red-400"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Accediendo...' : 'Acceder'}
            </button>
          </div>
          {firebaseError && <p className="text-red-500 text-center mt-4">{firebaseError}</p>}
        </form>
      </div>
    </div>
  )
}

export default Login
