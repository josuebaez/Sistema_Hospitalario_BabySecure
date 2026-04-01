import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Definir la interfaz del usuario
export interface User {
    id: number;
    name: string;
    email: string;
}

// Definir la interfaz del contexto
interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    loading: boolean;
    logout: () => Promise<void>;
}

// Definir el tipo para las props del proveedor
interface AuthProviderProps {
    children: React.ReactNode;
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor del contexto
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get("/api/auth/me");
                setUser(res.data);
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const logout = async () => {
        try {
            await axios.post("/api/auth/logout");
            setUser(null);
        } catch (err) {
            console.error("Error al cerrar sesión:", err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};