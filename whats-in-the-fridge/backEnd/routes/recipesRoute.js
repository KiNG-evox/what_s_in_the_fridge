import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { adminAuthMiddleware } from "../middlewares/adminAuth.js";
import multer from "multer";
import path from "path";
import { 
    generateRecipeWithAI,
    getAllRecipes, 
    getRecipeById,
    getRecipesByCategory,
    deleteRecipe,
    createRecipe,
    updateRecipe,
    // Admin functions
    getPendingRecipes,
    getAllRecipesAdmin,
    approveRecipe,
    rejectRecipe
} from "../controllers/recipeController.js";

const router = Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Only accept images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"));
  }
};

const upload = multer({ storage, fileFilter });

// ==================== PUBLIC ROUTES ====================
// Generate recipes with AI (NOT saved to database)
router.post('/generate', generateRecipeWithAI);

// Get all APPROVED recipes (public)
router.get('/', getAllRecipes);

// Get recipes by category (only approved)
router.get('/category/:category', getRecipesByCategory);

// Get single recipe by ID
router.get('/:id', getRecipeById);

// ==================== USER ROUTES (AUTH REQUIRED) ====================
// Create recipe (starts as pending)
router.post('/', authMiddleware, upload.single("image"), createRecipe);

// Update recipe (resets to pending)
router.put('/:id', authMiddleware, upload.single("image"), updateRecipe);

// Delete recipe
router.delete('/:id', authMiddleware, deleteRecipe);

// ==================== ADMIN ROUTES ====================
// Get all recipes (all statuses) - must come BEFORE /:id to avoid conflicts
router.get('/admin/all', adminAuthMiddleware, getAllRecipesAdmin);

// Get pending recipes
router.get('/admin/pending', adminAuthMiddleware, getPendingRecipes);

// Approve recipe
router.patch('/:id/approve', adminAuthMiddleware, approveRecipe);

// Reject recipe
router.patch('/:id/reject', adminAuthMiddleware, rejectRecipe);

export { router as RouterRecipe };