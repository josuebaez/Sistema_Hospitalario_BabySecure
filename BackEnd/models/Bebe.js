import pool from '../config/db.js';

class Bebe {
    static async create(madre_uid, nombre_madre, fecha_nacimiento, hora_nacimiento, dado_de_alta_por) {
        const result = await pool.query(
            `INSERT INTO bebes (madre_uid, nombre_madre, fecha_nacimiento, hora_nacimiento, dado_de_alta_por, activo) 
             VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
            [madre_uid, nombre_madre, fecha_nacimiento, hora_nacimiento, dado_de_alta_por]
        );
        return result.rows[0];
    }

    static async findByMadreUid(madre_uid, incluirInactivos = false) {
        let query = `
            SELECT b.*, u.nombre as dado_de_alta_por_nombre 
            FROM bebes b
            LEFT JOIN usuarios u ON b.dado_de_alta_por = u.id
            WHERE b.madre_uid = $1
        `;
        
        if (!incluirInactivos) {
            query += ` AND b.activo = true`;
        }
        
        query += ` ORDER BY b.creado_el DESC`;
        
        const result = await pool.query(query, [madre_uid]);
        return result.rows;
    }

    static async checkMadreExists(madre_uid) {
        const result = await pool.query(
            "SELECT * FROM madres WHERE uid = $1 AND activo = true",
            [madre_uid]
        );
        return result.rows.length > 0;
    }

    // NUEVO MÉTODO: Dar de alta a un bebé específico
    static async darDeAlta(bebeId, dadoDeAltaPor) {
        const result = await pool.query(
            `UPDATE bebes 
             SET activo = false, 
                 fecha_alta = NOW(),
                 dado_de_alta_por = $2
             WHERE id = $1 AND activo = true
             RETURNING *`,
            [bebeId, dadoDeAltaPor]
        );
        return result.rows[0];
    }
}

export default Bebe;