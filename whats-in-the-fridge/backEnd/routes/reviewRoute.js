import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { 
    addReview,
    getRecipeReviews,
    updateReview,
    deleteReview
} from "../controllers/reviewController.js";

const router = Router();

// Add review - requires authentication
router.post('/', authMiddleware, addReview);

// Get all reviews for a recipe - public
router.get('/recipe/:recipeId', getRecipeReviews);

// Update review - requires authentication
router.put('/:id', authMiddleware, updateReview);

// Delete review - requires authentication
router.delete('/:id', authMiddleware, deleteReview);

export { router as RouterReview };