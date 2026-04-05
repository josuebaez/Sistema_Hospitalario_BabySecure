import bcrypt from "bcryptjs";
import User from "../models/User.js";
import PersonalMedico from "../models/PersonalMedico.js";
import pool from "../config/db.js";

export const registerUser = async (req, res) => {
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
        const usuarioExiste = await User.findByEmail(email);
        if (usuarioExiste) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }
      
        const passwordHasheada = await bcrypt.hash(password, 10);
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const nuevoUsuario = await User.create(nombre, email, passwordHasheada, rol);
            
            if (rol === 'medico' || rol === 'enfermero') {
                await PersonalMedico.create(
                    nuevoUsuario.id,
                    datosPersonales.cedula,
                    datosPersonales.nombre,
                    parseInt(datosPersonales.edad),
                    datosPersonales.horario_entrada,
                    datosPersonales.horario_salida,
                    rol,
                    datosPersonales.permiso_neonatologia || false
                );
            } else if (rol === 'seguridad') {
                await client.query(
                    `INSERT INTO personal_seguridad 
                     (usuario_id, nombre, edad, horario_entrada, horario_salida) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [
                        nuevoUsuario.id,
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
                usuario: nuevoUsuario
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
};

export const getPersonalMedico = async (req, res) => {
    try {
        const personal = await PersonalMedico.findAll();
        res.json(personal);
    } catch (error) {
        console.error('Error al obtener personal médico:', error);
        res.status(500).json({ message: 'Error al obtener personal médico' });
    }
};

export const getPersonalSeguridad = async (req, res) => {
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
};