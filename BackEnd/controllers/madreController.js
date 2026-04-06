import Madre from "../models/Madre.js";
import { generarUIDMadre } from "../utils/generateUID.js";

export const registerMadre = async (req, res) => {
    const { nombre, apellido, fecha_parto, hora_parto } = req.body;
    
    if (!nombre || !apellido || !fecha_parto || !hora_parto) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }
    
    try {
        const uid = generarUIDMadre();
        
        const nuevaMadre = await Madre.create(
            uid, nombre, apellido, fecha_parto, hora_parto, req.user.id
        );
        
        res.status(201).json(nuevaMadre);
    } catch (error) {
        console.error('Error al registrar madre:', error);
        res.status(500).json({ message: 'Error al registrar madre' });
    }
};

export const getAllMadres = async (req, res) => {
    try {
        const madres = await Madre.findAll();
        res.json(madres);
    } catch (error) {
        console.error('Error al obtener madres:', error);
        res.status(500).json({ message: 'Error al obtener madres' });
    }
};

export const getMadrePerfil = async (req, res) => {
    try {
        if (!req.user.rol || req.user.rol !== 'madre') {
            return res.status(403).json({ message: 'Acceso no autorizado' });
        }

        const madreData = await Madre.findById(req.user.id);

        if (!madreData) {
            return res.status(404).json({ message: 'Madre no encontrada' });
        }

        res.json(madreData);
    } catch (error) {
        console.error('Error al obtener perfil de madre:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Agregar esta función al archivo madreController.js

export const darDeAltaMadre = async (req, res) => {
    const { uid } = req.body;
    
    if (!uid) {
        return res.status(400).json({ 
            success: false,
            message: 'El UID de la madre es requerido' 
        });
    }
    
    try {
        // Verificar que la madre existe y está activa
        const madre = await Madre.findByUid(uid, true);
        
        if (!madre) {
            return res.status(404).json({ 
                success: false,
                message: 'Madre no encontrada' 
            });
        }
        
        if (!madre.activo) {
            return res.status(400).json({ 
                success: false,
                message: 'Esta madre ya fue dada de alta anteriormente' 
            });
        }
        
        // Dar de alta a la madre (los triggers automáticos desactivarán familiares y bebés)
        const madreDadaDeAlta = await Madre.darDeAlta(uid, req.user.id);
        
        res.json({
            success: true,
            message: 'Madre dada de alta exitosamente. Los familiares y bebés han sido desactivados automáticamente.',
            madre: madreDadaDeAlta
        });
        
    } catch (error) {
        console.error('Error al dar de alta madre:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al dar de alta la madre'
        });
    }
};