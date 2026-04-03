// middleware/auth.js
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const protect = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: "No autorizado, token no encontrado" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await pool.query(
            "SELECT id, nombre, email, rol FROM usuarios WHERE id = $1", 
            [decoded.id]
        );

        if (user.rows.length === 0) {
            return res.status(401).json({ message: "No autorizado, usuario no encontrado" });
        }

        req.user = user.rows[0];
        next();

    } catch (error) {
        console.error("Error en autenticación:", error.message);
        res.status(401).json({ message: "No autorizado" });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Usuario no autenticado" });
        }
        
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ 
                message: `No tienes permisos para acceder. Rol requerido: ${roles.join(', ')}` 
            });
        }
        next();
    };
};