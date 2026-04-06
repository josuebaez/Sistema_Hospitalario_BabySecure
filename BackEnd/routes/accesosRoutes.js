// routes/accesosRoutes.js
import express from "express";
import { protect } from "../middleware/auth.js";
import pool from "../config/db.js";

const router = express.Router();

// Solicitar acceso físico a neonatología
router.post("/neonatologia", protect, async (req, res) => {
    const { 
        madre_uid, 
        metodo_acceso,
        dispositivo_modelo,
        dispositivo_os,
        app_version
    } = req.body;
    
    if (!madre_uid) {
        return res.status(400).json({ 
            success: false, 
            mensaje: "El UID de la madre es requerido" 
        });
    }
    
    // Determinar parentezco si es familiar
    let parentezco = null;
    if (req.user.rol === 'familiar') {
        const familiarResult = await pool.query(
            "SELECT parentezco FROM familiares WHERE id = $1",
            [req.user.id]
        );
        if (familiarResult.rows.length > 0) {
            parentezco = familiarResult.rows[0].parentezco;
        }
    }
    
    try {
        const result = await pool.query(
            `SELECT * FROM registrar_acceso_neonatologia(
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            )`,
            [
                req.user.rol,
                req.user.id,
                req.user.nombre,
                req.user.email || null,
                madre_uid,
                parentezco,
                metodo_acceso || 'qr',
                dispositivo_modelo || null,
                dispositivo_os || null,
                app_version || null,
                req.ip || null
            ]
        );
        
        const { acceso_permitido, mensaje, log_id } = result.rows[0];
        
        res.json({
            success: true,
            acceso_permitido,
            mensaje,
            log_id
        });
        
    } catch (error) {
        console.error("Error en solicitud de acceso:", error);
        res.status(500).json({ 
            success: false, 
            mensaje: "Error en el servidor" 
        });
    }
});

// Obtener historial de accesos del usuario actual
router.get("/historial", protect, async (req, res) => {
    try {
        let query;
        let params;
        
        if (req.user.rol === 'madre') {
            // Para madres, mostrar accesos a su bebé
            query = `
                SELECT ln.id, ln.creado_el as fecha_acceso, ln.accion, 
                       ln.metodo_acceso, ln.verificado, ln.motivo_denegacion,
                       ln.madre_uid, ln.madre_nombre, ln.usuario_nombre as visitante
                FROM logs_accesos_neonatologia ln
                WHERE ln.madre_uid = (SELECT uid FROM madres WHERE id = $1)
                ORDER BY ln.creado_el DESC
                LIMIT 50
            `;
            params = [req.user.id];
        } else {
            // Para familiares y personal, mostrar sus propios accesos
            query = `
                SELECT ln.id, ln.creado_el as fecha_acceso, ln.accion, 
                       ln.metodo_acceso, ln.verificado, ln.motivo_denegacion,
                       ln.madre_uid, ln.madre_nombre
                FROM logs_accesos_neonatologia ln
                WHERE ln.usuario_id = $1
                ORDER BY ln.creado_el DESC
                LIMIT 50
            `;
            params = [req.user.id];
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
        
    } catch (error) {
        console.error("Error al obtener historial:", error);
        res.status(500).json({ 
            success: false, 
            mensaje: "Error en el servidor" 
        });
    }
});

// Verificar si una madre está activa
router.get("/verificar-madre/:uid", protect, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM verificar_madre_activa($1)`,
            [req.params.uid]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                existe: false,
                mensaje: "Madre no encontrada"
            });
        }
        
        res.json({
            success: true,
            ...result.rows[0]
        });
        
    } catch (error) {
        console.error("Error al verificar madre:", error);
        res.status(500).json({ 
            success: false, 
            mensaje: "Error en el servidor" 
        });
    }
});

// Registrar acceso a la app (login/logout)
router.post("/registrar-app", protect, async (req, res) => {
    const { accion, dispositivo_modelo, dispositivo_os, app_version, exito, mensaje } = req.body;
    
    try {
        let madre_uid = null;
        let familiar_nombre = null;
        
        if (req.user.rol === 'familiar') {
            const familiarResult = await pool.query(
                "SELECT madre_uid, nombre, apellido FROM familiares WHERE id = $1",
                [req.user.id]
            );
            if (familiarResult.rows.length > 0) {
                madre_uid = familiarResult.rows[0].madre_uid;
                familiar_nombre = `${familiarResult.rows[0].nombre} ${familiarResult.rows[0].apellido}`;
            }
        } else if (req.user.rol === 'madre') {
            madre_uid = req.user.uid;
        }
        
        const result = await pool.query(
            `SELECT registrar_acceso_mobile(
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
            ) as log_id`,
            [
                req.user.rol,
                req.user.id,
                req.user.nombre,
                null, // usuario_cedula
                req.user.email || null,
                madre_uid,
                familiar_nombre,
                accion || 'login',
                dispositivo_modelo || null,
                dispositivo_os || null,
                app_version || null,
                req.ip || null,
                exito !== undefined ? exito : true,
                mensaje || null
            ]
        );
        
        res.json({
            success: true,
            log_id: result.rows[0].log_id,
            mensaje: "Acceso registrado"
        });
        
    } catch (error) {
        console.error("Error al registrar acceso:", error);
        res.status(500).json({ 
            success: false, 
            mensaje: "Error en el servidor" 
        });
    }
});

export default router;