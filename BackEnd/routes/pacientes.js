// routes/pacientes.js
import Express from "express";
import pool from "../config/db.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Express.Router();

// Generar UID único para madre
const generarUID = () => {
    return 'MAMÁ-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
};

// Registrar madre (solo médicos y enfermeros)
router.post("/madres", protect, authorize('medico', 'enfermero'), async (req, res) => {
    const { nombre, apellido, fecha_parto, hora_parto } = req.body;
    
    if (!nombre || !apellido || !fecha_parto || !hora_parto) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }
    
    try {
        const uid = generarUID();
        
        const nuevaMadre = await pool.query(
            `INSERT INTO madres (uid, nombre, apellido, fecha_parto, hora_parto, dado_de_alta_por) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [uid, nombre, apellido, fecha_parto, hora_parto, req.user.id]
        );
        
        res.status(201).json(nuevaMadre.rows[0]);
    } catch (error) {
        console.error('Error al registrar madre:', error);
        res.status(500).json({ message: 'Error al registrar madre' });
    }
});

// Registrar bebé (solo médicos y enfermeros)
router.post("/bebes", protect, authorize('medico', 'enfermero'), async (req, res) => {
    const { madre_uid, nombre_madre, fecha_nacimiento, hora_nacimiento } = req.body;
    
    if (!madre_uid || !nombre_madre || !fecha_nacimiento || !hora_nacimiento) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }
    
    try {
        // Verificar que la madre existe
        const madre = await pool.query(
            "SELECT * FROM madres WHERE uid = $1",
            [madre_uid]
        );
        
        if (madre.rows.length === 0) {
            return res.status(404).json({ message: 'Madre no encontrada' });
        }
        
        const nuevoBebe = await pool.query(
            `INSERT INTO bebes (madre_uid, nombre_madre, fecha_nacimiento, hora_nacimiento, dado_de_alta_por) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [madre_uid, nombre_madre, fecha_nacimiento, hora_nacimiento, req.user.id]
        );
        
        res.status(201).json(nuevoBebe.rows[0]);
    } catch (error) {
        console.error('Error al registrar bebé:', error);
        res.status(500).json({ message: 'Error al registrar bebé' });
    }
});

// Obtener todas las madres
router.get("/madres", protect, authorize('medico', 'enfermero'), async (req, res) => {
    try {
        const madres = await pool.query(`
            SELECT m.*, u.nombre as dado_de_alta_por_nombre 
            FROM madres m
            JOIN usuarios u ON m.dado_de_alta_por = u.id
            ORDER BY m.creado_el DESC
        `);
        res.json(madres.rows);
    } catch (error) {
        console.error('Error al obtener madres:', error);
        res.status(500).json({ message: 'Error al obtener madres' });
    }
});

// Obtener bebés por madre
router.get("/bebes/:madre_uid", protect, authorize('medico', 'enfermero'), async (req, res) => {
    try {
        const bebes = await pool.query(
            `SELECT b.*, u.nombre as dado_de_alta_por_nombre 
             FROM bebes b
             JOIN usuarios u ON b.dado_de_alta_por = u.id
             WHERE b.madre_uid = $1
             ORDER BY b.creado_el DESC`,
            [req.params.madre_uid]
        );
        res.json(bebes.rows);
    } catch (error) {
        console.error('Error al obtener bebés:', error);
        res.status(500).json({ message: 'Error al obtener bebés' });
    }
});

export default router;