import User from "../models/User.js";
import Recipe from "../models/recipe.js";
import Favorite from "../models/favorites.js";
import Review from "../models/review.js";

/**
 * Get all users
 * GET /api/admin/users
 */
export async function getAllUsers(req, res) {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error("Error in getAllUsers:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
            error: error.message
        });
    }
}

/**
 * Delete user (Admin only)
 * DELETE /api/admin/users/:id
 */
export async function deleteUser(req, res) {
    try {
        const { id } = req.params;
        
        const user = await User.findById(id);
        if (user && user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: "Cannot delete admin users"
            });
        }
        
        await User.findByIdAndDelete(id);
        await Recipe.deleteMany({ requestedBy: id });
        await Favorite.deleteMany({ user: id });
        await Review.deleteMany({ user: id });
        
        res.status(200).json({
            success: true,
            message: "User and associated data deleted successfully"
        });
    } catch (error) {
        console.error("Error in deleteUser:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete user",
            error: error.message
        });
    }
}

/**
 * Get platform statistics (Admin only)
 * GET /api/admin/stats
 */
export async function getStats(req, res) {
    try {
        const totalUsers = await User.countDocuments();
        const totalRecipes = await Recipe.countDocuments();
        const approvedRecipes = await Recipe.countDocuments({ status: 'approved' });
        const pendingRecipes = await Recipe.countDocuments({ status: 'pending' });
        const rejectedRecipes = await Recipe.countDocuments({ status: 'rejected' });
        const totalFavorites = await Favorite.countDocuments();
        const totalReviews = await Review.countDocuments();
        const aiRecipes = await Recipe.countDocuments({ source: 'ai' });
        const humanRecipes = await Recipe.countDocuments({ source: 'human' });
        
        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalRecipes,
                approvedRecipes,
                pendingRecipes,
                rejectedRecipes,
                totalFavorites,
                totalReviews,
                aiRecipes,
                humanRecipes
            }
        });
    } catch (error) {
        console.error("Error in getStats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch statistics",
            error: error.message
        });
    }
}

/**
 * Get all pending recipes (Admin only)
 * GET /api/admin/recipes/pending
 */
export async function getPendingRecipes(req, res) {
    try {
        const pendingRecipes = await Recipe.find({ status: 'pending' })
            .populate('requestedBy', 'name email pseudo')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: pendingRecipes.length,
            data: pendingRecipes
        });
    } catch (error) {
        console.error("Error in getPendingRecipes:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch pending recipes",
            error: error.message
        });
    }
}

/**
 * Get all recipes (Admin only - includes all statuses)
 * GET /api/admin/recipes/all
 */
export async function getAllRecipesAdmin(req, res) {
    try {
        const { status, source } = req.query;
        
        let query = {};
        if (status) query.status = status;
        if (source) query.source = source;

        const recipes = await Recipe.find(query)
            .populate('requestedBy', 'name email pseudo')
            .populate('reviewedBy', 'name email pseudo')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: recipes.length,
            data: recipes
        });
    } catch (error) {
        console.error("Error in getAllRecipesAdmin:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch recipes",
            error: error.message
        });
    }
}

/**
 * Approve a recipe (Admin only)
 * PUT /api/admin/recipes/:id/approve
 */
export async function approveRecipe(req, res) {
    try {
        const { id } = req.params;
        const adminId = req.user.id;

        const recipe = await Recipe.findById(id);
        
        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found"
            });
        }

        if (recipe.status === 'approved') {
            return res.status(400).json({
                success: false,
                message: "Recipe is already approved"
            });
        }

        recipe.status = 'approved';
        recipe.reviewedBy = adminId;
        recipe.reviewedAt = new Date();
        recipe.rejectionReason = undefined;

        await recipe.save();

        const populatedRecipe = await Recipe.findById(id)
            .populate('requestedBy', 'name email pseudo')
            .populate('reviewedBy', 'name email pseudo');

        res.status(200).json({
            success: true,
            message: "Recipe approved successfully",
            data: populatedRecipe
        });
    } catch (error) {
        console.error("Error in approveRecipe:", error);
        res.status(500).json({
            success: false,
            message: "Failed to approve recipe",
            error: error.message
        });
    }
}

/**
 * Reject a recipe (Admin only)
 * PUT /api/admin/recipes/:id/reject
 */
export async function rejectRecipe(req, res) {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const adminId = req.user.id;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: "Rejection reason is required"
            });
        }

        const recipe = await Recipe.findById(id);
        
        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found"
            });
        }

        recipe.status = 'rejected';
        recipe.reviewedBy = adminId;
        recipe.reviewedAt = new Date();
        recipe.rejectionReason = reason;

        await recipe.save();

        const populatedRecipe = await Recipe.findById(id)
            .populate('requestedBy', 'name email pseudo')
            .populate('reviewedBy', 'name email pseudo');

        res.status(200).json({
            success: true,
            message: "Recipe rejected",
            data: populatedRecipe
        });
    } catch (error) {
        console.error("Error in rejectRecipe:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reject recipe",
            error: error.message
        });
    }
}

/**
 * Delete any recipe (Admin only)
 * DELETE /api/admin/recipes/:id
 */
export async function deleteRecipeAdmin(req, res) {
    try {
        const { id } = req.params;

        const recipe = await Recipe.findByIdAndDelete(id);
        
        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found"
            });
        }

        await Review.deleteMany({ recipe: id });
        await Favorite.deleteMany({ recipe: id });

        res.status(200).json({
            success: true,
            message: "Recipe and associated data deleted successfully"
        });
    } catch (error) {
        console.error("Error in deleteRecipeAdmin:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete recipe",
            error: error.message
        });
    }
}