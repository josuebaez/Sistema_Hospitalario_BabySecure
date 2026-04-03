// routes/auth.js
import Express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Express.Router();

const cookiesOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
};

const generarToken = (usuario) => {
    return jwt.sign(
        { id: usuario.id, rol: usuario.rol }, 
        process.env.JWT_SECRET, 
        { expiresIn: "30d" }
    );
};

// Login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor, completa todos los campos' });
    }

    try {
        const usuario = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);

        if (usuario.rows.length === 0) {
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }

        const usuarioData = usuario.rows[0];
        const esValido = await bcrypt.compare(password, usuarioData.password);

        if (!esValido) {
            return res.status(400).json({ message: 'Contraseña incorrecta' });
        }

        const token = generarToken({ id: usuarioData.id, rol: usuarioData.rol });
        res.cookie("token", token, cookiesOptions);

        res.json({
            usuario: {
                id: usuarioData.id,
                nombre: usuarioData.nombre,
                email: usuarioData.email,
                rol: usuarioData.rol
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Registrar nuevo usuario (solo admin)
router.post("/register", protect, authorize('admin'), async (req, res) => {
    const { nombre, email, password, rol, datosPersonales } = req.body;

    if (!nombre || !email || !password || !rol) {
        return res.status(400).json({ 
            message: 'Por favor, completa todos los campos: nombre, email, contraseña y rol' 
        });
    }

    if (!['medico', 'enfermero', 'seguridad'].includes(rol)) {
        return res.status(400).json({ 
            message: 'Rol inválido. Debe ser medico, enfermero o seguridad' 
        });
    }

    try {
        const usuarioExiste = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
        if (usuarioExiste.rows.length > 0) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }
      
        const passwordHasheada = await bcrypt.hash(password, 10);
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const nuevoUsuario = await client.query(
                "INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol",
                [nombre, email, passwordHasheada, rol]
            );
            
            if (rol === 'medico' || rol === 'enfermero') {
                await client.query(
                    `INSERT INTO personal_medico 
                     (usuario_id, cedula, nombre, edad, horario_entrada, horario_salida, tipo, permiso_neonatologia) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        nuevoUsuario.rows[0].id,
                        datosPersonales.cedula,
                        datosPersonales.nombre,
                        parseInt(datosPersonales.edad),
                        datosPersonales.horario_entrada,
                        datosPersonales.horario_salida,
                        rol,
                        datosPersonales.permiso_neonatologia || false
                    ]
                );
            } else if (rol === 'seguridad') {
                await client.query(
                    `INSERT INTO personal_seguridad 
                     (usuario_id, nombre, edad, horario_entrada, horario_salida) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [
                        nuevoUsuario.rows[0].id,
                        datosPersonales.nombre,
                        parseInt(datosPersonales.edad),
                        datosPersonales.horario_entrada,
                        datosPersonales.horario_salida
                    ]
                );
            }
            
            await client.query('COMMIT');
            
            res.status(201).json({ 
                message: `${rol === 'medico' ? 'Médico' : rol === 'enfermero' ? 'Enfermero' : 'Seguridad'} registrado exitosamente`,
                usuario: nuevoUsuario.rows[0]
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error en transacción:', error);
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        
        if (error.code === '23505') {
            return res.status(400).json({ message: 'La cédula ya está registrada' });
        }
        
        res.status(500).json({ 
            message: 'Error al registrar usuario',
            error: error.message 
        });
    }
});

// Obtener personal médico
router.get("/personal-medico", protect, authorize('admin'), async (req, res) => {
    try {
        const personal = await pool.query(`
            SELECT pm.*, u.nombre, u.email, u.rol 
            FROM personal_medico pm
            JOIN usuarios u ON pm.usuario_id = u.id
            ORDER BY pm.id DESC
        `);
        res.json(personal.rows);
    } catch (error) {
        console.error('Error al obtener personal médico:', error);
        res.status(500).json({ message: 'Error al obtener personal médico' });
    }
});

// Obtener personal de seguridad
router.get("/personal-seguridad", protect, authorize('admin'), async (req, res) => {
    try {
        const seguridad = await pool.query(`
            SELECT ps.*, u.nombre, u.email, u.rol 
            FROM personal_seguridad ps
            JOIN usuarios u ON ps.usuario_id = u.id
            ORDER BY ps.id DESC
        `);
        res.json(seguridad.rows);
    } catch (error) {
        console.error('Error al obtener personal de seguridad:', error);
        res.status(500).json({ message: 'Error al obtener personal de seguridad' });
    }
});

// Obtener usuario actual
router.get("/me", protect, async (req, res) => {
    res.json(req.user);
});

// Cerrar sesión
router.post("/logout", (req, res) => {
    res.cookie("token", "", { ...cookiesOptions, maxAge: 1 });
    res.json({ message: 'Sesión cerrada' });
});

export default router;