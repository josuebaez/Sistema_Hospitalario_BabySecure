import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import User from "../models/User.js";
import Madre from "../models/Madre.js";
import Familiar from "../models/Familiar.js";
import { generateToken, cookieOptions } from "../utils/tokenService.js";
import { validateEmail } from "../utils/validators.js";

// Login para personal médico y admin
export const loginPersonal = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor, completa todos los campos' });
    }

    try {
        const usuario = await User.findByEmail(email);

        if (!usuario) {
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }

        const esValido = await bcrypt.compare(password, usuario.password);

        if (!esValido) {
            return res.status(400).json({ message: 'Contraseña incorrecta' });
        }

        const token = generateToken({ id: usuario.id, rol: usuario.rol });
        res.cookie("token", token, cookieOptions);

        res.json({
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Login para madres
export const loginMadre = async (req, res) => {
    const { uid, confirmacion_uid } = req.body;

    if (!uid || !confirmacion_uid) {
        return res.status(400).json({ 
            success: false,
            message: 'UID y confirmación son requeridos' 
        });
    }

    if (!uid.startsWith('MAMÁ-')) {
        return res.status(400).json({ 
            success: false,
            message: 'Formato de UID inválido. Debe comenzar con "MAMÁ-"' 
        });
    }

    if (uid !== confirmacion_uid) {
        return res.status(400).json({ 
            success: false,
            message: 'La confirmación del UID no coincide' 
        });
    }

    try {
        const madreData = await Madre.findByUid(uid, false); // false = incluir inactivas para verificar

        if (!madreData) {
            return res.status(404).json({ 
                success: false,
                message: 'No se encontró una madre con este UID' 
            });
        }

        // Verificar si la madre está activa
        if (!madreData.activo) {
            return res.status(401).json({ 
                success: false,
                message: 'Esta cuenta ha sido desactivada por alta médica' 
            });
        }

        const token = jwt.sign(
            { 
                id: madreData.id, 
                uid: madreData.uid,
                rol: 'madre',
                nombre: madreData.nombre,
                apellido: madreData.apellido
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({
            success: true,
            usuario: {
                id: madreData.id,
                uid: madreData.uid,
                nombre: madreData.nombre,
                apellido: madreData.apellido,
                rol: 'madre',
                fecha_parto: madreData.fecha_parto,
                hora_parto: madreData.hora_parto,
                numero_bebes: madreData.numero_bebes
            }
        });
    } catch (error) {
        console.error('Error en login de madre:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Login para familiares
export const loginFamiliar = async (req, res) => {
    const { email, password } = req.body; // password es el UID de la madre

    console.log(`🔐 Intento de login familiar: ${email}`);

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email y UID de madre son requeridos"
        });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Correo electrónico no válido"
        });
    }

    try {
        // Buscar el familiar por email
        const familiarQuery = await pool.query(
            `SELECT f.*, m.activo as madre_activa, m.nombre as madre_nombre, m.apellido as madre_apellido
             FROM familiares f
             JOIN madres m ON f.madre_uid = m.uid
             WHERE f.email = $1`,
            [email]
        );
        
        const familiarData = familiarQuery.rows[0];

        if (!familiarData) {
            console.log(`❌ Familiar no encontrado: ${email}`);
            return res.status(404).json({
                success: false,
                message: "No se encontró un familiar con este correo electrónico"
            });
        }

        console.log(`📋 Familiar encontrado: ${familiarData.nombre} ${familiarData.apellido}`);
        console.log(`   - Activo: ${familiarData.activo}`);
        console.log(`   - Madre activa: ${familiarData.madre_activa}`);
        console.log(`   - Madre UID esperado: ${familiarData.madre_uid}`);
        console.log(`   - UID proporcionado: ${password}`);

        // Verificar si el familiar está activo
        if (!familiarData.activo) {
            return res.status(401).json({
                success: false,
                message: familiarData.motivo_desactivacion || "Tu cuenta ha sido desactivada. Contacta al hospital."
            });
        }

        // Verificar si la madre está activa
        if (!familiarData.madre_activa) {
            return res.status(401).json({
                success: false,
                message: "La madre asociada a tu cuenta ha sido dada de alta del sistema. Ya no tienes acceso."
            });
        }

        // Verificar que el UID de la madre coincida
        if (familiarData.madre_uid !== password) {
            console.log(`❌ UID incorrecto para ${email}`);
            return res.status(401).json({
                success: false,
                message: "UID de madre incorrecto. Verifica el código proporcionado por el hospital."
            });
        }

        // Actualizar último acceso
        await pool.query(
            "UPDATE familiares SET ultimo_acceso = NOW() WHERE id = $1",
            [familiarData.id]
        );

        // Generar token JWT
        const token = jwt.sign(
            {
                id: familiarData.id,
                uid: familiarData.uid,
                rol: 'familiar',
                nombre: familiarData.nombre,
                apellido: familiarData.apellido,
                madre_uid: familiarData.madre_uid,
                parentezco: familiarData.parentezco,
                email: familiarData.email
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Configurar cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        console.log(`✅ Login exitoso para familiar: ${email}`);

        res.json({
            success: true,
            usuario: {
                id: familiarData.id,
                uid: familiarData.uid,
                nombre: familiarData.nombre,
                apellido: familiarData.apellido,
                email: familiarData.email,
                parentezco: familiarData.parentezco,
                rol: 'familiar',
                madre_uid: familiarData.madre_uid
            }
        });

    } catch (error) {
        console.error("Error en login de familiar:", error);
        res.status(500).json({
            success: false,
            message: "Error en el servidor. Intenta más tarde."
        });
    }
};

// Obtener usuario actual (para verificar sesión)
export const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                message: "No hay sesión activa" 
            });
        }
        
        res.json({
            success: true,
            usuario: req.user
        });
    } catch (error) {
        console.error("Error en getCurrentUser:", error);
        res.status(500).json({ 
            success: false,
            message: "Error en el servidor" 
        });
    }
};

// Cerrar sesión
export const logout = (req, res) => {
    res.cookie("token", "", { ...cookieOptions, maxAge: 1 });
    res.json({ 
        success: true,
        message: 'Sesión cerrada correctamente' 
    });
};