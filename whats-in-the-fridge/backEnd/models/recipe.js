import mongoose from "mongoose";

const recipeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Recipe title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    
    ingredients: [{
        name: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true, trim: true }
    }],
    
    instructions: [{
        step: { type: Number, required: true },
        description: { type: String, required: true }
    }],
    
    cookingTime: {
        type: Number,
        required: [true, 'Cooking time is required']
    },
    
    preparationTime: {
        type: Number,
        required: [true, 'Preparation time is required']
    },
    
    servings: {
        type: Number,
        required: true,
        min: [1, 'Servings must be at least 1']
    },
    
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    
    category: {
        type: String,
        enum: ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage'],
        required: true
    },
    
    tags: [{
        type: String,
        trim: true
    }],
    
    image: {
        type: String,
        default: ''
    },
    
    nutritionalInfo: {
        calories: { type: Number },
        protein: { type: Number },
        carbs: { type: Number },
        fat: { type: Number }
    },
    
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // ============ NEW FIELDS FOR APPROVAL SYSTEM ============
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    
    rejectionReason: {
        type: String,
        trim: true
    },
    
    reviewedAt: {
        type: Date
    },
    
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // ========================================================
    
    totalReviews: {
        type: Number,
        default: 0
    },
    
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    }
    
}, { timestamps: true });

// Indexes for performance
recipeSchema.index({ title: 'text', description: 'text' });
recipeSchema.index({ requestedBy: 1 });
recipeSchema.index({ category: 1 });
recipeSchema.index({ status: 1 }); // NEW: Index for status queries

export default mongoose.model('Recipe', recipeSchema);