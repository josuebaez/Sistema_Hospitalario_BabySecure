import pool from '../config/db.js';

class Madre {
    static async create(uid, nombre, apellido, fecha_parto, hora_parto, dado_de_alta_por) {
        const result = await pool.query(
            `INSERT INTO madres (uid, nombre, apellido, fecha_parto, hora_parto, dado_de_alta_por) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [uid, nombre, apellido, fecha_parto, hora_parto, dado_de_alta_por]
        );
        return result.rows[0];
    }

    static async findAll() {
        const result = await pool.query(`
            SELECT m.*, u.nombre as dado_de_alta_por_nombre 
            FROM madres m
            JOIN usuarios u ON m.dado_de_alta_por = u.id
            ORDER BY m.creado_el DESC
        `);
        return result.rows;
    }

    static async findByUid(uid) {
        const result = await pool.query(
            `SELECT m.*, 
                    COALESCE((SELECT COUNT(*) FROM bebes WHERE madre_uid = m.uid), 0) as numero_bebes
             FROM madres m WHERE m.uid = $1`,
            [uid]
        );
        return result.rows[0];
    }

    static async findById(id) {
        const result = await pool.query(
            `SELECT m.*,
                    COALESCE(
                        (SELECT json_agg(
                            json_build_object(
                                'id', b.id,
                                'fecha_nacimiento', b.fecha_nacimiento,
                                'hora_nacimiento', b.hora_nacimiento,
                                'creado_el', b.creado_el
                            ) ORDER BY b.creado_el ASC
                        ) FROM bebes b WHERE b.madre_uid = m.uid), 
                        '[]'::json
                    ) as bebes
             FROM madres m WHERE m.id = $1`,
            [id]
        );
        return result.rows[0];
    }
}

export default Madre;