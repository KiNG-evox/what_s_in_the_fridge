import Recipe from "../models/recipe.js";
import User from "../models/User.js";
import { generateRecipes } from "../utils/GeminiAi.js";

/**
 * Generate recipes using AI (NOT saved to database yet)
 * POST /api/recipes/generate
 */
export async function generateRecipeWithAI(req, res) {
    try {
        const { ingredients } = req.body;

        console.log("📝 Received ingredients:", ingredients);

        if (!ingredients || ingredients.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide at least one ingredient"
            });
        }

        console.log("🤖 Calling Gemini AI...");
        const aiRecipes = await generateRecipes(ingredients);

        console.log("✅ AI Recipes received:", aiRecipes.length);

        const pexelsApiKey = process.env.PEXELS_API_KEY;
        const recipesWithImages = [];

        for (const recipe of aiRecipes) {
            const searchTerm = encodeURIComponent(recipe.title.toLowerCase());
            let imageUrl = null;

            if (pexelsApiKey) {
                try {
                    const pexelsResponse = await fetch(
                        `https://api.pexels.com/v1/search?query=${searchTerm}%20food&per_page=1`,
                        {
                            headers: { Authorization: pexelsApiKey }
                        }
                    );

                    const pexelsData = await pexelsResponse.json();

                    imageUrl =
                        pexelsData.photos?.[0]?.src?.large ||
                        pexelsData.photos?.[0]?.src?.medium ||
                        null;
                } catch (err) {
                    console.warn("⚠️ Pexels API failed for:", recipe.title, err.message);
                }
            }

            recipesWithImages.push({
                ...recipe,
                image:
                    imageUrl ||
                    `https://placehold.co/800x600/667eea/ffffff?text=${searchTerm}`
            });
        }

        console.log("🖼️ Added images to recipes");

        res.status(200).json({
            success: true,
            message: "Recipes generated successfully",
            count: recipesWithImages.length,
            data: recipesWithImages
        });

    } catch (error) {
        console.error("❌ Error in generateRecipeWithAI:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate recipes",
            error: error.message
        });
    }
}

/**
 * Get all APPROVED recipes (public)
 * GET /api/recipes
 */
export async function getAllRecipes(req, res) {
    try {
        // Only show approved recipes to public
        const recipes = await Recipe.find({ status: 'approved' })
            .populate("requestedBy", "name pseudo")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: recipes.length,
            data: recipes
        });
    } catch (error) {
        console.error("Error in getAllRecipes:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch recipes",
            error: error.message
        });
    }
}

/**
 * Get single recipe by ID
 * GET /api/recipes/:id
 */
export async function getRecipeById(req, res) {
    try {
        const { id } = req.params;
        const recipe = await Recipe.findById(id).populate("requestedBy", "name pseudo email");

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found"
            });
        }

        res.status(200).json({
            success: true,
            data: recipe
        });
    } catch (error) {
        console.error("Error in getRecipeById:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch recipe",
            error: error.message
        });
    }
}

/**
 * Get recipes by category
 * GET /api/recipes/category/:category
 */
export async function getRecipesByCategory(req, res) {
    try {
        const { category } = req.params;

        // Only show approved recipes
        const recipes = await Recipe.find({ category, status: 'approved' })
            .populate("requestedBy", "name pseudo")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: recipes.length,
            data: recipes
        });
    } catch (error) {
        console.error("Error in getRecipesByCategory:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch recipes",
            error: error.message
        });
    }
}

/**
 * Delete recipe
 * DELETE /api/recipes/:id
 */
export async function deleteRecipe(req, res) {
    try {
        const { id } = req.params;

        const recipe = await Recipe.findByIdAndDelete(id);

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Recipe deleted successfully"
        });
    } catch (error) {
        console.error("Error in deleteRecipe:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete recipe",
            error: error.message
        });
    }
}

/**
 * Create recipe (starts as PENDING)
 * POST /api/recipes
 */
export async function createRecipe(req, res) {
    try {
        const recipeData = {
            ...req.body,
            requestedBy: req.user.id,
            status: 'pending' // Always start as pending
        };

        // Parse JSON fields if they're strings
        if (typeof recipeData.ingredients === 'string') {
            recipeData.ingredients = JSON.parse(recipeData.ingredients);
        }
        if (typeof recipeData.instructions === 'string') {
            recipeData.instructions = JSON.parse(recipeData.instructions);
        }
        if (typeof recipeData.tags === 'string') {
            recipeData.tags = JSON.parse(recipeData.tags);
        }
        if (typeof recipeData.nutritionalInfo === 'string') {
            recipeData.nutritionalInfo = JSON.parse(recipeData.nutritionalInfo);
        }

        // Handle image upload
        if (req.file) {
            recipeData.image = `/uploads/${req.file.filename}`;
        }

        if (!recipeData.title || !recipeData.description || !recipeData.ingredients) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const recipe = await Recipe.create(recipeData);

        res.status(201).json({
            success: true,
            message: "Recipe submitted for approval",
            data: recipe
        });

    } catch (error) {
        console.error("Error in createRecipe:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create recipe",
            error: error.message
        });
    }
}

/**
 * Update recipe (resets to PENDING)
 * PUT /api/recipes/:id
 */
export async function updateRecipe(req, res) {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ success: false, message: "Recipe not found" });

        if (recipe.requestedBy.toString() !== req.user.id)
            return res.status(403).json({ success: false, message: "Access denied" });

        // Parse JSON fields if they're strings
        if (req.body.ingredients) {
            try {
                req.body.ingredients = typeof req.body.ingredients === 'string' 
                    ? JSON.parse(req.body.ingredients) 
                    : req.body.ingredients;
            } catch (parseError) {
                return res.status(400).json({ success: false, message: "Invalid JSON format for ingredients" });
            }
        }
        if (req.body.instructions) {
            try {
                req.body.instructions = typeof req.body.instructions === 'string' 
                    ? JSON.parse(req.body.instructions) 
                    : req.body.instructions;
            } catch (parseError) {
                return res.status(400).json({ success: false, message: "Invalid JSON format for instructions" });
            }
        }
        if (req.body.tags && typeof req.body.tags === 'string') {
            req.body.tags = JSON.parse(req.body.tags);
        }
        if (req.body.nutritionalInfo && typeof req.body.nutritionalInfo === 'string') {
            req.body.nutritionalInfo = JSON.parse(req.body.nutritionalInfo);
        }

        Object.assign(recipe, req.body);

        // Reset to pending after edit
        recipe.status = 'pending';
        recipe.rejectionReason = null;

        // Update image if uploaded
        if (req.file) {
            recipe.image = `/uploads/${req.file.filename}`;
        }

        await recipe.save();
        const populatedRecipe = await Recipe.findById(recipe._id).populate("requestedBy", "name email");
        
        res.status(200).json({ 
            success: true, 
            message: "Recipe updated and submitted for approval",
            data: populatedRecipe 
        });
    } catch (error) {
        console.error('Error in updateRecipe:', error);
        res.status(500).json({ success: false, message: error.message || "Failed to update recipe" });
    }
}

// ==================== ADMIN FUNCTIONS ====================

/**
 * Get all pending recipes (ADMIN ONLY)
 * GET /api/recipes/admin/pending
 */
export async function getPendingRecipes(req, res) {
    try {
        const pendingRecipes = await Recipe.find({ status: 'pending' })
            .populate("requestedBy", "name pseudo email")
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
 * Get all recipes (all statuses) - ADMIN ONLY
 * GET /api/recipes/admin/all
 */
export async function getAllRecipesAdmin(req, res) {
    try {
        const recipes = await Recipe.find()
            .populate("requestedBy", "name pseudo email")
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
 * Approve a recipe (ADMIN ONLY)
 * PATCH /api/recipes/:id/approve
 */
export async function approveRecipe(req, res) {
    try {
        const { id } = req.params;

        const recipe = await Recipe.findByIdAndUpdate(
            id,
            {
                status: 'approved',
                reviewedAt: new Date(),
                reviewedBy: req.user.id,
                rejectionReason: null
            },
            { new: true }
        ).populate("requestedBy", "name pseudo email");

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Recipe approved successfully",
            data: recipe
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
 * Reject a recipe (ADMIN ONLY)
 * PATCH /api/recipes/:id/reject
 */
export async function rejectRecipe(req, res) {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const recipe = await Recipe.findByIdAndUpdate(
            id,
            {
                status: 'rejected',
                rejectionReason: reason || 'No reason provided',
                reviewedAt: new Date(),
                reviewedBy: req.user.id
            },
            { new: true }
        ).populate("requestedBy", "name pseudo email");

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Recipe rejected",
            data: recipe
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