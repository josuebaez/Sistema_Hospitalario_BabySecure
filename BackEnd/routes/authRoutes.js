import Express from "express";
import { 
    loginPersonal, 
    loginMadre, 
    loginFamiliar,
    getCurrentUser,
    logout 
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = Express.Router();

// Rutas públicas
router.post("/login", loginPersonal);
router.post("/login-madre", loginMadre);
router.post("/login-familiar", loginFamiliar);
router.post("/logout", logout);

// Ruta protegida (requiere autenticación)
router.get("/me", protect, getCurrentUser);

export default router;