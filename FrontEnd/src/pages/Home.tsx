import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">
                        ¡Bienvenido a tu página principal!
                    </h1>
                    {user && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <p className="text-lg text-gray-700">
                                Has iniciado sesión como: <strong>{user.nombre}</strong>
                            </p>
                            <p className="text-gray-600">
                                Email: {user.email}
                            </p>
                        </div>
                    )}
                    <div className="mt-6">
                        <p className="text-gray-600">
                            Esta es tu página principal. Aquí puedes agregar el contenido que necesites.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;