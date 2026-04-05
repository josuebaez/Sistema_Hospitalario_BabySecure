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

router.post("/login", loginPersonal);
router.post("/login-madre", loginMadre);
router.post("/login-familiar", loginFamiliar);
router.get("/me", protect, getCurrentUser);
router.post("/logout", logout);

export default router;