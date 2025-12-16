import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema({
    // Which user saved this favorite
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Which recipe did they favorite
    recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
        required: true
    },
    
    // Optional: User can add personal notes
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    }
    
}, { timestamps: true });

// Make sure user can't favorite same recipe twice
favoriteSchema.index({ user: 1, recipe: 1 }, { unique: true });

export default mongoose.model('Favorite', favoriteSchema);