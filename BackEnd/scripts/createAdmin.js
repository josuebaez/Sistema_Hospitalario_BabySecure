// scripts/createAdmin.js
import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar .env desde la raíz del proyecto
dotenv.config({ path: join(__dirname, '..', '.env') });

// Mostrar configuración (ocultando contraseña), cambiar por el nombre de la BD que voy a usar
console.log('📋 Configuración de BD:');
console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`   Puerto: ${process.env.DB_PORT || 5432}`);
console.log(`   Base de datos: ${process.env.DB_NAME || 'pruebas'}`);
console.log(`   Usuario: ${process.env.DB_USER || 'postgres'}`);
console.log(`   Contraseña: ${process.env.DB_PASSWORD ? '***' : 'No definida'}`);

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'pruebas',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function createAdmin() {
    let client;
    try {
        console.log('\n🔧 Conectando a la base de datos...');
        client = await pool.connect();
        console.log('✅ Conexión exitosa!');
        
        // Verificar si ya existe un admin
        const checkAdmin = await client.query(
            "SELECT id, nombre, email, rol FROM usuarios WHERE rol = 'admin' LIMIT 1"
        );
        
        if (checkAdmin.rows.length > 0) {
            console.log('\n⚠️ Ya existe un administrador en el sistema:');
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
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        
        if (error.code === '28P01') {
            console.log('\n⚠️ Error de autenticación. Verifica:');
            console.log('   1. La contraseña del usuario PostgreSQL');
            console.log('   2. El nombre de usuario (por defecto es "postgres")');
            console.log('   3. Las variables en el archivo .env');
            console.log('\n💡 Puedes probar con:');
            console.log('   DB_PASSWORD=tu_contraseña_correcta');
        } else if (error.code === '42P01') {
            console.log('\n⚠️ La tabla usuarios no existe.');
            console.log('   Ejecuta primero el script SQL para crear las tablas.');
        } else if (error.code === '3D000') {
            console.log('\n⚠️ La base de datos no existe.');
            console.log(`   Crea la base de datos: CREATE DATABASE ${process.env.DB_NAME || 'pruebas'};`);
        }
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

createAdmin();