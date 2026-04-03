// scripts/createAdmin.js
import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hospital',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function checkAndAddColumns() {
    try {
        // Verificar si la tabla usuarios existe
        const checkTable = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'usuarios'
            )
        `);
        
        if (!checkTable.rows[0].exists) {
            console.log('⚠️ La tabla usuarios no existe. Ejecuta primero el script SQL para crear las tablas.');
            return false;
        }
        
        // Verificar si la columna rol existe
        const checkColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'usuarios' AND column_name = 'rol'
        `);
        
        if (checkColumn.rows.length === 0) {
            console.log('⚠️ La columna rol no existe. Agregándola...');
            await pool.query(`
                ALTER TABLE usuarios 
                ADD COLUMN rol VARCHAR(50) NOT NULL DEFAULT 'medico'
            `);
            console.log('✅ Columna rol agregada exitosamente');
        } else {
            console.log('✅ La columna rol ya existe');
        }
        
        return true;
        
    } catch (error) {
        console.error('Error verificando/agregando columnas:', error.message);
        return false;
    }
}

async function createAdmin() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Conectando a la base de datos...');
        
        // Verificar que las tablas existan
        const tablasOK = await checkAndAddColumns();
        if (!tablasOK) {
            console.log('\n❌ Por favor, ejecuta primero el script SQL para crear las tablas.');
            console.log('El script SQL debe crear: usuarios, personal_medico, personal_seguridad, madres, bebes');
            return;
        }
        
        // Verificar si ya existe un admin
        const checkAdmin = await client.query(
            "SELECT id, nombre, email, rol FROM usuarios WHERE rol = 'admin' LIMIT 1"
        );
        
        if (checkAdmin.rows.length > 0) {
            console.log('⚠️ Ya existe un administrador en el sistema:');
            console.log('─────────────────────────────────');
            console.log(`ID: ${checkAdmin.rows[0].id}`);
            console.log(`Nombre: ${checkAdmin.rows[0].nombre}`);
            console.log(`Email: ${checkAdmin.rows[0].email}`);
            console.log(`Rol: ${checkAdmin.rows[0].rol}`);
            console.log('─────────────────────────────────');
            console.log('\n💡 Puedes iniciar sesión con estas credenciales');
            return;
        }
        
        // Datos del admin
        const nombre = 'Administrador';
        const email = 'admin@hospital.com';
        const password = 'admin123';
        const rol = 'admin';
        
        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insertar admin
        const result = await client.query(
            `INSERT INTO usuarios (nombre, email, password, rol) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, nombre, email, rol`,
            [nombre, email, hashedPassword, rol]
        );
        
        console.log('\n✅ Administrador creado exitosamente:');
        console.log('═══════════════════════════════════════');
        console.log(`ID: ${result.rows[0].id}`);
        console.log(`Nombre: ${result.rows[0].nombre}`);
        console.log(`Email: ${result.rows[0].email}`);
        console.log(`Rol: ${result.rows[0].rol}`);
        console.log('═══════════════════════════════════════');
        console.log('\n📝 Credenciales para iniciar sesión:');
        console.log(`   Email: ${email}`);
        console.log(`   Contraseña: ${password}`);
        console.log('\n💡 Puedes iniciar sesión en: http://localhost:5173/login');
        
    } catch (error) {
        console.error('❌ Error al crear administrador:', error.message);
        
        if (error.code === '23505') {
            console.log('⚠️ El email ya está registrado.');
        } else if (error.code === '42P01') {
            console.log('⚠️ La tabla usuarios no existe.');
            console.log('Por favor, ejecuta primero el script SQL para crear las tablas.');
        }
    } finally {
        client.release();
        await pool.end();
    }
}

createAdmin();