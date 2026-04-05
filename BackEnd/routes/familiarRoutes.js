import Express from "express";
import { registerFamiliar, getFamiliarData } from "../controllers/familiarController.js";
import { protect } from "../middleware/auth.js";

const router = Express.Router();

router.post("/registro", registerFamiliar);
router.get("/me", protect, getFamiliarData);

export default router;