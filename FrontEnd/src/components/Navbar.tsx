// components/Navbar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <nav className="bg-pink-200 shadow-lg">
            <div className="container mx-auto px-4 py-3">
                <div className="flex justify-between items-center">
                    <Link to="/" className="text-xl font-bold text-gray-800 hover:text-pink-600 transition">
                        🏥 Sistema BabySecure
                    </Link>
                    
                    <div className="space-x-4 flex items-center">
                        {user ? (
                            <>
                                <span className="text-sm text-gray-700">
                                    Hola, <strong>{user.nombre}</strong>
                                </span>
                                
                                <span className={`text-xs px-2 py-1 rounded ${
                                    user.rol === 'admin' ? 'bg-purple-100 text-purple-800' :
                                    user.rol === 'medico' ? 'bg-blue-100 text-blue-800' :
                                    user.rol === 'enfermero' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {user.rol === 'admin' && '👑 Administrador'}
                                    {user.rol === 'medico' && '👨‍⚕️ Médico'}
                                    {user.rol === 'enfermero' && '👩‍⚕️ Enfermero'}
                                    {user.rol === 'seguridad' && '🔒 Seguridad'}
                                </span>
                                
                                {user.rol === 'admin' && (
                                    <Link 
                                        to="/admin" 
                                        className="text-gray-700 hover:text-pink-600 transition text-sm font-medium"
                                    >
                                        Panel Admin
                                    </Link>
                                )}
                                
                                {(user.rol === 'medico' || user.rol === 'enfermero') && (
                                    <Link 
                                        to="/medical" 
                                        className="text-gray-700 hover:text-pink-600 transition text-sm font-medium"
                                    >
                                        Panel Médico
                                    </Link>
                                )}
                                
                                <button 
                                    onClick={handleLogout}
                                    className="bg-red-500 text-white px-4 py-1 rounded-md hover:bg-red-600 transition text-sm"
                                >
                                    Cerrar Sesión
                                </button>
                            </>
                        ) : (
                            <Link 
                                to="/login" 
                                className="bg-blue-500 text-white px-4 py-1 rounded-md hover:bg-blue-600 transition text-sm"
                            >
                                Iniciar Sesión
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;