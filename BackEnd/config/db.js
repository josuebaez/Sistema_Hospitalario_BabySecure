import {Pool} from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
})

pool.on("Conectado", () => {
    console.log("Conectado a la base de datos");
})

pool.on("error", (err) => {
    console.error("Error en la conexión a la base de datos", err);
})

export default pool;