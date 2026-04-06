// pages/MedicalPanel.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { BiBandAid } from "react-icons/bi";

interface Madre {
    id: number;
    uid: string;
    nombre: string;
    apellido: string;
    fecha_parto: string;
    hora_parto: string;
    creado_el: string;
    activo?: boolean;
}

interface Bebe {
    id: number;
    madre_uid: string;
    nombre_madre: string;
    fecha_nacimiento: string;
    hora_nacimiento: string;
    creado_el: string;
    activo?: boolean;
}

const MedicalPanel: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'madres' | 'bebes' | 'tags'>('madres');
    const [madres, setMadres] = useState<Madre[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [expandedMadre, setExpandedMadre] = useState<string | null>(null);
    const [bebesPorMadre, setBebesPorMadre] = useState<Record<string, Bebe[]>>({});
    const [loadingBebes, setLoadingBebes] = useState<Record<string, boolean>>({});
    
    const [validationError, setValidationError] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState<Madre | null>(null);
    
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

    const toggleExpandMadre = (madreUid: string) => {
        if (expandedMadre === madreUid) {
            setExpandedMadre(null);
        } else {
            setExpandedMadre(madreUid);
            // Siempre cargar datos frescos al expandir
            loadBebesForMadre(madreUid);
        }
    };

    const verifyMadreNombre = (madreUid: string, nombreConfirmado: string) => {
        if (!madreUid || !nombreConfirmado) {
            setValidationError('');
            return false;
        }
        
        const madreSeleccionada = madres.find(m => m.uid === madreUid);
        if (madreSeleccionada) {
            const nombreCompleto = `${madreSeleccionada.nombre} ${madreSeleccionada.apellido}`;
            if (nombreConfirmado.toLowerCase() !== nombreCompleto.toLowerCase()) {
                setValidationError(`El nombre no coincide con "${nombreCompleto}"`);
                return false;
            } else {
                setValidationError('');
                return true;
            }
        }
        return false;
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
            
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (error: any) {
            setMessage({ text: error.response?.data?.message || '❌ Error al registrar', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDarDeAlta = async (madre: Madre) => {
        setSubmitting(true);
        setMessage({ text: '', type: '' });
        
        try {
            await axios.put('/api/madres/dar-de-alta', { uid: madre.uid });
            
            setMessage({ text: `✅ Madre ${madre.nombre} ${madre.apellido} dada de alta exitosamente`, type: 'success' });
            
            // Recargar la lista de madres (la madre dada de alta ya no aparecerá si el backend la filtra)
            await loadMadres();
            
            // Limpiar el caché de bebés de la madre dada de alta
            setBebesPorMadre(prev => {
                const newState = { ...prev };
                delete newState[madre.uid]; // Eliminar completamente del caché
                return newState;
            });
            
            // Si la madre estaba expandida, cerrarla
            if (expandedMadre === madre.uid) {
                setExpandedMadre(null);
            }
            
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (error: any) {
            setMessage({ text: error.response?.data?.message || '❌ Error al dar de alta', type: 'error' });
        } finally {
            setSubmitting(false);
            setShowConfirmModal(null);
        }
    };

    const handleRegisterBebe = async (e: React.FormEvent) => {
        e.preventDefault();
        
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
            
            // Recargar madres para mantener la lista actualizada
            await loadMadres();
            
            // Actualizar los bebés de la madre específica (incluso si no está expandida)
            await loadBebesForMadre(formData.madre_uid);
            
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
        
        if (name === 'madre_uid' || name === 'nombre_madre') {
            verifyMadreNombre(
                name === 'madre_uid' ? value : newFormData.madre_uid,
                name === 'nombre_madre' ? value : newFormData.nombre_madre
            );
        }
    };

    // Función para ordenar bebés cronológicamente (del más antiguo al más reciente)
    const ordenarBebesCronologico = (bebes: Bebe[]) => {
        return [...bebes].sort((a, b) => {
            const fechaA = new Date(`${a.fecha_nacimiento}T${a.hora_nacimiento}`);
            const fechaB = new Date(`${b.fecha_nacimiento}T${b.hora_nacimiento}`);
            return fechaA.getTime() - fechaB.getTime();
        });
    };

    // Filtrar solo madres ACTIVAS para la pestaña de TAGS
    const madresActivas = madres.filter(madre => madre.activo !== false);

    // Modal de confirmación
    const ConfirmModal = () => {
        if (!showConfirmModal) return null;
        
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">Confirmar Alta</h3>
                    <p className="text-gray-600 mb-4">
                        ¿Está seguro que desea dar de alta a <strong>{showConfirmModal.nombre} {showConfirmModal.apellido}</strong>?
                    </p>
                    <p className="text-red-500 text-sm mb-6">
                        ⚠️ Esta acción no se puede deshacer. La madre y sus registros quedarán en el historial médico.
                    </p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setShowConfirmModal(null)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            disabled={submitting}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => handleDarDeAlta(showConfirmModal)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:bg-red-300"
                            disabled={submitting}
                        >
                            {submitting ? 'Procesando...' : 'Sí, Dar de Alta'}
                        </button>
                    </div>
                </div>
            </div>
        );
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
            <ConfirmModal />
            
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Panel Médico</h1>
                    <p className="text-gray-600">
                        Bienvenido/a, {user?.nombre} ({user?.rol === 'medico' ? '👨‍⚕️ Médico' : '👩‍⚕️ Enfermero/Enfermera'})
                    </p>
                </div>

                {/* Tabs */}
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
                    <button
                        onClick={() => setActiveTab('tags')}
                        className={`px-6 py-3 font-semibold transition ${
                            activeTab === 'tags'
                                ? 'border-b-2 border-pink-500 text-pink-600'
                                : 'text-gray-600 hover:text-pink-500'
                        }`}
                    >
                        <BiBandAid className='inline-block mr-2'/>
                        TAGS Activos
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

                {/* TAB 1: REGISTRO DE MADRES - Solo el formulario */}
                {activeTab === 'madres' && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">
                            Registrar Madre
                        </h2>
                        
                        <form onSubmit={handleRegisterMadre} className="max-w-lg mx-auto">
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
                    </div>
                )}

                {/* TAB 2: REGISTRO DE BEBÉS - Solo el formulario */}
                {activeTab === 'bebes' && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">
                            Registrar Bebé
                        </h2>
                        
                        <form onSubmit={handleRegisterBebe} className="max-w-lg mx-auto">
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
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Fecha de Nacimiento
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
                    </div>
                )}

                {/* TAB 3: TAGS ACTIVOS - SOLO MADRES ACTIVAS */}
                {activeTab === 'tags' && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <BiBandAid className="text-3xl text-pink-500" />
                            <h2 className="text-2xl font-bold text-gray-800">
                                TAGS Activos - Madres Registradas
                            </h2>
                        </div>
                        
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-blue-800 text-sm">
                                📌 Los siguientes UID (TAGS) activos de las madres son para vinculación con su o sus bebés en el sistema.
                                Estos códigos son utilizados por las madres y sus familiares para acceder al sistema.
                            </p>
                        </div>

                        <div className="space-y-3 max-h-[600px] overflow-y-auto">
                            {madresActivas.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No hay madres activas registradas</p>
                            ) : (
                                madresActivas.map((madre) => (
                                    <div key={madre.id} className="border rounded-lg hover:shadow-md transition">
                                        <div 
                                            className="p-4 cursor-pointer hover:bg-gray-50 transition"
                                            onClick={() => toggleExpandMadre(madre.uid)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-bold text-lg">
                                                            {madre.nombre} {madre.apellido}
                                                        </h4>
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                                            🟢 Activo
                                                        </span>
                                                        <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full">
                                                            {expandedMadre === madre.uid ? '- Ocultar bebés' : '+ Mostrar bebés'}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2">
                                                        <p className="text-sm font-mono text-pink-600 font-bold">
                                                            TAG: {madre.uid}
                                                        </p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            📅 Parto: {new Date(madre.fecha_parto).toLocaleDateString()} - {madre.hora_parto}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Registrado: {new Date(madre.creado_el).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowConfirmModal(madre);
                                                        }}
                                                        className="bg-green-400 text-white text-xs px-3 py-1 rounded hover:bg-green-600 transition"
                                                    >
                                                        ⚕️ Dar de Alta
                                                    </button>
                                                    <div className="text-pink-500 text-2xl">
                                                        {expandedMadre === madre.uid ? '−' : '+'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
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
                                                            ⚠️ No se ha registrado ningún bebé relacionado con esta madre
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Vaya a la pestaña "Registro de Bebés" para registrar uno
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {(() => {
                                                            const bebesOrdenados = ordenarBebesCronologico(bebesPorMadre[madre.uid]);
                                                            return bebesOrdenados.map((bebe, index) => (
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
                                                            ));
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-yellow-800 text-xs">
                                💡 <strong>Nota:</strong> Estos TAGS son los códigos únicos que se entregan a cada madre al momento del registro.
                                Las madres usan este código para iniciar sesión, y los familiares lo necesitan para registrarse y asociarse.
                                Al dar de alta a una madre, su TAG se desactiva automáticamente y desaparece de esta lista.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MedicalPanel;