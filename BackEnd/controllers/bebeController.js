import Bebe from "../models/Bebe.js";

export const registerBebe = async (req, res) => {
    const { madre_uid, nombre_madre, fecha_nacimiento, hora_nacimiento } = req.body;
    
    if (!madre_uid || !nombre_madre || !fecha_nacimiento || !hora_nacimiento) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }
    
    try {
        const madreExists = await Bebe.checkMadreExists(madre_uid);
        
        if (!madreExists) {
            return res.status(404).json({ message: 'Madre no encontrada' });
        }
        
        const nuevoBebe = await Bebe.create(
            madre_uid, nombre_madre, fecha_nacimiento, hora_nacimiento, req.user.id
        );
        
        res.status(201).json(nuevoBebe);
    } catch (error) {
        console.error('Error al registrar bebé:', error);
        res.status(500).json({ message: 'Error al registrar bebé' });
    }
};

export const getBebesByMadre = async (req, res) => {
    try {
        const bebes = await Bebe.findByMadreUid(req.params.madre_uid);
        res.json(bebes);
    } catch (error) {
        console.error('Error al obtener bebés:', error);
        res.status(500).json({ message: 'Error al obtener bebés' });
    }
};