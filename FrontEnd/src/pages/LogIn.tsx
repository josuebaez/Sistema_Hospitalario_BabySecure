import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import backgroundImage from "../assets/BabySecure.png"; // Si tienes imagen local

const LogIn: React.FC = () => {
    const [form, setForm] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setUser } = useAuth();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            const res = await axios.post("http://localhost:5000/api/auth/login", form);
            setUser(res.data.user);
            navigate("/");
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || "Error al iniciar sesión";
            setError(errorMessage);
            console.error("Error en login:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="relative min-h-screen flex items-center justify-center"
            style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
            }}
        >
            {/* Overlay oscuro */}
            <div className="absolute inset-0 bg-black/50"></div>
            
            {/* Formulario con efecto Glassmorphism */}
            <form 
                className="relative z-10 bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-96 border border-white/30"
                onSubmit={handleSubmit}
            >
                <h2 className="text-3xl font-bold mb-6 text-center text-white">
                    Iniciar Sesión
                </h2>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-500/80 backdrop-blur-sm border border-red-400 text-white rounded">
                        {error}
                    </div>
                )}
                
                <div className="mb-4">
                    <label className="block text-white text-sm font-bold mb-2">
                        Correo electrónico
                    </label>
                    <input
                        type="email"
                        placeholder="ejemplo@correo.com"
                        className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/70"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-white text-sm font-bold mb-2">
                        Contraseña
                    </label>
                    <input
                        type="password"
                        placeholder="********"
                        className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/70"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>

                <button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-200 font-semibold disabled:bg-blue-400"
                    disabled={loading}
                >
                    {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </button>
                
                <div className="mt-4 text-center">
                    <a href="/registro" className="text-white/80 hover:text-white text-sm">
                        ¿No tienes cuenta? Regístrate
                    </a>
                </div>
            </form>
        </div>
    );
};

export default LogIn;