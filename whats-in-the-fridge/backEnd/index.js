import dotenv from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import morgan from "morgan";
import path from "path";

// Import routes
import { RouterRecipe } from "./routes/recipesRoute.js";
import { RouterFavorites } from "./routes/favoritesRoute.js";
import { RouterReview } from "./routes/reviewRoute.js";
import { RouterAuth } from "./routes/authRoute.js";
import { RouterAdmin } from "./routes/adminRoute.js";

// Import middleware
import { errorHandler } from "./middlewares/errorHandler.js";

dotenv.config();
const app = express();

// Middlewares
app.use(morgan("dev"));      // Log HTTP requests
app.use(express.json());     // Parse JSON bodies
app.use(cors());             // Enable CORS for all origins

// Serve uploaded images
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

// Base route to test server
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to What's in the Fridge API",
    status: "Server is running ✅",
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/auth", RouterAuth);
app.use("/api/recipes", RouterRecipe);
app.use("/api/favorites", RouterFavorites);
app.use("/api/reviews", RouterReview);
app.use("/api/admin", RouterAdmin);

// 404 - Route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found ❌",
  });
});

// Global error handler (must come last)
app.use(errorHandler);

// Create HTTP server
const httpServer = http.createServer(app);
export { httpServer };
export default app;
