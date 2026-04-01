import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Registro: React.FC = () => {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        
        try {
            await axios.post("http://localhost:5000/api/auth/register", form);
            setSuccess("Usuario registrado exitosamente. Redirigiendo al inicio de sesión...");
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || "Error al registrar usuario";
            setError(errorMessage);
            console.error("Error en registro:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form className="bg-white p-8 rounded-lg shadow-md w-96" onSubmit={handleSubmit}>
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    Registrarse
                </h2>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}
                
                {success && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                        {success}
                    </div>
                )}
                
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Nombre completo
                    </label>
                    <input
                        type="text"
                        placeholder="Juan Pérez"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Correo electrónico
                    </label>
                    <input
                        type="email"
                        placeholder="ejemplo@correo.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Contraseña
                    </label>
                    <input
                        type="password"
                        placeholder="********"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>

                <button 
                    type="submit" 
                    className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-200 disabled:bg-green-300"
                    disabled={loading}
                >
                    {loading ? "Registrando..." : "Registrarse"}
                </button>
            </form>
        </div>
    );
};

export default Registro;