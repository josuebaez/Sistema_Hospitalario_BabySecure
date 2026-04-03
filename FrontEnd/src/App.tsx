// App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LogIn from './pages/LogIn';
import Home from './pages/Home';
import AdminPanel from './pages/AdminPanel';
import MedicalPanel from './pages/MedicalPanel';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import axios from 'axios';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:5000';

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

    const getDefaultRoute = () => {
        if (!user) return '/login';
        switch (user.rol) {
            case 'admin':
                return '/admin';
            case 'medico':
            case 'enfermero':
                return '/medical';
            default:
                return '/';
        }
    };

    return (
        <Routes>
            <Route path="/login" element={!user ? <LogIn /> : <Navigate to={getDefaultRoute()} />} />
            
            <Route 
                path="/admin" 
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminPanel />
                    </ProtectedRoute>
                } 
            />
            
            <Route 
                path="/medical" 
                element={
                    <ProtectedRoute allowedRoles={['medico', 'enfermero']}>
                        <MedicalPanel />
                    </ProtectedRoute>
                } 
            />
            
            <Route 
                path="/" 
                element={
                    user ? (
                        user.rol === 'admin' ? <Navigate to="/admin" /> :
                        user.rol === 'medico' || user.rol === 'enfermero' ? <Navigate to="/medical" /> :
                        <Home />
                    ) : <Navigate to="/login" />
                } 
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