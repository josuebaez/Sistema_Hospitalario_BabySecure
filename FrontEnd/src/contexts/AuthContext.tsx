// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export interface Usuario {
    id: number;
    nombre: string;
    email: string;
    rol: 'admin' | 'medico' | 'enfermero' | 'seguridad';
}

interface AuthContextType {
    user: Usuario | null;
    setUser: (user: Usuario | null) => void;
    loading: boolean;
    logout: () => Promise<void>;
}

interface AuthProviderProps {
    children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<Usuario | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get("/api/auth/me");
                console.log('Usuario obtenido de sesión:', res.data);
                setUser(res.data);
            } catch (err) {
                console.log('No hay sesión activa');
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

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};