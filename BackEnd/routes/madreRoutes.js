import Express from "express";
import { 
    registerMadre, 
    getAllMadres, 
    getMadrePerfil, 
    darDeAltaMadre
} from "../controllers/madreController.js";
import { protect, authorize, isMadre } from "../middleware/auth.js";

const router = Express.Router();

router.post("/", protect, authorize('medico', 'enfermero'), registerMadre);
router.get("/", protect, authorize('medico', 'enfermero'), getAllMadres);
router.get("/perfil", protect, isMadre, getMadrePerfil);
router.put("/dar-de-alta", protect, authorize('medico', 'enfermero'), darDeAltaMadre); // NUEVA RUTA

export default router;