// pages/MedicalPanel.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface Madre {
    id: number;
    uid: string;
    nombre: string;
    apellido: string;
    fecha_parto: string;
    hora_parto: string;
    creado_el: string;
}

interface Bebe {
    id: number;
    madre_uid: string;
    nombre_madre: string;
    fecha_nacimiento: string;
    hora_nacimiento: string;
    creado_el: string;
}

const MedicalPanel: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'madres' | 'bebes'>('madres');
    const [madres, setMadres] = useState<Madre[]>([]);
    const [bebes, setBebes] = useState<Bebe[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Estados para el despliegue de bebés por madre
    const [expandedMadre, setExpandedMadre] = useState<string | null>(null);
    const [bebesPorMadre, setBebesPorMadre] = useState<Record<string, Bebe[]>>({});
    const [loadingBebes, setLoadingBebes] = useState<Record<string, boolean>>({});
    
    // Estado para validación del nombre de la madre
    const [validationError, setValidationError] = useState('');
    
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        fecha_parto: '',
        hora_parto: '',
        madre_uid: '',
        nombre_madre: '',
        fecha_nacimiento: '',
        hora_nacimiento: ''
    });
    const [message, setMessage] = useState({ text: '', type: '' });

    const loadMadres = async () => {
        try {
            const res = await axios.get('/api/madres');
            setMadres(res.data);
        } catch (error) {
            console.error('Error al cargar madres:', error);
        }
    };

    // Función para cargar bebés de una madre específica
    const loadBebesForMadre = async (madreUid: string) => {
        setLoadingBebes(prev => ({ ...prev, [madreUid]: true }));
        try {
            const res = await axios.get(`/api/bebes/${madreUid}`);
            setBebesPorMadre(prev => ({
                ...prev,
                [madreUid]: res.data
            }));
        } catch (error) {
            console.error('Error al cargar bebés:', error);
            setBebesPorMadre(prev => ({
                ...prev,
                [madreUid]: []
            }));
        } finally {
            setLoadingBebes(prev => ({ ...prev, [madreUid]: false }));
        }
    };

    // Función para expandir/colapsar una madre
    const toggleExpandMadre = (madreUid: string) => {
        if (expandedMadre === madreUid) {
            setExpandedMadre(null);
        } else {
            setExpandedMadre(madreUid);
            // Cargar bebés si aún no se han cargado
            if (!bebesPorMadre[madreUid]) {
                loadBebesForMadre(madreUid);
            }
        }
    };

    // Función para verificar si el nombre de la madre coincide
    const verifyMadreNombre = (madreUid: string, nombreConfirmado: string) => {
        if (!madreUid || !nombreConfirmado) {
            setValidationError('');
            return false;
        }
        
        const madreSeleccionada = madres.find(m => m.uid === madreUid);
        if (madreSeleccionada) {
            const nombreCompleto = `${madreSeleccionada.nombre} ${madreSeleccionada.apellido}`;
            if (nombreConfirmado.toLowerCase() !== nombreCompleto.toLowerCase()) {
                setValidationError(`El nombre no coincide`);
                return false;
            } else {
                setValidationError('');
                return true;
            }
        }
        return false;
    };

    const loadBebes = async (madreUid?: string) => {
        try {
            if (madreUid) {
                const res = await axios.get(`/api/bebes/${madreUid}`);
                setBebes(res.data);
            }
        } catch (error) {
            console.error('Error al cargar bebés:', error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await loadMadres();
            setLoading(false);
        };
        loadData();
    }, []);

    const handleRegisterMadre = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ text: '', type: '' });

        try {
            await axios.post('/api/madres', {
                nombre: formData.nombre,
                apellido: formData.apellido,
                fecha_parto: formData.fecha_parto,
                hora_parto: formData.hora_parto
            });

            setMessage({ text: '✅ Madre registrada exitosamente', type: 'success' });
            setFormData({ ...formData, nombre: '', apellido: '', fecha_parto: '', hora_parto: '' });
            await loadMadres();
            
            // Limpiar mensaje después de 3 segundos
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (error: any) {
            setMessage({ text: error.response?.data?.message || '❌ Error al registrar', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleRegisterBebe = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validar que el nombre coincida antes de enviar
        const isValid = verifyMadreNombre(formData.madre_uid, formData.nombre_madre);
        if (!isValid) {
            setMessage({ 
                text: '❌ El nombre de la madre no coincide con el UID seleccionado. Por favor, verifique.', 
                type: 'error' 
            });
            return;
        }
        
        setSubmitting(true);
        setMessage({ text: '', type: '' });

        try {
            await axios.post('/api/bebes', {
                madre_uid: formData.madre_uid,
                nombre_madre: formData.nombre_madre,
                fecha_nacimiento: formData.fecha_nacimiento,
                hora_nacimiento: formData.hora_nacimiento
            });

            setMessage({ text: '✅ Bebé registrado exitosamente', type: 'success' });
            setFormData({ ...formData, madre_uid: '', nombre_madre: '', fecha_nacimiento: '', hora_nacimiento: '' });
            setValidationError('');
            
            // Mostrar bebés de la madre si se expanden los detalles
            if (expandedMadre) {
                await loadBebesForMadre(expandedMadre);
            }
            
            // Limpiar mensaje después de 3 segundos
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (error: any) {
            setMessage({ text: error.response?.data?.message || '❌ Error al registrar', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };
        setFormData(newFormData);
        
        // Validar coincidencia del nombre cuando cambia madre_uid o nombre_madre
        if (name === 'madre_uid' || name === 'nombre_madre') {
            verifyMadreNombre(
                name === 'madre_uid' ? value : newFormData.madre_uid,
                name === 'nombre_madre' ? value : newFormData.nombre_madre
            );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-blue-50 py-8">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Panel Médico</h1>
                    <p className="text-gray-600">
                        Bienvenido/a, {user?.nombre} ({user?.rol === 'medico' ? '👨‍⚕️ Médico' : '👩‍⚕️ Enfermero/Enfermera'})
                    </p>
                </div>

                <div className="flex space-x-2 mb-6 border-b">
                    <button
                        onClick={() => setActiveTab('madres')}
                        className={`px-6 py-3 font-semibold transition ${
                            activeTab === 'madres'
                                ? 'border-b-2 border-pink-500 text-pink-600'
                                : 'text-gray-600 hover:text-pink-500'
                        }`}
                    >
                        👩 Registro de Madres
                    </button>
                    <button
                        onClick={() => setActiveTab('bebes')}
                        className={`px-6 py-3 font-semibold transition ${
                            activeTab === 'bebes'
                                ? 'border-b-2 border-pink-500 text-pink-600'
                                : 'text-gray-600 hover:text-pink-500'
                        }`}
                    >
                        👶 Registro de Bebés
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

                {activeTab === 'madres' && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">
                            Registrar Nueva Madre
                        </h2>
                        
                        <form onSubmit={handleRegisterMadre} className="max-w-lg">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Nombre
                                    </label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        required
                                        disabled={submitting}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Apellido
                                    </label>
                                    <input
                                        type="text"
                                        name="apellido"
                                        value={formData.apellido}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Fecha de Parto
                                    </label>
                                    <input
                                        type="date"
                                        name="fecha_parto"
                                        value={formData.fecha_parto}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        required
                                        disabled={submitting}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Hora de Parto
                                    </label>
                                    <input
                                        type="time"
                                        name="hora_parto"
                                        value={formData.hora_parto}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-pink-500 text-white text-sm font-bold py-2 px-4 rounded-xl hover:bg-pink-600 transition duration-200 disabled:bg-pink-300"
                                disabled={submitting}
                            >
                                {submitting ? 'Registrando...' : 'Registrar Madre'}
                            </button>
                        </form>

                        <div className="mt-8">
                            <h3 className="text-xl font-bold mb-4">Madres Registradas</h3>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {madres.length === 0 ? (
                                    <p className="text-gray-500 text-center">No hay madres registradas</p>
                                ) : (
                                    madres.map((madre) => (
                                        <div key={madre.id} className="border rounded-lg hover:shadow-md transition">
                                            {/* Cabecera de la madre - clickeable */}
                                            <div 
                                                className="p-4 cursor-pointer hover:bg-gray-50 transition"
                                                onClick={() => toggleExpandMadre(madre.uid)}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-lg">
                                                                {madre.nombre} {madre.apellido}
                                                            </h4>
                                                            <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full">
                                                                {expandedMadre === madre.uid ? '- Ocultar bebés' : '+ Mostrar bebés'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">UID: {madre.uid}</p>
                                                        <p className="text-sm text-gray-600">
                                                            📅 Parto: {new Date(madre.fecha_parto).toLocaleDateString()} - {madre.hora_parto}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Registrado: {new Date(madre.creado_el).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div className="text-pink-500 text-2xl">
                                                        {expandedMadre === madre.uid ? '-' : '+'}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Bebés desplegados */}
                                            {expandedMadre === madre.uid && (
                                                <div className="border-t bg-gray-50 p-4 rounded-b-lg">
                                                    <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                        <span>👶</span> Bebés de la madre:
                                                    </h5>
                                                    
                                                    {loadingBebes[madre.uid] ? (
                                                        <div className="text-center py-4">
                                                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
                                                            <p className="text-gray-500 text-sm mt-2">Cargando bebés...</p>
                                                        </div>
                                                    ) : !bebesPorMadre[madre.uid] ? (
                                                        <p className="text-gray-500 text-sm text-center py-4">
                                                            No hay bebés registrados
                                                        </p>
                                                    ) : bebesPorMadre[madre.uid].length === 0 ? (
                                                        <div className="text-center py-4">
                                                            <p className="text-gray-500 text-sm">
                                                                😢 No hay bebés registrados para esta madre
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                Ve a la pestaña "Registro de Bebés" para registrar uno
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {bebesPorMadre[madre.uid].map((bebe, index) => (
                                                                <div key={bebe.id} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition">
                                                                    <div className="flex items-start justify-between">
                                                                        <div>
                                                                            <p className="font-medium text-gray-800">
                                                                                🍼 Bebé #{index + 1}
                                                                            </p>
                                                                            <p className="text-sm text-gray-600 mt-1">
                                                                                📅 Nacimiento: {new Date(bebe.fecha_nacimiento).toLocaleDateString()} - {bebe.hora_nacimiento}
                                                                            </p>
                                                                            <p className="text-xs text-gray-400 mt-1">
                                                                                Registrado: {new Date(bebe.creado_el).toLocaleString()}
                                                                            </p>
                                                                        </div>
                                                                        <div className="text-2xl">
                                                                            👶
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'bebes' && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">
                            Registrar Nuevo Bebé
                        </h2>
                        
                        <form onSubmit={handleRegisterBebe} className="max-w-lg">
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Seleccionar Madre
                                    <span className="text-red-500 text-xs ml-1">*</span>
                                </label>
                                <select
                                    name="madre_uid"
                                    value={formData.madre_uid}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    required
                                    disabled={submitting}
                                >
                                    <option value="">Seleccionar madre</option>
                                    {madres.map((madre) => (
                                        <option key={madre.id} value={madre.uid}>
                                            {madre.nombre} {madre.apellido} - {madre.uid}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Nombre de la Madre (confirmación)
                                    <span className="text-red-500 text-xs ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nombre_madre"
                                    value={formData.nombre_madre}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                                        validationError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                    }`}
                                    required
                                    disabled={submitting}
                                    placeholder="Ej: María González"
                                />
                                {validationError && (
                                    <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                        <span>⚠️</span> {validationError}
                                    </div>
                                )}
                                {formData.madre_uid && !validationError && formData.nombre_madre && (
                                    <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                                        <span>✅</span> Nombre verificado correctamente
                                    </div>
                                )}
                                {formData.madre_uid && !formData.nombre_madre && (
                                    <div className="mt-2 text-sm text-gray-500">
                                        ℹ️ Por favor, escriba el nombre completo de la madre para confirmar su identidad
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Fecha de Nacimiento
                                        <span className="text-red-500 text-xs ml-1">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="fecha_nacimiento"
                                        value={formData.fecha_nacimiento}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        required
                                        disabled={submitting}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Hora de Nacimiento
                                        <span className="text-red-500 text-xs ml-1">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        name="hora_nacimiento"
                                        value={formData.hora_nacimiento}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-pink-500 text-white text-sm font-bold py-2 px-4 rounded-xl hover:bg-pink-600 transition duration-200 disabled:bg-pink-300"
                                disabled={submitting || !!validationError}
                            >
                                {submitting ? 'Registrando...' : 'Registrar Bebé'}
                            </button>
                        </form>

                        {/* Lista de madres con bebés */}
                        {madres.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-xl font-bold mb-4">📋 Madres Registradas</h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {madres.map((madre) => (
                                        <div key={madre.id} className="border rounded-lg p-4 hover:shadow-md transition">
                                            <div 
                                                className="cursor-pointer hover:text-pink-600"
                                                onClick={() => {
                                                    setActiveTab('madres');
                                                    setExpandedMadre(madre.uid);
                                                    if (!bebesPorMadre[madre.uid]) {
                                                        loadBebesForMadre(madre.uid);
                                                    }
                                                }}
                                            >
                                                <p className="font-bold text-lg">{madre.nombre} {madre.apellido}</p>
                                                <p className="text-sm text-gray-600">UID: {madre.uid}</p>
                                                <p className="text-sm text-gray-600">
                                                    📅 Parto: {new Date(madre.fecha_parto).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-pink-500 mt-2 flex items-center gap-1">
                                                    <span>+</span> Ver bebés de la madre
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MedicalPanel;