import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.js";
import { upload } from "../middlewares/upload.js";

import {
    createRecipe,
    updateRecipe,
    deleteRecipe,
    getAllRecipes,
    getRecipeById,
    addReview,
    deleteReview
} from "../controllers/communityController.js";

const router = Router();

// Users can create/update/delete their own recipes
router.post('/', authMiddleware, createRecipe);
router.put('/:id', authMiddleware, updateRecipe);
router.delete('/:id', authMiddleware, deleteRecipe); // only owner or admin can delete

// Users can create/update recipes with images
router.post('/', authMiddleware, upload.array("images", 5), createRecipe);
router.put('/:id', authMiddleware, upload.array("images", 5), updateRecipe);


// Anyone can see recipes
router.get('/', getAllRecipes);
router.get('/:id', getRecipeById);

// Reviews
router.post('/:id/review', authMiddleware, addReview); // add review to recipe
router.delete('/:id/review/:reviewId', authMiddleware, deleteReview); // delete review if owner/admin

export { router as RouterCommunity };
