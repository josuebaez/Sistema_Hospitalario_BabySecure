import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LogIn from './pages/LogIn';
import Registro from './pages/Registro';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import axios from 'axios';

// Configurar axios
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:5000';

// Componente que maneja las rutas protegidas
const AppRoutes = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <div className="text-2xl text-gray-600 mb-2">Cargando...</div>
                    <div className="text-sm text-gray-500">Por favor espera</div>
                </div>
            </div>
        );
    }

    return (
        <Routes>
            <Route 
                path="/" 
                element={user ? <Home /> : <Navigate to="/login" />} 
            />
            <Route 
                path="/login" 
                element={!user ? <LogIn /> : <Navigate to="/" />} 
            />
            <Route 
                path="/registro" 
                element={!user ? <Registro /> : <Navigate to="/" />} 
            />
        </Routes>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Navbar />
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}

export default App;