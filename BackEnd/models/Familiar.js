import pool from '../config/db.js';

class Familiar {
    static async create(uid, madre_uid, nombre, apellido, parentezco, email, telefono) {
        const result = await pool.query(
            `INSERT INTO familiares 
             (uid, madre_uid, nombre, apellido, parentezco, email, telefono) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING id, uid, nombre, apellido, email, parentezco`,
            [uid, madre_uid, nombre, apellido, parentezco, email, telefono]
        );
        return result.rows[0];
    }

    static async findByEmail(email) {
        const result = await pool.query(
            `SELECT f.*, m.nombre as madre_nombre, m.apellido as madre_apellido, m.uid as madre_uid
             FROM familiares f
             JOIN madres m ON f.madre_uid = m.uid
             WHERE f.email = $1 AND f.activo = true`,
            [email]
        );
        return result.rows[0];
    }

    static async findById(id) {
        const result = await pool.query(
            `SELECT f.*, m.nombre as madre_nombre, m.apellido as madre_apellido
             FROM familiares f
             JOIN madres m ON f.madre_uid = m.uid
             WHERE f.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async checkEmailExists(email) {
        const result = await pool.query(
            "SELECT id FROM familiares WHERE email = $1",
            [email]
        );
        return result.rows.length > 0;
    }

    static async updateLastAccess(id) {
        await pool.query(
            "UPDATE familiares SET ultimo_acceso = NOW() WHERE id = $1",
            [id]
        );
    }

    static async checkUidExists(uid) {
        const result = await pool.query(
            "SELECT id FROM familiares WHERE uid = $1",
            [uid]
        );
        return result.rows.length > 0;
    }
}

export default Familiar;