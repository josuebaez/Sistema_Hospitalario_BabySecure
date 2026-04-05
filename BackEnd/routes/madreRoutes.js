import Express from "express";
import { 
    registerMadre, 
    getAllMadres, 
    getMadrePerfil 
} from "../controllers/madreController.js";
import { protect, authorize, isMadre } from "../middleware/auth.js";

const router = Express.Router();

router.post("/", protect, authorize('medico', 'enfermero'), registerMadre);
router.get("/", protect, authorize('medico', 'enfermero'), getAllMadres);
router.get("/perfil", protect, isMadre, getMadrePerfil);

export default router;