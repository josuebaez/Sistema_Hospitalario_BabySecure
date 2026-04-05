import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Madre from "../models/Madre.js";
import Familiar from "../models/Familiar.js";
import { generateToken, cookieOptions } from "../utils/tokenService.js";
import { validateEmail } from "../utils/validators.js";

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
        const madreData = await Madre.findByUid(uid);

        if (!madreData) {
            return res.status(404).json({ 
                success: false,
                message: 'No se encontró una madre con este UID' 
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

export const loginFamiliar = async (req, res) => {
    const { email, password } = req.body;

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
        const familiarData = await Familiar.findByEmail(email);

        if (!familiarData) {
            return res.status(404).json({
                success: false,
                message: "No se encontró un familiar con este correo electrónico"
            });
        }

        if (familiarData.madre_uid !== password) {
            return res.status(401).json({
                success: false,
                message: "UID de madre incorrecto"
            });
        }

        await Familiar.updateLastAccess(familiarData.id);

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

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

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
                madre_uid: familiarData.madre_uid,
                ultimo_acceso: familiarData.ultimo_acceso
            }
        });

    } catch (error) {
        console.error("Error en login de familiar:", error);
        res.status(500).json({
            success: false,
            message: "Error en el servidor"
        });
    }
};

export const getCurrentUser = async (req, res) => {
    res.json(req.user);
};

export const logout = (req, res) => {
    res.cookie("token", "", { ...cookieOptions, maxAge: 1 });
    res.json({ message: 'Sesión cerrada' });
};