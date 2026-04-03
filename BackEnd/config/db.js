// config/db.js
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 Configuración de BD:');
console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`   Puerto: ${process.env.DB_PORT || 5432}`);
console.log(`   Base de datos: ${process.env.DB_NAME || 'hospital'}`);
console.log(`   Usuario: ${process.env.DB_USER || 'postgres'}`);

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hospital',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

// Probar conexión y mostrar tablas
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Conexión a PostgreSQL exitosa');
        
        // Mostrar todas las tablas
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log('\n📋 Tablas en la base de datos:');
        if (tables.rows.length === 0) {
            console.log('   ❌ No hay tablas');
        } else {
            tables.rows.forEach(row => {
                console.log(`   - ${row.table_name}`);
            });
        }
        
        // Verificar específicamente personal_medico 
        const checkPersonalMedico = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'personal_medico'
            )
        `);
        
        if (checkPersonalMedico.rows[0].exists) {
            console.log('\n✅ Tabla personal_medico existe');
            console.log('   El sistema está listo para funcionar');
        } else {
            console.log('\n❌ Tabla personal_medico NO existe');
            console.log('   Por favor, ejecuta el script SQL para crear las tablas:');
            console.log('   - usuarios');
            console.log('   - personal_medico');
            console.log('   - personal_seguridad');
            console.log('   - madres');
            console.log('   - bebes');
        }
        
        client.release();
        
    } catch (err) {
        console.error('❌ Error de conexión:', err.message);
    }
};

testConnection();

export default pool;