import { Router } from "express";
import { 
    getAllUsers,
    deleteUser,
    getStats,
    // Recipe management
    getPendingRecipes,
    getAllRecipesAdmin,
    approveRecipe,
    rejectRecipe,
    deleteRecipeAdmin
} from "../controllers/adminController.js";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.js";

const router = Router();

// All admin routes require authentication AND admin role
router.use(authMiddleware, adminMiddleware);

// ==================== USER MANAGEMENT ====================
// Get all users
router.get('/users', getAllUsers);

// Delete user
router.delete('/users/:id', deleteUser);

// Get platform statistics
router.get('/stats', getStats);

// ==================== RECIPE MANAGEMENT ====================
// Get all pending recipes
router.get('/recipes/pending', getPendingRecipes);

// Get all recipes (with optional filters)
router.get('/recipes/all', getAllRecipesAdmin);

// Approve recipe
router.put('/recipes/:id/approve', approveRecipe);

// Reject recipe
router.put('/recipes/:id/reject', rejectRecipe);

// Delete recipe (admin)
router.delete('/recipes/:id', deleteRecipeAdmin);

export { router as RouterAdmin };