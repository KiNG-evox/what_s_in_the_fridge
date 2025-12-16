import Recipe from "../models/recipe.js";
import Review from "../models/review.js";

/**
 * Create a new recipe
 * Expects multipart/form-data if uploading images
 */
export async function createRecipe(req, res) {
    try {
        const userId = req.user.id;
        const { title, description, ingredients, instructions, category, servings, preparationTime, cookingTime } = req.body;

        if (!title || !description || !ingredients || !instructions) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Parse ingredients if sent as JSON string
        const parsedIngredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients;
        const parsedInstructions = typeof instructions === 'string' ? JSON.parse(instructions) : instructions;

        const recipeData = {
            title,
            description,
            ingredients: parsedIngredients,
            instructions: parsedInstructions,
            category,
            servings,
            preparationTime,
            cookingTime,
            user: userId,
            images: []
        };

        // Handle uploaded images (single or multiple)
        if (req.file) {
            recipeData.images.push(`/uploads/${req.file.filename}`);
        } else if (req.files && req.files.length > 0) {
            recipeData.images = req.files.map(file => `/uploads/${file.filename}`);
        }

        const recipe = await Recipe.create(recipeData);
        const populatedRecipe = await Recipe.findById(recipe._id).populate("user", "name email");

        
        res.status(201).json({ success: true, data: populatedRecipe });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to create recipe" });
    }
}

/**
 * Update a recipe by ID
 */
export async function updateRecipe(req, res) {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ success: false, message: "Recipe not found" });

        if (recipe.user.toString() !== req.user.id)
            return res.status(403).json({ success: false, message: "Access denied" });

        // Parse ingredients and instructions if they're strings
        if (req.body.ingredients && typeof req.body.ingredients === 'string') {
            req.body.ingredients = JSON.parse(req.body.ingredients);
        }
        if (req.body.instructions && typeof req.body.instructions === 'string') {
            req.body.instructions = JSON.parse(req.body.instructions);
        }

        Object.assign(recipe, req.body);

        // Add new images if uploaded
        if (req.file) {
            recipe.images = recipe.images ? [...recipe.images, `/uploads/${req.file.filename}`] : [`/uploads/${req.file.filename}`];
        } else if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => `/uploads/${file.filename}`);
            recipe.images = recipe.images ? [...recipe.images, ...newImages] : newImages;
        }

        await recipe.save();
        const populatedRecipe = await Recipe.findById(recipe._id).populate("user", "name email");
        
        res.status(200).json({ success: true, data: populatedRecipe });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to update recipe" });
    }
}

/**
 * Delete a recipe by ID
 */
export async function deleteRecipe(req, res) {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ success: false, message: "Recipe not found" });

        // Allow admin or recipe owner to delete
        if (recipe.user.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        await Recipe.findByIdAndDelete(req.params.id);
        await Review.deleteMany({ recipe: req.params.id });

        res.status(200).json({ success: true, message: "Recipe deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to delete recipe" });
    }
}

/**
 * Get all recipes (community feed)
 */
export async function getAllRecipes(req, res) {
    try {
        const recipes = await Recipe.find()
            .populate("user", "name email")
            .populate({
                path: "reviews",
                populate: { path: "user", select: "name email" }
            })
            .sort({ createdAt: -1 }); // Show newest first

        res.status(200).json({ success: true, count: recipes.length, data: recipes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch recipes" });
    }
}

/**
 * Get recipe by ID with full details
 */
export async function getRecipeById(req, res) {
    try {
        const recipe = await Recipe.findById(req.params.id)
            .populate("user", "name email")
            .populate({
                path: "reviews",
                populate: { path: "user", select: "name email" }
            });
            
        if (!recipe) return res.status(404).json({ success: false, message: "Recipe not found" });
        
        res.status(200).json({ success: true, data: recipe });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch recipe" });
    }
}

/**
 * Get recipes by specific user
 */
export async function getUserRecipes(req, res) {
    try {
        const userId = req.params.userId || req.user.id;
        const recipes = await Recipe.find({ user: userId })
            .populate("user", "name email")
            .populate({
                path: "reviews",
                populate: { path: "user", select: "name email" }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: recipes.length, data: recipes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch user recipes" });
    }
}

/**
 * Add a review to a recipe
 */
export async function addReview(req, res) {
    try {
        const userId = req.user.id;
        const recipeId = req.params.id;
        const { rating, comment } = req.body;

        if (!rating || !comment) {
            return res.status(400).json({ success: false, message: "Rating and comment required" });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
        }

        // Check if user already reviewed this recipe
        const existingReview = await Review.findOne({ user: userId, recipe: recipeId });
        if (existingReview) {
            return res.status(400).json({ success: false, message: "You already reviewed this recipe" });
        }

        const review = await Review.create({ user: userId, recipe: recipeId, rating, comment });
        const populatedReview = await Review.findById(review._id).populate("user", "name email");
        
        const recipe = await Recipe.findById(recipeId);
        recipe.reviews.push(review._id);
        await recipe.save();

        res.status(201).json({ success: true, data: populatedReview });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to add review" });
    }
}

/**
 * Update a review
 */
export async function updateReview(req, res) {
    try {
        const review = await Review.findById(req.params.reviewId);
        if (!review) return res.status(404).json({ success: false, message: "Review not found" });

        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        const { rating, comment } = req.body;
        if (rating) {
            if (rating < 1 || rating > 5) {
                return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
            }
            review.rating = rating;
        }
        if (comment) review.comment = comment;

        await review.save();
        const populatedReview = await Review.findById(review._id).populate("user", "name email");

        res.status(200).json({ success: true, data: populatedReview });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to update review" });
    }
}

/**
 * Delete a review
 */
export async function deleteReview(req, res) {
    try {
        const review = await Review.findById(req.params.reviewId);
        if (!review) return res.status(404).json({ success: false, message: "Review not found" });

        // Allow admin or review owner to delete
        if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        await Review.findByIdAndDelete(req.params.reviewId);
        await Recipe.findByIdAndUpdate(review.recipe, { $pull: { reviews: review._id } });

        res.status(200).json({ success: true, message: "Review deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to delete review" });
    }
}