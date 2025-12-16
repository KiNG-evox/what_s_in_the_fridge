import { Router } from "express";
import { 
    addToFavorites,
    getUserFavorites,
    removeFromFavorites,
    checkFavorite
} from "../controllers/favoriteController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

// Add recipe to favorites (requires authentication)
// POST /api/favorites
router.post('/', authMiddleware, addToFavorites);

// Get user's favorites (requires authentication)
// GET /api/favorites/user/:userId
router.get('/user/:userId', authMiddleware, getUserFavorites);

// Check if recipe is favorited (requires authentication)
// GET /api/favorites/check/:userId/:recipeId
router.get('/check/:userId/:recipeId', authMiddleware, checkFavorite);

// Remove from favorites (requires authentication)
// DELETE /api/favorites/:id
router.delete('/:id', authMiddleware, removeFromFavorites);

export { router as RouterFavorites };
