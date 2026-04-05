// pages/AdminPanel.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface PersonalMedico {
    id: number;
    usuario_id: number;
    cedula: string;
    nombre: string;
    edad: number;
    horario_entrada: string;
    horario_salida: string;
    tipo: string;
    permiso_neonatologia: boolean;
    nombre_usuario: string;
    email: string;
}

interface PersonalSeguridad {
    id: number;
    usuario_id: number;
    nombre: string;
    edad: number;
    horario_entrada: string;
    horario_salida: string;
    nombre_usuario: string;
    email: string;
}

const AdminPanel: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'medicos' | 'enfermeros' | 'seguridad'>('medicos');
    const [personalMedico, setPersonalMedico] = useState<PersonalMedico[]>([]);
    const [personalSeguridad, setPersonalSeguridad] = useState<PersonalSeguridad[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        cedula: '',
        edad: '',
        horario_entrada: '08:00',
        horario_salida: '17:00',
        permiso_neonatologia: false
    });
    const [message, setMessage] = useState({ text: '', type: '' });

    const loadPersonalMedico = async () => {
        try {
            const res = await axios.get('/api/admin/personal-medico');
            setPersonalMedico(res.data);
        } catch (error) {
            console.error('Error al cargar personal médico:', error);
        }
    };

    const loadPersonalSeguridad = async () => {
        try {
            const res = await axios.get('/api/admin/personal-seguridad');
            setPersonalSeguridad(res.data);
        } catch (error) {
            console.error('Error al cargar personal de seguridad:', error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            if (activeTab === 'medicos' || activeTab === 'enfermeros') {
                await loadPersonalMedico();
            } else {
                await loadPersonalSeguridad();
            }
            setLoading(false);
        };
        loadData();
    }, [activeTab]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ text: '', type: '' });

        const rol = activeTab === 'seguridad' ? 'seguridad' : 
                     activeTab === 'medicos' ? 'medico' : 'enfermero';

        let datosPersonales;
        
        if (rol === 'seguridad') {
            datosPersonales = {
                nombre: formData.nombre,
                edad: parseInt(formData.edad),
                horario_entrada: formData.horario_entrada,
                horario_salida: formData.horario_salida
            };
        } else {
            datosPersonales = {
                cedula: formData.cedula,
                nombre: formData.nombre,
                edad: parseInt(formData.edad),
                horario_entrada: formData.horario_entrada,
                horario_salida: formData.horario_salida,
                permiso_neonatologia: formData.permiso_neonatologia
            };
        }

        const requestData = {
            nombre: formData.nombre,
            email: formData.email,
            password: formData.password,
            rol: rol,
            datosPersonales: datosPersonales
        };

        try {
            const response = await axios.post('/api/admin/register', requestData);
            
            setMessage({ 
                text: response.data.message || `${rol === 'medico' ? 'Médico' : rol === 'enfermero' ? 'Enfermero' : 'Seguridad'} registrado exitosamente`, 
                type: 'success' 
            });
            
            setFormData({
                nombre: '',
                email: '',
                password: '',
                cedula: '',
                edad: '',
                horario_entrada: '08:00',
                horario_salida: '17:00',
                permiso_neonatologia: false
            });
            
            if (activeTab === 'seguridad') {
                await loadPersonalSeguridad();
            } else {
                await loadPersonalMedico();
            }
            
        } catch (error: any) {
            console.error('Error en registro:', error.response?.data || error.message);
            setMessage({ 
                text: error.response?.data?.message || 'Error al registrar', 
                type: 'error' 
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
                    <p className="text-gray-600">Bienvenido, {user?.nombre}</p>
                </div>

                <div className="flex space-x-2 mb-6 border-b">
                    <button
                        onClick={() => setActiveTab('medicos')}
                        className={`px-6 py-3 font-semibold transition ${
                            activeTab === 'medicos'
                                ? 'border-b-2 border-blue-500 text-pink-500'
                                : 'text-gray-600 hover:text-blue-500'
                        }`}
                    >
                        👨‍⚕️ Médicos
                    </button>
                    <button
                        onClick={() => setActiveTab('enfermeros')}
                        className={`px-6 py-3 font-semibold transition ${
                            activeTab === 'enfermeros'
                                ? 'border-b-2 border-blue-500 text-pink-500'
                                : 'text-gray-600 hover:text-blue-500'
                        }`}
                    >
                        👩‍⚕️ Enfermeros
                    </button>
                    <button
                        onClick={() => setActiveTab('seguridad')}
                        className={`px-6 py-3 font-semibold transition ${
                            activeTab === 'seguridad'
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-600 hover:text-blue-500'
                        }`}
                    >
                        🔒 Personal de Seguridad
                    </button>
                </div>

                {message.text && (
                    <div className={`mb-4 p-4 rounded ${
                        message.type === 'success' 
                            ? 'bg-green-100 border border-green-400 text-green-700'
                            : 'bg-red-100 border border-red-400 text-red-700'
                    }`}>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">
                            Registrar {activeTab === 'medicos' ? 'Médico' : activeTab === 'enfermeros' ? 'Enfermero' : 'Seguridad'}
                        </h2>
                        
                        <form onSubmit={handleRegister}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Nombre completo *
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    disabled={submitting}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    disabled={submitting}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Contraseña *
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    disabled={submitting}
                                    minLength={6}
                                />
                            </div>

                            {activeTab !== 'seguridad' && (
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Cédula profesional *
                                    </label>
                                    <input
                                        type="text"
                                        name="cedula"
                                        value={formData.cedula}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Edad *
                                </label>
                                <input
                                    type="number"
                                    name="edad"
                                    value={formData.edad}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    disabled={submitting}
                                    min={18}
                                    max={100}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Horario entrada *
                                    </label>
                                    <input
                                        type="time"
                                        name="horario_entrada"
                                        value={formData.horario_entrada}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Horario salida *
                                    </label>
                                    <input
                                        type="time"
                                        name="horario_salida"
                                        value={formData.horario_salida}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                            </div>

                            {activeTab !== 'seguridad' && (
                                <div className="mb-6">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="permiso_neonatologia"
                                            checked={formData.permiso_neonatologia}
                                            onChange={handleInputChange}
                                            className="mr-2"
                                            disabled={submitting}
                                        />
                                        <span className="text-gray-700 text-sm">
                                            Permiso para entrar al área de neonatología
                                        </span>
                                    </label>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 disabled:bg-blue-400"
                                disabled={submitting}
                            >
                                {submitting ? 'Registrando...' : 'Registrar'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">
                            Lista de {activeTab === 'medicos' ? 'Médicos' : activeTab === 'enfermeros' ? 'Enfermeros' : 'Seguridad'}
                        </h2>
                        
                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            {activeTab !== 'seguridad' ? (
                                personalMedico.filter(personal => 
                                    activeTab === 'medicos' ? personal.tipo === 'medico' : personal.tipo === 'enfermero'
                                ).length === 0 ? (
                                    <p className="text-gray-500 text-center">No hay registros</p>
                                ) : (
                                    personalMedico.filter(personal => 
                                        activeTab === 'medicos' ? personal.tipo === 'medico' : personal.tipo === 'enfermero'
                                    ).map((personal) => (
                                        <div key={personal.id} className="border rounded-lg p-4 hover:shadow-md transition">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-lg">{personal.nombre}</h3>
                                                    <p className="text-gray-600 text-sm">{personal.email}</p>
                                                    <p className="text-gray-600 text-sm">Cédula: {personal.cedula}</p>
                                                    <p className="text-gray-600 text-sm">Edad: {personal.edad} años</p>
                                                    <p className="text-gray-600 text-sm">
                                                        Horario: {personal.horario_entrada} - {personal.horario_salida}
                                                    </p>
                                                    {personal.permiso_neonatologia && (
                                                        <span className="inline-block mt-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                            ✅ Acceso al área de neonatología
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                                                        personal.tipo === 'medico' 
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-green-100 text-green-800'
                                                    }`}>
                                                        {personal.tipo === 'medico' ? '👨‍⚕️ Médico' : '👩‍⚕️ Enfermero'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )
                            ) : (
                                personalSeguridad.length === 0 ? (
                                    <p className="text-gray-500 text-center">No hay registros</p>
                                ) : (
                                    personalSeguridad.map((personal) => (
                                        <div key={personal.id} className="border rounded-lg p-4 hover:shadow-md transition">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-lg">{personal.nombre}</h3>
                                                    <p className="text-gray-600 text-sm">{personal.email}</p>
                                                    <p className="text-gray-600 text-sm">Edad: {personal.edad} años</p>
                                                    <p className="text-gray-600 text-sm">
                                                        Horario: {personal.horario_entrada} - {personal.horario_salida}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="inline-block px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                                                        🔒 Personal de Seguridad
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;