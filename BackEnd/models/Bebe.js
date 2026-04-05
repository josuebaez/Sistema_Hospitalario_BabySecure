import pool from '../config/db.js';

class Bebe {
    static async create(madre_uid, nombre_madre, fecha_nacimiento, hora_nacimiento, dado_de_alta_por) {
        const result = await pool.query(
            `INSERT INTO bebes (madre_uid, nombre_madre, fecha_nacimiento, hora_nacimiento, dado_de_alta_por) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [madre_uid, nombre_madre, fecha_nacimiento, hora_nacimiento, dado_de_alta_por]
        );
        return result.rows[0];
    }

    static async findByMadreUid(madre_uid) {
        const result = await pool.query(
            `SELECT b.*, u.nombre as dado_de_alta_por_nombre 
             FROM bebes b
             JOIN usuarios u ON b.dado_de_alta_por = u.id
             WHERE b.madre_uid = $1
             ORDER BY b.creado_el DESC`,
            [madre_uid]
        );
        return result.rows;
    }

    static async checkMadreExists(madre_uid) {
        const result = await pool.query(
            "SELECT * FROM madres WHERE uid = $1",
            [madre_uid]
        );
        return result.rows.length > 0;
    }
}

export default Bebe;