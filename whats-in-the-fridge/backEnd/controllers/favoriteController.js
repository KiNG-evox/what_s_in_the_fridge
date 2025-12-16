import Favorite from "../models/favorites.js";
import Recipe from "../models/recipe.js";

/**
 * Add recipe to favorites
 * POST /api/favorites
 */
export async function addToFavorites(req, res) {
    try {
        const userId = req.user.id; // Get user ID from JWT
        const { recipeId, notes } = req.body;

        if (!recipeId) {
            return res.status(400).json({
                success: false,
                message: "Recipe ID is required"
            });
        }

        // Check if recipe exists
        const recipe = await Recipe.findById(recipeId);
        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found"
            });
        }

        // Check if already favorited
        const existingFavorite = await Favorite.findOne({
            user: userId,
            recipe: recipeId
        });

        if (existingFavorite) {
            return res.status(400).json({
                success: false,
                message: "Recipe already in favorites"
            });
        }

        // Create favorite
        const favorite = await Favorite.create({
            user: userId,
            recipe: recipeId,
            notes: notes || ''
        });

        await favorite.populate('recipe');

        res.status(201).json({
            success: true,
            message: "Recipe added to favorites",
            data: favorite
        });

    } catch (error) {
        console.error("Error in addToFavorites:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add to favorites",
            error: error.message
        });
    }
}

/**
 * Get user's favorites
 * GET /api/favorites/user/:userId
 */
export async function getUserFavorites(req, res) {
    try {
        const { userId } = req.params;

        const favorites = await Favorite.find({ user: userId })
            .populate('recipe')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: favorites.length,
            data: favorites
        });
    } catch (error) {
        console.error("Error in getUserFavorites:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch favorites",
            error: error.message
        });
    }
}

/**
 * Remove from favorites
 * DELETE /api/favorites/:id
 */
export async function removeFromFavorites(req, res) {
    try {
        const { id } = req.params;

        const favorite = await Favorite.findByIdAndDelete(id);
        if (!favorite) {
            return res.status(404).json({
                success: false,
                message: "Favorite not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Removed from favorites"
        });
    } catch (error) {
        console.error("Error in removeFromFavorites:", error);
        res.status(500).json({
            success: false,
            message: "Failed to remove from favorites",
            error: error.message
        });
    }
}

/**
 * Check if recipe is favorited
 * GET /api/favorites/check/:userId/:recipeId
 */
export async function checkFavorite(req, res) {
    try {
        const { userId, recipeId } = req.params;

        const favorite = await Favorite.findOne({
            user: userId,
            recipe: recipeId
        });

        res.status(200).json({
            success: true,
            isFavorited: !!favorite,
            favoriteId: favorite?._id || null
        });
    } catch (error) {
        console.error("Error in checkFavorite:", error);
        res.status(500).json({
            success: false,
            message: "Failed to check favorite status",
            error: error.message
        });
    }
}

