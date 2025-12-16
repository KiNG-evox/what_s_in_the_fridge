import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export async function DbConnect() {
    try {
        // Use MONGO_URI from .env file
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/WhatsInTheFridge';
        
        await mongoose.connect(mongoUri);
        
        console.log("✅ Database Connected Successfully");
    } catch (error) {
        console.error("❌ Database Connection Failed:", error.message);
        process.exit(1);
    }
}