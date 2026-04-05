import pool from '../config/db.js';

class User {
    static async findByEmail(email) {
        const result = await pool.query(
            "SELECT * FROM usuarios WHERE email = $1",
            [email]
        );
        return result.rows[0];
    }

    static async findById(id) {
        const result = await pool.query(
            "SELECT id, nombre, email, rol FROM usuarios WHERE id = $1",
            [id]
        );
        return result.rows[0];
    }

    static async create(nombre, email, password, rol) {
        const result = await pool.query(
            "INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol",
            [nombre, email, password, rol]
        );
        return result.rows[0];
    }
}

export default User;