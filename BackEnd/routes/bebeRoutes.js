import Express from "express";
import { registerBebe, getBebesByMadre } from "../controllers/bebeController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Express.Router();

router.post("/", protect, authorize('medico', 'enfermero'), registerBebe);
router.get("/:madre_uid", protect, authorize('medico', 'enfermero'), getBebesByMadre);

export default router;