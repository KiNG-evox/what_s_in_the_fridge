import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    // Which user wrote this review
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Which recipe is being reviewed
    recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
        required: true
    },
    
    // Star rating: 1 to 5
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    
    // Written review/comment
    comment: {
        type: String,
        required: [true, 'Comment is required'],
        minlength: [10, 'Comment must be at least 10 characters'],
        maxlength: [500, 'Comment cannot exceed 500 characters']
    }
    
}, { timestamps: true });

// User can only review a recipe once
reviewSchema.index({ user: 1, recipe: 1 }, { unique: true });
reviewSchema.index({ recipe: 1, createdAt: -1 });

export default mongoose.model('Review', reviewSchema);