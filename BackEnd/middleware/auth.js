// middleware/auth.js
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

// Middleware para proteger rutas (autenticación)
// middleware/auth.js - Reemplazar la sección de familiar en el protect middleware

export const protect = async (req, res, next) => {
    try {
        let token = req.cookies.token;
        
        if (!token && req.headers.authorization) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: "No autorizado. Por favor, inicia sesión." 
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({ 
                success: false,
                message: "Sesión expirada o inválida. Por favor, inicia sesión nuevamente." 
            });
        }

        // CASO 1: Usuario es MADRE
        if (decoded.rol === 'madre') {
            const madreQuery = await pool.query(
                `SELECT id, uid, nombre, apellido, 'madre' as rol, fecha_parto, hora_parto, activo
                 FROM madres WHERE id = $1`,
                [decoded.id]
            );

            if (madreQuery.rows.length === 0) {
                return res.status(401).json({ 
                    success: false,
                    message: "Usuario no encontrado." 
                });
            }

            if (!madreQuery.rows[0].activo) {
                return res.status(401).json({ 
                    success: false,
                    message: "Su cuenta ha sido desactivada por alta médica." 
                });
            }

            req.user = madreQuery.rows[0];
            return next();
        }

        // CASO 2: Usuario es FAMILIAR
        if (decoded.rol === 'familiar') {
            const familiarQuery = await pool.query(
                `SELECT f.*, m.activo as madre_activa, m.uid as madre_uid
                 FROM familiares f
                 JOIN madres m ON f.madre_uid = m.uid
                 WHERE f.id = $1`,
                [decoded.id]
            );

            if (familiarQuery.rows.length === 0) {
                return res.status(401).json({ 
                    success: false,
                    message: "Familiar no encontrado." 
                });
            }

            const familiar = familiarQuery.rows[0];
            
            // Verificar si el familiar está activo
            if (!familiar.activo) {
                return res.status(401).json({ 
                    success: false,
                    message: familiar.motivo_desactivacion || "Su acceso ha sido desactivado." 
                });
            }
            
            // Verificar si la madre está activa
            if (!familiar.madre_activa) {
                return res.status(401).json({ 
                    success: false,
                    message: "La madre asociada a su cuenta ha sido dada de alta del sistema." 
                });
            }

            req.user = {
                id: familiar.id,
                uid: familiar.uid,
                nombre: familiar.nombre,
                apellido: familiar.apellido,
                email: familiar.email,
                rol: 'familiar',
                madre_uid: familiar.madre_uid,
                parentezco: familiar.parentezco
            };
            return next();
        }

        // CASO 3: Usuario es PERSONAL
        const userQuery = await pool.query(
            `SELECT id, nombre, email, rol FROM usuarios WHERE id = $1`,
            [decoded.id]
        );

        if (userQuery.rows.length === 0) {
            return res.status(401).json({ 
                success: false,
                message: "Usuario no encontrado." 
            });
        }

        req.user = userQuery.rows[0];
        next();

    } catch (error) {
        console.error("Error en autenticación:", error.message);
        res.status(500).json({ 
            success: false,
            message: "Error en el servidor al verificar autenticación." 
        });
    }
};

// Middleware para autorizar por roles
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                message: "Usuario no autenticado" 
            });
        }
        
        // Permitir acceso si el rol está en la lista de roles permitidos
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ 
                success: false,
                message: `No tienes permisos para acceder. Roles requeridos: ${roles.join(', ')}` 
            });
        }
        
        next();
    };
};

// Middleware específico para verificar que sea madre
export const isMadre = (req, res, next) => {
    if (!req.user || req.user.rol !== 'madre') {
        return res.status(403).json({ 
            success: false,
            message: "Acceso denegado. Esta ruta es solo para madres." 
        });
    }
    next();
};

// Middleware específico para verificar que sea personal médico (medico o enfermero)
export const isPersonalMedico = (req, res, next) => {
    if (!req.user || (req.user.rol !== 'medico' && req.user.rol !== 'enfermero')) {
        return res.status(403).json({ 
            success: false,
            message: "Acceso denegado. Se requiere rol de médico o enfermero." 
        });
    }
    next();
};

// Middleware específico para admin
export const isAdmin = (req, res, next) => {
    if (!req.user || req.user.rol !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: "Acceso denegado. Se requiere rol de administrador." 
        });
    }
    next();
};

