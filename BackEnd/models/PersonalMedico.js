import pool from '../config/db.js';

class PersonalMedico {
    static async create(usuario_id, cedula, nombre, edad, horario_entrada, horario_salida, tipo, permiso_neonatologia) {
        const result = await pool.query(
            `INSERT INTO personal_medico 
             (usuario_id, cedula, nombre, edad, horario_entrada, horario_salida, tipo, permiso_neonatologia) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [usuario_id, cedula, nombre, edad, horario_entrada, horario_salida, tipo, permiso_neonatologia]
        );
        return result.rows[0];
    }

    static async findAll() {
        const result = await pool.query(`
            SELECT pm.*, u.nombre as nombre_usuario, u.email 
            FROM personal_medico pm
            JOIN usuarios u ON pm.usuario_id = u.id
            ORDER BY pm.id DESC
        `);
        return result.rows;
    }

    static async findByTipo(tipo) {
        const result = await pool.query(`
            SELECT pm.*, u.nombre as nombre_usuario, u.email 
            FROM personal_medico pm
            JOIN usuarios u ON pm.usuario_id = u.id
            WHERE pm.tipo = $1
            ORDER BY pm.id DESC
        `, [tipo]);
        return result.rows;
    }
}

export default PersonalMedico;