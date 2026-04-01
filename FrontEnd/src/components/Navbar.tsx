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
                    <Link to="/" className="text-xl font-bold hover:text-blue-100 transition">
                    </Link>
                    
                    <div className="space-x-4">
                        {user ? (
                            <>
                                <span className="text-sm text-gray-700">
                                    Hola, <strong>{user.name}</strong>
                                </span>
                                <button 
                                    onClick={handleLogout}
                                    className="bg-red-500 text-white px-4 py-1 rounded-md hover:bg-red-600 transition text-sm"
                                >
                                    Cerrar Sesión
                                </button>
                            </>
                        ) : (
                            <>
                                <Link 
                                    to="/login" 
                                    className="text-blue-500 hover:text-blue-500 transition font-medium"
                                >
                                    Iniciar Sesión
                                </Link>
                                <Link 
                                    to="/registro" 
                                    className="bg-blue-500 text-white px-4 py-1 rounded-md hover:bg-green-600 transition"
                                >
                                    Registrarse
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;