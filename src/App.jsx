import React from "react";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 flex flex-col items-center justify-center p-6">
      <header className="text-center mb-8">
        <h1 className="text-5xl font-bold text-white drop-shadow-lg">
          ¡Bienvenido a mi App con Tailwind!
        </h1>
        <p className="mt-4 text-lg text-white/90">
          Aprende y experimenta React + Tailwind CSS
        </p>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tarjeta 1 */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transform transition duration-300">
          <img
            src="https://i.pravatar.cc/150?img=1"
            alt="Avatar"
            className="w-24 h-24 rounded-full border-4 border-blue-400 mb-4"
          />
          <h2 className="text-xl font-semibold text-gray-800">Juan Pérez</h2>
          <p className="text-gray-500 text-center mt-2">
            Frontend Developer
          </p>
          <button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors">
            Seguir
          </button>
        </div>

        {/* Tarjeta 2 */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transform transition duration-300">
          <img
            src="https://i.pravatar.cc/150?img=2"
            alt="Avatar"
            className="w-24 h-24 rounded-full border-4 border-purple-400 mb-4"
          />
          <h2 className="text-xl font-semibold text-gray-800">María López</h2>
          <p className="text-gray-500 text-center mt-2">
            UI/UX Designer
          </p>
          <button className="mt-4 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition-colors">
            Seguir
          </button>
        </div>

        {/* Tarjeta 3 */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transform transition duration-300">
          <img
            src="https://i.pravatar.cc/150?img=3"
            alt="Avatar"
            className="w-24 h-24 rounded-full border-4 border-pink-400 mb-4"
          />
          <h2 className="text-xl font-semibold text-gray-800">Carlos Díaz</h2>
          <p className="text-gray-500 text-center mt-2">
            Backend Developer
          </p>
          <button className="mt-4 bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded transition-colors">
            Seguir
          </button>
        </div>
      </main>

      <footer className="mt-12 text-white/80">
        © 2025 Mi Aplicación React + Tailwind
      </footer>
    </div>
  );
}

export default App;
