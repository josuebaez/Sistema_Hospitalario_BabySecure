import Express from "express";
import { 
    registerUser, 
    getPersonalMedico, 
    getPersonalSeguridad 
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Express.Router();

router.post("/register", protect, authorize('admin'), registerUser);
router.get("/personal-medico", protect, authorize('admin'), getPersonalMedico);
router.get("/personal-seguridad", protect, authorize('admin'), getPersonalSeguridad);

export default router;