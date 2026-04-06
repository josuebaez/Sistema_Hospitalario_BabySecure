import pool from '../config/db.js';

class Madre {
    static async create(uid, nombre, apellido, fecha_parto, hora_parto, dado_de_alta_por) {
        const result = await pool.query(
            `INSERT INTO madres (uid, nombre, apellido, fecha_parto, hora_parto, dado_de_alta_por, activo) 
             VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING *`,
            [uid, nombre, apellido, fecha_parto, hora_parto, dado_de_alta_por]
        );
        return result.rows[0];
    }

    static async findAll(incluirInactivas = false) {
        let query = `
            SELECT m.*, u.nombre as dado_de_alta_por_nombre 
            FROM madres m
            LEFT JOIN usuarios u ON m.dado_de_alta_por = u.id
        `;
        
        if (!incluirInactivas) {
            query += ` WHERE m.activo = true`;
        }
        
        query += ` ORDER BY m.creado_el DESC`;
        
        const result = await pool.query(query);
        return result.rows;
    }

    static async findByUid(uid, incluirInactivas = false) {
        let query = `
            SELECT m.*, 
                   COALESCE((SELECT COUNT(*) FROM bebes WHERE madre_uid = m.uid AND bebes.activo = true), 0) as numero_bebes
            FROM madres m 
            WHERE m.uid = $1
        `;
        
        if (!incluirInactivas) {
            query += ` AND m.activo = true`;
        }
        
        const result = await pool.query(query, [uid]);
        return result.rows[0];
    }

    static async findById(id, incluirInactivas = false) {
        let query = `
            SELECT m.*,
                    COALESCE(
                        (SELECT json_agg(
                            json_build_object(
                                'id', b.id,
                                'fecha_nacimiento', b.fecha_nacimiento,
                                'hora_nacimiento', b.hora_nacimiento,
                                'creado_el', b.creado_el,
                                'activo', b.activo
                            ) ORDER BY b.creado_el ASC
                        ) FROM bebes b WHERE b.madre_uid = m.uid AND b.activo = true), 
                        '[]'::json
                    ) as bebes
             FROM madres m WHERE m.id = $1
        `;
        
        if (!incluirInactivas) {
            query += ` AND m.activo = true`;
        }
        
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    // NUEVO MÉTODO: Dar de alta a una madre
    static async darDeAlta(uid, dadoDeAltaPor) {
        const result = await pool.query(
            `UPDATE madres 
             SET activo = false, 
                 fecha_alta = NOW(),
                 dado_de_alta_por = $2
             WHERE uid = $1 AND activo = true
             RETURNING *`,
            [uid, dadoDeAltaPor]
        );
        return result.rows[0];
    }

    // NUEVO MÉTODO: Reactivar una madre (si es necesario)
    static async reactivar(uid) {
        const result = await pool.query(
            `UPDATE madres 
             SET activo = true, 
                 fecha_alta = NULL,
                 dado_de_alta_por = NULL
             WHERE uid = $1 AND activo = false
             RETURNING *`,
            [uid]
        );
        return result.rows[0];
    }

    // models/Madre.js - Asegurar que findByUid funcione correctamente

static async findByUid(uid, soloActivas = true) {
    let query = `
        SELECT m.*, 
               COALESCE((SELECT COUNT(*) FROM bebes WHERE madre_uid = m.uid AND bebes.activo = true), 0) as numero_bebes
        FROM madres m 
        WHERE m.uid = $1
    `;
    
    if (soloActivas) {
        query += ` AND m.activo = true`;
    }
    
    const result = await pool.query(query, [uid]);
    return result.rows[0];
}
}

export default Madre;