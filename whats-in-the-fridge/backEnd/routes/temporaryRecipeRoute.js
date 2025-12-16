import { Router } from "express";
import { 
    createTemporaryRecipe, 
    getTemporaryRecipeById,
    getTemporaryRecipesBySession,
    saveTemporaryRecipe,
    deleteTemporaryRecipe
} from "../controllers/temporaryRecipeController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

// Public routes (no authentication required)
// AI can generate recipes before user logs in
router.post("/", createTemporaryRecipe);
router.get("/:id", getTemporaryRecipeById);
router.get("/session/:sessionId", getTemporaryRecipesBySession);
router.delete("/:id", deleteTemporaryRecipe);

// Protected route (authentication required)
// User must be logged in to save temp recipe as permanent
router.post("/:id/save", authMiddleware, saveTemporaryRecipe);

export { router as RouterTemporaryRecipe };