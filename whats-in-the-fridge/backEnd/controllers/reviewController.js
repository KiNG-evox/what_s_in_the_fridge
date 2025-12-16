import Review from "../models/review.js";
import Recipe from "../models/recipe.js";

/**
 * Add review to recipe
 * POST /api/reviews
 */
export async function addReview(req, res) {
    try {
        const { userId, recipeId, rating, comment } = req.body;
        
        // Validate required fields
        if (!userId || !recipeId || !rating || !comment) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
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
        
        // Check if user already reviewed this recipe
        const existingReview = await Review.findOne({
            user: userId,
            recipe: recipeId
        });
        
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "You already reviewed this recipe"
            });
        }
        
        // Create review
        const review = await Review.create({
            user: userId,
            recipe: recipeId,
            rating,
            comment
        });
        
        // Update recipe's average rating
        await updateRecipeRating(recipeId);
        
        // Populate user data
        await review.populate('user', 'name pseudo');
        
        res.status(201).json({
            success: true,
            message: "Review added successfully",
            data: review
        });
        
    } catch (error) {
        console.error("Error in addReview:", error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "You already reviewed this recipe"
            });
        }
        
        res.status(500).json({
            success: false,
            message: "Failed to add review",
            error: error.message
        });
    }
}

/**
 * Get all reviews for a recipe
 * GET /api/reviews/recipe/:recipeId
 */
export async function getRecipeReviews(req, res) {
    try {
        const { recipeId } = req.params;
        
        // Find all reviews for this recipe
        const reviews = await Review.find({ recipe: recipeId })
            .populate('user', 'name pseudo profilePicture')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        console.error("Error in getRecipeReviews:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch reviews",
            error: error.message
        });
    }
}

/**
 * Update review
 * PUT /api/reviews/:id
 */
export async function updateReview(req, res) {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        
        // Find and update review
        const review = await Review.findByIdAndUpdate(
            id,
            { rating, comment },
            { new: true, runValidators: true }
        ).populate('user', 'name pseudo');
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }
        
        // Update recipe's average rating
        await updateRecipeRating(review.recipe);
        
        res.status(200).json({
            success: true,
            message: "Review updated successfully",
            data: review
        });
    } catch (error) {
        console.error("Error in updateReview:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update review",
            error: error.message
        });
    }
}

/**
 * Delete review
 * DELETE /api/reviews/:id
 */
export async function deleteReview(req, res) {
    try {
        const { id } = req.params;
        
        const review = await Review.findById(id);
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }
        
        const recipeId = review.recipe;
        
        // Delete review
        await Review.findByIdAndDelete(id);
        
        // Update recipe's average rating
        await updateRecipeRating(recipeId);
        
        res.status(200).json({
            success: true,
            message: "Review deleted successfully"
        });
    } catch (error) {
        console.error("Error in deleteReview:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete review",
            error: error.message
        });
    }
}

/**
 * Helper function: Update recipe's average rating
 */
async function updateRecipeRating(recipeId) {
    try {
        // Get all reviews for this recipe
        const reviews = await Review.find({ recipe: recipeId });
        
        if (reviews.length === 0) {
            // No reviews, reset rating
            await Recipe.findByIdAndUpdate(recipeId, {
                averageRating: 0,
                totalReviews: 0
            });
            return;
        }
        
        // Calculate average
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;
        
        // Update recipe
        await Recipe.findByIdAndUpdate(recipeId, {
            averageRating: averageRating.toFixed(1),
            totalReviews: reviews.length
        });
        
    } catch (error) {
        console.error("Error updating recipe rating:", error);
    }
}