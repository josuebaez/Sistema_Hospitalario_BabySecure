import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// Importar rutas
import authRoutes from "./routes/authRoutes.js";
import madreRoutes from "./routes/madreRoutes.js";
import bebeRoutes from "./routes/bebeRoutes.js";
import familiarRoutes from "./routes/familiarRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/madres", madreRoutes);
app.use("/api/bebes", bebeRoutes);
app.use("/api/familiares", familiarRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en el puerto ${PORT}`);
    console.log(`📝 API disponible en http://localhost:${PORT}/api`);
});